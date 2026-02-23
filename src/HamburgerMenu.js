import React, { useState } from 'react';
import './HamburgerMenu.css';

const TIME_SLOTS = [
  '8am - 9am', '9am - 10am', '10am - 11am', '11am - 12pm',
  '12pm - 1pm', '1pm - 2pm', '2pm - 3pm', '3pm - 4pm',
  '4pm - 5pm', '5pm - 6pm', '6pm - 7pm', '7pm - 8pm', '8pm - 9pm'
];

function HamburgerMenu({ user, onClose, onLogout, onAdminDashboard }) {
  const [activeView, setActiveView] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [certs, setCerts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modifying, setModifying] = useState(false);
  const [modifyDate, setModifyDate] = useState('');
  const [modifyTimeSlot, setModifyTimeSlot] = useState('');
  const [actionError, setActionError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const viewTitles = {
    bookings: 'Bookings',
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

  const upcomingBookings = bookings.filter(b => b.date >= today);
  const pastBookings = bookings.filter(b => b.date < today);

  const isUpcoming = selectedBooking && selectedBooking.date >= today;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">

        <div className="drawer-header">
          {activeView ? (
            <button
              className="drawer-back-btn"
              onClick={selectedBooking ? handleBackFromDetail : () => setActiveView(null)}
            >&#8592;</button>
          ) : (
            <button className="drawer-close-btn" onClick={onClose}>&times;</button>
          )}
          <span className="drawer-title">
            {activeView
              ? (selectedBooking ? 'Booking Details' : viewTitles[activeView])
              : user.name}
          </span>
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
                {['bookings', 'certifications', 'billing', 'info'].map(v => (
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

          {!loading && activeView === 'bookings' && !selectedBooking && (
            <div className="drawer-view">
              <div className="drawer-section-title">Upcoming</div>
              {upcomingBookings.length === 0 && (
                <p className="drawer-empty">No upcoming bookings.</p>
              )}
              {upcomingBookings.map((b, i) => (
                <div key={i} className="drawer-booking-item" onClick={() => handleSelectBooking(b)}>
                  <div className="drawer-item-main">{b.date} &mdash; {b.timeSlot}</div>
                  <div className="drawer-item-detail">{b.shopArea}{b.rateLabel ? ` · ${b.rateLabel}` : ''}</div>
                </div>
              ))}

              <div className="drawer-section-title">Past</div>
              {pastBookings.length === 0 && (
                <p className="drawer-empty">No past bookings.</p>
              )}
              {pastBookings.map((b, i) => (
                <div key={i} className="drawer-booking-item" onClick={() => handleSelectBooking(b)}>
                  <div className="drawer-item-main">{b.date} &mdash; {b.timeSlot}</div>
                  <div className="drawer-item-detail">{b.shopArea}{b.rateLabel ? ` · ${b.rateLabel}` : ''}</div>
                </div>
              ))}
            </div>
          )}

          {!loading && activeView === 'bookings' && selectedBooking && (
            <div className="drawer-view">
              <div className="drawer-detail-field">
                <div className="drawer-info-label">Area</div>
                <div className="drawer-info-value">{selectedBooking.shopArea}</div>
              </div>
              <div className="drawer-detail-field">
                <div className="drawer-info-label">Date</div>
                <div className="drawer-info-value">{selectedBooking.date}</div>
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

          {!loading && activeView === 'certifications' && (
            <div className="drawer-view">
              {certs.length === 0 && (
                <p className="drawer-empty">No certifications yet.</p>
              )}
              {certs.map((cert, i) => (
                <div key={i} className="drawer-item">
                  <span className="drawer-cert-badge">{cert.shopArea || cert.name || cert}</span>
                  {cert.certifiedDate && (
                    <div className="drawer-item-detail">Certified: {cert.certifiedDate}</div>
                  )}
                </div>
              ))}
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
              <div className="drawer-section-title">Personal</div>
              <div className="drawer-info-label">Name</div>
              <div className="drawer-info-value">{userData?.name || user.name}</div>
              <div className="drawer-info-label">Email</div>
              <div className="drawer-info-value">{userData?.email || user.email}</div>
              <div className="drawer-info-label">Member Type</div>
              <div className="drawer-info-value">{userData?.userType || user.userType}</div>
              {(userData?.phone) && (
                <>
                  <div className="drawer-info-label">Phone</div>
                  <div className="drawer-info-value">{userData.phone}</div>
                </>
              )}
              {(userData?.address) && (
                <>
                  <div className="drawer-info-label">Address</div>
                  <div className="drawer-info-value">{userData.address}</div>
                </>
              )}
              {(userData?.birthDate) && (
                <>
                  <div className="drawer-info-label">Date of Birth</div>
                  <div className="drawer-info-value">{userData.birthDate}</div>
                </>
              )}

              {(userData?.emergencyContactName) && (
                <>
                  <div className="drawer-section-title">Emergency Contact</div>
                  <div className="drawer-info-label">Name</div>
                  <div className="drawer-info-value">{userData.emergencyContactName}</div>
                  <div className="drawer-info-label">Phone</div>
                  <div className="drawer-info-value">{userData.emergencyContactPhone}</div>
                  {userData.emergencyContactRelationship && (
                    <>
                      <div className="drawer-info-label">Relationship</div>
                      <div className="drawer-info-value">{userData.emergencyContactRelationship}</div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default HamburgerMenu;
