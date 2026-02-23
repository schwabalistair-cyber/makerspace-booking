import React, { useState } from 'react';
import './HamburgerMenu.css';

function HamburgerMenu({ user, onClose, onLogout }) {
  const [activeView, setActiveView] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [certs, setCerts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const upcomingBookings = bookings.filter(b => b.date >= today);
  const pastBookings = bookings.filter(b => b.date < today);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">

        <div className="drawer-header">
          {activeView ? (
            <button className="drawer-back-btn" onClick={() => setActiveView(null)}>&#8592;</button>
          ) : (
            <button className="drawer-close-btn" onClick={onClose}>&times;</button>
          )}
          <span className="drawer-title">
            {activeView ? viewTitles[activeView] : user.name}
          </span>
        </div>

        <div className="drawer-body">
          {loading && <div className="drawer-loading">Loading...</div>}

          {!loading && activeView === null && (
            <>
              <nav className="drawer-nav">
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

          {!loading && activeView === 'bookings' && (
            <div className="drawer-view">
              <div className="drawer-section-title">Upcoming</div>
              {upcomingBookings.length === 0 && (
                <p className="drawer-empty">No upcoming bookings.</p>
              )}
              {upcomingBookings.map((b, i) => (
                <div key={i} className="drawer-item">
                  <div className="drawer-item-main">{b.date} &mdash; {b.timeSlot}</div>
                  <div className="drawer-item-detail">{b.shopArea}{b.rateLabel ? ` · ${b.rateLabel}` : ''}</div>
                </div>
              ))}

              <div className="drawer-section-title">Past</div>
              {pastBookings.length === 0 && (
                <p className="drawer-empty">No past bookings.</p>
              )}
              {pastBookings.map((b, i) => (
                <div key={i} className="drawer-item">
                  <div className="drawer-item-main">{b.date} &mdash; {b.timeSlot}</div>
                  <div className="drawer-item-detail">{b.shopArea}{b.rateLabel ? ` · ${b.rateLabel}` : ''}</div>
                </div>
              ))}
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
