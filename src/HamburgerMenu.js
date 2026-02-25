import React, { useState } from 'react';
import './HamburgerMenu.css';
import { CERT_REQUIREMENTS, ALL_CERT_AREAS } from './certConfig';

const TIME_SLOTS = [
  '8am - 9am', '9am - 10am', '10am - 11am', '11am - 12pm',
  '12pm - 1pm', '1pm - 2pm', '2pm - 3pm', '3pm - 4pm',
  '4pm - 5pm', '5pm - 6pm', '6pm - 7pm', '7pm - 8pm', '8pm - 9pm'
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
};

function HamburgerMenu({ user, onClose, onLogout, onAdminDashboard }) {
  const [activeView, setActiveView] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [certs, setCerts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Booking detail state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modifying, setModifying] = useState(false);
  const [modifyDate, setModifyDate] = useState('');
  const [modifyTimeSlot, setModifyTimeSlot] = useState('');
  const [actionError, setActionError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Class detail state
  const [selectedClass, setSelectedClass] = useState(null);
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  // Address edit state
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ streetAddress: '', state: '', zipCode: '' });
  const [addressError, setAddressError] = useState('');
  const [addressSaving, setAddressSaving] = useState(false);

  // Emergency contact edit state
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({ emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: '' });
  const [emergencyError, setEmergencyError] = useState('');
  const [emergencySaving, setEmergencySaving] = useState(false);

  const viewTitles = {
    bookings: 'Bookings',
    classes: 'Classes',
    certifications: 'Certifications',
    billing: 'Billing',
    info: 'My Info',
  };

  const today = new Date().toISOString().split('T')[0];

  const handleViewChange = async (view) => {
    setActiveView(view);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    if (view === 'bookings' && bookings.length === 0) {
      setLoading(true);
      try {
        const res = await fetch('/api/bookings', { headers });
        const data = await res.json();
        const userBookings = Array.isArray(data)
          ? data.filter(b => b.userId === user.id || b.userEmail === user.email)
          : [];
        setBookings(userBookings.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (e) {
        setBookings([]);
      }
      setLoading(false);
    }

    if (view === 'classes' && classes.length === 0) {
      setLoading(true);
      try {
        const res = await fetch('/api/classes', { headers });
        const data = await res.json();
        const upcoming = Array.isArray(data)
          ? data
              .filter(c => c.sessions?.some(s => s.date >= today))
              .sort((a, b) => {
                const aDate = a.sessions?.[0]?.date || '';
                const bDate = b.sessions?.[0]?.date || '';
                return aDate.localeCompare(bDate);
              })
          : [];
        setClasses(upcoming);
      } catch (e) {
        setClasses([]);
      }
      setLoading(false);
    }

    if (view === 'certifications' && certs.length === 0) {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${user.id}/certifications`, { headers });
        const data = await res.json();
        setCerts(Array.isArray(data) ? data : []);
      } catch (e) {
        setCerts([]);
      }
      setLoading(false);
    }

    if (view === 'billing' && purchases.length === 0) {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${user.id}/purchases`, { headers });
        const data = await res.json();
        setPurchases(Array.isArray(data) ? data : []);
      } catch (e) {
        setPurchases([]);
      }
      setLoading(false);
    }

    if (view === 'info' && !userData) {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${user.id}/profile`, { headers });
        const data = await res.json();
        setUserData(data.user || data);
      } catch (e) {
        setUserData(user);
      }
      setLoading(false);
    }
  };

  // Booking detail handlers
  const handleSelectBooking = (b) => {
    setSelectedBooking(b);
    setModifying(false);
    setConfirmCancel(false);
    setActionError('');
  };

  const handleBackFromDetail = () => {
    setSelectedBooking(null);
    setModifying(false);
    setConfirmCancel(false);
    setActionError('');
  };

  const handleCancelBooking = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || 'Failed to cancel booking');
        return;
      }
      setBookings(prev => prev.filter(b => b.id !== selectedBooking.id));
      handleBackFromDetail();
    } catch (e) {
      setActionError('Failed to cancel booking');
    }
  };

  const handleModifyBooking = async () => {
    if (!modifyDate || !modifyTimeSlot) {
      setActionError('Please select a date and time slot');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: modifyDate, timeSlot: modifyTimeSlot })
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to modify booking');
        return;
      }
      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? data : b));
      setSelectedBooking(data);
      setModifying(false);
      setActionError('');
    } catch (e) {
      setActionError('Failed to modify booking');
    }
  };

  // Class detail handlers
  const handleSelectClass = (c) => {
    setSelectedClass(c);
    setEnrollError('');
    setEnrollSuccess(false);
  };

  const handleBackFromClassDetail = () => {
    setSelectedClass(null);
    setEnrollError('');
    setEnrollSuccess(false);
  };

  const handleEnroll = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/classes/${selectedClass.id}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userName: user.name, userEmail: user.email })
      });
      const data = await res.json();
      if (!res.ok) {
        setEnrollError(data.error || 'Failed to enroll');
        return;
      }
      setClasses(prev => prev.map(c => c.id === selectedClass.id ? data : c));
      setSelectedClass(data);
      setEnrollSuccess(true);
      setEnrollError('');
    } catch (e) {
      setEnrollError('Failed to enroll');
    }
  };

  const handleSaveAddress = async () => {
    setAddressSaving(true);
    setAddressError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setAddressError(data.error || 'Failed to save address');
        setAddressSaving(false);
        return;
      }
      setUserData(prev => ({ ...prev, ...addressForm }));
      setEditingAddress(false);
    } catch (e) {
      setAddressError('Failed to save address');
    }
    setAddressSaving(false);
  };

  const handleSaveEmergencyContact = async () => {
    setEmergencySaving(true);
    setEmergencyError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(emergencyForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setEmergencyError(data.error || 'Failed to save');
        setEmergencySaving(false);
        return;
      }
      setUserData(prev => ({ ...prev, ...emergencyForm }));
      setEditingEmergency(false);
    } catch (e) {
      setEmergencyError('Failed to save');
    }
    setEmergencySaving(false);
  };

  const upcomingBookings = bookings.filter(b => b.date >= today);
  const pastBookings = bookings.filter(b => b.date < today);

  const isUpcoming = selectedBooking && selectedBooking.date >= today;

  const headerTitle = () => {
    if (!activeView) return `Welcome, ${user.name}`;
    if (selectedBooking) return 'Booking Details';
    if (selectedClass) return 'Class Details';
    return viewTitles[activeView];
  };

  const handleBack = () => {
    if (selectedBooking) handleBackFromDetail();
    else if (selectedClass) handleBackFromClassDetail();
    else setActiveView(null);
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">

        <div className="drawer-header">
          {activeView ? (
            <button className="drawer-back-btn" onClick={handleBack}>&#8592;</button>
          ) : (
            <button className="drawer-close-btn" onClick={onClose}>&times;</button>
          )}
          <span className="drawer-title">{headerTitle()}</span>
        </div>

        <div className="drawer-body">
          {loading && <div className="drawer-loading">Loading...</div>}

          {!loading && activeView === null && (
            <>
              <nav className="drawer-nav">
                {user.userType === 'admin' && (
                  <button className="drawer-nav-item drawer-nav-item--admin" onClick={onAdminDashboard}>
                    Admin Dashboard
                    <span className="drawer-nav-arrow">&#8250;</span>
                  </button>
                )}
                {['bookings', 'classes', 'certifications', 'billing', 'info'].map(v => (
                  <button key={v} className="drawer-nav-item" onClick={() => handleViewChange(v)}>
                    {viewTitles[v]}
                    <span className="drawer-nav-arrow">&#8250;</span>
                  </button>
                ))}
              </nav>
              <div className="drawer-footer">
                <button className="drawer-logout-btn" onClick={onLogout}>Logout</button>
              </div>
            </>
          )}

          {/* Bookings list */}
          {!loading && activeView === 'bookings' && !selectedBooking && (
            <div className="drawer-view">
              <div className="drawer-section-title">Upcoming</div>
              {upcomingBookings.length === 0 && (
                <p className="drawer-empty">No upcoming bookings.</p>
              )}
              {upcomingBookings.map((b, i) => (
                <div key={i} className="drawer-booking-item" onClick={() => handleSelectBooking(b)}>
                  <div className="drawer-item-main">{formatDate(b.date)} &mdash; {b.timeSlot}</div>
                  <div className="drawer-item-detail">{b.shopArea}{b.rateLabel ? ` · ${b.rateLabel}` : ''}</div>
                </div>
              ))}

              <div className="drawer-section-title">Past</div>
              {pastBookings.length === 0 && (
                <p className="drawer-empty">No past bookings.</p>
              )}
              {pastBookings.map((b, i) => (
                <div key={i} className="drawer-booking-item" onClick={() => handleSelectBooking(b)}>
                  <div className="drawer-item-main">{formatDate(b.date)} &mdash; {b.timeSlot}</div>
                  <div className="drawer-item-detail">{b.shopArea}{b.rateLabel ? ` · ${b.rateLabel}` : ''}</div>
                </div>
              ))}
            </div>
          )}

          {/* Booking detail */}
          {!loading && activeView === 'bookings' && selectedBooking && (
            <div className="drawer-view">
              <div className="drawer-detail-field">
                <div className="drawer-info-label">Area</div>
                <div className="drawer-info-value">{selectedBooking.shopArea}</div>
              </div>
              <div className="drawer-detail-field">
                <div className="drawer-info-label">Date</div>
                <div className="drawer-info-value">{formatDate(selectedBooking.date)}</div>
              </div>
              <div className="drawer-detail-field">
                <div className="drawer-info-label">Time</div>
                <div className="drawer-info-value">{selectedBooking.timeSlot}</div>
              </div>
              {selectedBooking.rateLabel && (
                <div className="drawer-detail-field">
                  <div className="drawer-info-label">Rate</div>
                  <div className="drawer-info-value">{selectedBooking.rateLabel}</div>
                </div>
              )}

              {isUpcoming && (
                <>
                  {!modifying && !confirmCancel && (
                    <div className="drawer-detail-actions">
                      <button
                        className="drawer-action-btn"
                        onClick={() => {
                          setModifyDate(selectedBooking.date);
                          setModifyTimeSlot(selectedBooking.timeSlot);
                          setModifying(true);
                          setActionError('');
                        }}
                      >
                        Modify
                      </button>
                      <button
                        className="drawer-cancel-btn"
                        onClick={() => { setConfirmCancel(true); setActionError(''); }}
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}

                  {modifying && (
                    <div className="drawer-modify-form">
                      <div className="drawer-info-label">New Date</div>
                      <input
                        type="date"
                        className="drawer-modify-input"
                        value={modifyDate}
                        min={today}
                        onChange={e => setModifyDate(e.target.value)}
                      />
                      <div className="drawer-info-label">New Time Slot</div>
                      <select
                        className="drawer-modify-select"
                        value={modifyTimeSlot}
                        onChange={e => setModifyTimeSlot(e.target.value)}
                      >
                        {TIME_SLOTS.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                      {actionError && <div className="drawer-error">{actionError}</div>}
                      <div className="drawer-modify-actions">
                        <button className="drawer-action-btn" onClick={handleModifyBooking}>Save</button>
                        <button
                          className="drawer-modify-cancel"
                          onClick={() => { setModifying(false); setActionError(''); }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {confirmCancel && (
                    <div className="drawer-confirm-bar">
                      <p className="drawer-confirm-text">Are you sure you want to cancel this booking?</p>
                      {actionError && <div className="drawer-error">{actionError}</div>}
                      <div className="drawer-confirm-actions">
                        <button className="drawer-cancel-btn" onClick={handleCancelBooking}>Yes, Cancel</button>
                        <button
                          className="drawer-modify-cancel"
                          onClick={() => { setConfirmCancel(false); setActionError(''); }}
                        >
                          No, Keep It
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Classes list */}
          {!loading && activeView === 'classes' && !selectedClass && (
            <div className="drawer-view">
              {classes.length === 0 && (
                <p className="drawer-empty">No upcoming classes available.</p>
              )}
              {classes.map((c, i) => {
                const spotsLeft = c.maxCapacity - (c.enrolledStudents?.length || 0);
                const nextSession = c.sessions?.[0];
                return (
                  <div key={i} className="drawer-booking-item" onClick={() => handleSelectClass(c)}>
                    <div className="drawer-class-item-header">
                      <div className="drawer-item-main">{c.title}</div>
                      {c.series && <span className="drawer-class-series">{c.series}</span>}
                    </div>
                    <div className="drawer-item-detail">
                      {nextSession && `${formatDate(nextSession.date)}`}
                      {c.price != null && ` · $${c.price}`}
                    </div>
                    <div className="drawer-item-detail">
                      {c.instructor} · {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left` : 'Full'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Class detail */}
          {!loading && activeView === 'classes' && selectedClass && (
            <div className="drawer-view">
              {selectedClass.series && (
                <span className="drawer-class-series-tag">{selectedClass.series}</span>
              )}
              <div className="drawer-detail-field">
                <div className="drawer-info-label">Class</div>
                <div className="drawer-info-value">{selectedClass.title}</div>
              </div>
              <div className="drawer-detail-field">
                <div className="drawer-info-label">Instructor</div>
                <div className="drawer-info-value">{selectedClass.instructor}</div>
              </div>
              <div className="drawer-detail-field">
                <div className="drawer-info-label">{selectedClass.sessions?.length > 1 ? 'Sessions' : 'Session'}</div>
                <div className="drawer-info-value">
                  {selectedClass.sessions?.map((s, i) => (
                    <div key={i}>{formatDate(s.date)} at {formatTime(s.time)}</div>
                  ))}
                </div>
              </div>
              <div className="drawer-detail-field">
                <div className="drawer-info-label">Duration</div>
                <div className="drawer-info-value">{selectedClass.duration}</div>
              </div>
              <div className="drawer-detail-field">
                <div className="drawer-info-label">Price</div>
                <div className="drawer-info-value">${selectedClass.price}</div>
              </div>
              <div className="drawer-detail-field">
                <div className="drawer-info-label">Availability</div>
                <div className="drawer-info-value">
                  {selectedClass.enrolledStudents?.length || 0} / {selectedClass.maxCapacity} enrolled
                </div>
              </div>
              {selectedClass.description && (
                <div className="drawer-detail-field">
                  <div className="drawer-info-label">Description</div>
                  <div className="drawer-info-value">{selectedClass.description}</div>
                </div>
              )}
              {selectedClass.prerequisites && (
                <div className="drawer-detail-field">
                  <div className="drawer-info-label">Prerequisites</div>
                  <div className="drawer-info-value">{selectedClass.prerequisites}</div>
                </div>
              )}

              <div className="drawer-enroll-section">
                {enrollSuccess && (
                  <div className="drawer-enroll-success">You're enrolled in this class!</div>
                )}
                {enrollError && <div className="drawer-error">{enrollError}</div>}
                {!enrollSuccess && (() => {
                  const isEnrolled = selectedClass.enrolledStudents?.some(
                    s => s.userId === user.id || s.userEmail === user.email
                  );
                  const isFull = (selectedClass.enrolledStudents?.length || 0) >= selectedClass.maxCapacity;
                  if (isEnrolled) return <div className="drawer-enrolled-badge">You're enrolled</div>;
                  if (isFull) return <div className="drawer-full-badge">Class is full</div>;
                  return (
                    <button className="drawer-action-btn" onClick={handleEnroll}>
                      Enroll in Class
                    </button>
                  );
                })()}
              </div>
            </div>
          )}

          {!loading && activeView === 'certifications' && (
            <div className="drawer-view">
              <div className="drawer-section-title">Earned Certifications</div>
              {certs.length === 0 ? (
                <p className="drawer-empty">No certifications yet.</p>
              ) : (
                certs.map((cert, i) => (
                  <div key={i} className="drawer-item">
                    <span className="drawer-cert-badge earned">{cert.shopArea}</span>
                    {cert.certifiedAt && (
                      <div className="drawer-item-detail">
                        Certified {new Date(cert.certifiedAt).toLocaleDateString()}
                        {cert.certifiedByName && ` by ${cert.certifiedByName}`}
                      </div>
                    )}
                  </div>
                ))
              )}

              {(() => {
                const earnedAreas = certs.map(c => c.shopArea);
                const unearnedAreas = ALL_CERT_AREAS.filter(a => !earnedAreas.includes(a));
                if (unearnedAreas.length === 0) return null;
                return (
                  <>
                    <div className="drawer-section-title">Available Certifications</div>
                    {unearnedAreas.map((area, i) => {
                      const req = CERT_REQUIREMENTS[area];
                      return (
                        <div key={i} className="drawer-item">
                          <span className="drawer-cert-badge unearned">{area}</span>
                          <div className="drawer-item-detail">{req.message}</div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          )}

          {!loading && activeView === 'billing' && (
            <div className="drawer-view">
              {(() => {
                const unpaid = purchases.filter(p => p.type === 'invoice' && p.status === 'unpaid');
                return (
                  <>
                    {unpaid.length > 0 && (
                      <>
                        <div className="drawer-section-title">Outstanding</div>
                        {unpaid.map((p, i) => (
                          <div key={i} className="drawer-item">
                            <div className="drawer-billing-row">
                              <div className="drawer-item-main">{p.description}</div>
                              <span className="drawer-billing-amount">${p.amount}</span>
                            </div>
                            <div className="drawer-item-detail">
                              <span className="drawer-status-unpaid">Unpaid</span>
                              {p.date ? ` · ${p.date}` : ''}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    <div className="drawer-section-title">All Transactions</div>
                    {purchases.length === 0 && (
                      <p className="drawer-empty">No transactions on file.</p>
                    )}
                    {purchases.map((p, i) => (
                      <div key={i} className="drawer-item">
                        <div className="drawer-billing-row">
                          <div className="drawer-item-main">{p.description}</div>
                          <span className="drawer-billing-amount">${p.amount}</span>
                        </div>
                        <div className="drawer-item-detail">
                          {p.status === 'paid'
                            ? <span className="drawer-status-paid">Paid</span>
                            : <span className="drawer-status-unpaid">Unpaid</span>
                          }
                          {p.date ? ` · ${p.date}` : ''}
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          )}

          {!loading && activeView === 'info' && (
            <div className="drawer-view">

              {/* Personal Info card */}
              <div className="drawer-info-card">
                <div className="drawer-section-title">Personal Info</div>
                <div className="drawer-info-label">Name</div>
                <div className="drawer-info-value">{userData?.name || user.name}</div>
                <div className="drawer-info-label">Email</div>
                <div className="drawer-info-value">{userData?.email || user.email}</div>
                <div className="drawer-info-label">Member Type</div>
                <div className="drawer-info-value">{userData?.userType || user.userType}</div>
                {userData?.phone && (
                  <>
                    <div className="drawer-info-label">Phone</div>
                    <div className="drawer-info-value">{userData.phone}</div>
                  </>
                )}
                {userData?.birthDate && (
                  <>
                    <div className="drawer-info-label">Date of Birth</div>
                    <div className="drawer-info-value">{userData.birthDate}</div>
                  </>
                )}
              </div>

              {/* My Address card */}
              <div className="drawer-info-card">
                <div className="drawer-section-title-row">
                  <span className="drawer-section-title">My Address</span>
                  {!editingAddress && (
                    <button
                      className="drawer-edit-btn"
                      onClick={() => {
                        setAddressForm({
                          streetAddress: userData?.streetAddress || '',
                          state: userData?.state || '',
                          zipCode: userData?.zipCode || ''
                        });
                        setAddressError('');
                        setEditingAddress(true);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>

                {!editingAddress ? (
                  <>
                    <div className="drawer-info-label">Street</div>
                    <div className="drawer-info-value">{userData?.streetAddress || '—'}</div>
                    <div className="drawer-info-label">State</div>
                    <div className="drawer-info-value">{userData?.state || '—'}</div>
                    <div className="drawer-info-label">Zip Code</div>
                    <div className="drawer-info-value">{userData?.zipCode || '—'}</div>
                  </>
                ) : (
                  <>
                    <div className="drawer-info-label">Street</div>
                    <input
                      className="drawer-modify-input"
                      type="text"
                      placeholder="123 Main St"
                      value={addressForm.streetAddress}
                      onChange={e => setAddressForm(f => ({ ...f, streetAddress: e.target.value }))}
                    />
                    <div className="drawer-info-label">State</div>
                    <input
                      className="drawer-modify-input"
                      type="text"
                      placeholder="e.g. CA"
                      value={addressForm.state}
                      onChange={e => setAddressForm(f => ({ ...f, state: e.target.value }))}
                    />
                    <div className="drawer-info-label">Zip Code</div>
                    <input
                      className="drawer-modify-input"
                      type="text"
                      placeholder="e.g. 90210"
                      value={addressForm.zipCode}
                      onChange={e => setAddressForm(f => ({ ...f, zipCode: e.target.value }))}
                    />
                    {addressError && <div className="drawer-error">{addressError}</div>}
                    <div className="drawer-modify-actions">
                      <button className="drawer-action-btn" onClick={handleSaveAddress} disabled={addressSaving}>
                        {addressSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button className="drawer-modify-cancel" onClick={() => { setEditingAddress(false); setAddressError(''); }}>
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Emergency Contact card */}
              <div className="drawer-info-card">
                <div className="drawer-section-title-row">
                  <span className="drawer-section-title">Emergency Contact</span>
                  {!editingEmergency && (
                    <button
                      className="drawer-edit-btn"
                      onClick={() => {
                        setEmergencyForm({
                          emergencyContactName: userData?.emergencyContactName || '',
                          emergencyContactPhone: userData?.emergencyContactPhone || '',
                          emergencyContactRelationship: userData?.emergencyContactRelationship || ''
                        });
                        setEmergencyError('');
                        setEditingEmergency(true);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>

                {!editingEmergency ? (
                  <>
                    <div className="drawer-info-label">Name</div>
                    <div className="drawer-info-value">{userData?.emergencyContactName || '—'}</div>
                    <div className="drawer-info-label">Phone</div>
                    <div className="drawer-info-value">{userData?.emergencyContactPhone || '—'}</div>
                    <div className="drawer-info-label">Relationship</div>
                    <div className="drawer-info-value">{userData?.emergencyContactRelationship || '—'}</div>
                  </>
                ) : (
                  <>
                    <div className="drawer-info-label">Name</div>
                    <input
                      className="drawer-modify-input"
                      type="text"
                      placeholder="Full name"
                      value={emergencyForm.emergencyContactName}
                      onChange={e => setEmergencyForm(f => ({ ...f, emergencyContactName: e.target.value }))}
                    />
                    <div className="drawer-info-label">Phone</div>
                    <input
                      className="drawer-modify-input"
                      type="text"
                      placeholder="Phone number"
                      value={emergencyForm.emergencyContactPhone}
                      onChange={e => setEmergencyForm(f => ({ ...f, emergencyContactPhone: e.target.value }))}
                    />
                    <div className="drawer-info-label">Relationship</div>
                    <input
                      className="drawer-modify-input"
                      type="text"
                      placeholder="e.g. Spouse, Parent"
                      value={emergencyForm.emergencyContactRelationship}
                      onChange={e => setEmergencyForm(f => ({ ...f, emergencyContactRelationship: e.target.value }))}
                    />
                    {emergencyError && <div className="drawer-error">{emergencyError}</div>}
                    <div className="drawer-modify-actions">
                      <button className="drawer-action-btn" onClick={handleSaveEmergencyContact} disabled={emergencySaving}>
                        {emergencySaving ? 'Saving...' : 'Save'}
                      </button>
                      <button className="drawer-modify-cancel" onClick={() => { setEditingEmergency(false); setEmergencyError(''); }}>
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default HamburgerMenu;
