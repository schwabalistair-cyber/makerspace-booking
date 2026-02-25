import React, { useState } from 'react';
import './UserProfilePopup.css';
import { ALL_CERT_AREAS, CERT_GROUPS } from './certConfig';

function UserProfilePopup({ profile, onClose, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('info');
  const [newCertArea, setNewCertArea] = useState('');
  const [purchaseForm, setPurchaseForm] = useState({
    description: '', amount: '', type: 'invoice', dueDate: ''
  });

  if (!profile) return null;

  const { user, classes, certifications, purchases } = profile;
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const handleAddCert = async () => {
    if (!newCertArea) return;
    try {
      const res = await fetch(`/api/users/${user.id}/certifications`, {
        method: 'POST', headers,
        body: JSON.stringify({ shopArea: newCertArea })
      });
      if (res.ok) {
        setNewCertArea('');
        onProfileUpdate();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add certification');
      }
    } catch (err) {
      console.error('Error adding certification:', err);
    }
  };

  const handleRemoveCert = async (certId) => {
    try {
      const res = await fetch(`/api/users/${user.id}/certifications/${certId}`, {
        method: 'DELETE', headers
      });
      if (res.ok) onProfileUpdate();
    } catch (err) {
      console.error('Error removing certification:', err);
    }
  };

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (!purchaseForm.description || !purchaseForm.amount) return;
    try {
      const res = await fetch(`/api/users/${user.id}/purchases`, {
        method: 'POST', headers,
        body: JSON.stringify({
          description: purchaseForm.description,
          amount: parseFloat(purchaseForm.amount),
          type: purchaseForm.type,
          dueDate: purchaseForm.dueDate || null
        })
      });
      if (res.ok) {
        setPurchaseForm({ description: '', amount: '', type: 'invoice', dueDate: '' });
        onProfileUpdate();
      }
    } catch (err) {
      console.error('Error creating purchase:', err);
    }
  };

  const handleMarkPaid = async (purchaseId) => {
    try {
      const res = await fetch(`/api/users/${user.id}/purchases/${purchaseId}`, {
        method: 'PATCH', headers
      });
      if (res.ok) onProfileUpdate();
    } catch (err) {
      console.error('Error marking as paid:', err);
    }
  };

  const handleDeletePurchase = async (purchaseId) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      const res = await fetch(`/api/users/${user.id}/purchases/${purchaseId}`, {
        method: 'DELETE', headers
      });
      if (res.ok) onProfileUpdate();
    } catch (err) {
      console.error('Error deleting purchase:', err);
    }
  };

  // Filter out already-certified areas for the dropdown
  const certifiedAreas = certifications.map(c => c.shopArea);
  const availableAreas = ALL_CERT_AREAS.filter(a => !certifiedAreas.includes(a));

  const unpaidInvoices = purchases.filter(p => p.type === 'invoice' && p.status === 'unpaid');

  return (
    <>
      <div className="popup-overlay" onClick={onClose} />
      <div className="popup user-profile-popup">
        <div className="popup-header">
          <h2>{user.name}</h2>
          <button className="popup-close" onClick={onClose}>&times;</button>
        </div>

        <div className="profile-tabs">
          {['info', 'classes', 'certifications', 'purchases'].map(tab => (
            <button
              key={tab}
              className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="popup-body profile-body">

          {/* INFO TAB */}
          {activeTab === 'info' && (
            <div>
              <div className="popup-section">
                <h3>Personal Info</h3>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Account Type:</strong> {user.userType}</p>
                <p><strong>Instructor:</strong> {user.isInstructor ? 'Yes' : 'No'}</p>
                {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
                {user.address && <p><strong>Address:</strong> {user.address}</p>}
                {user.birthDate && <p><strong>Birth Date:</strong> {user.birthDate}</p>}
                <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              {(user.emergencyContactName || user.emergencyContactPhone) && (
                <div className="popup-section">
                  <h3>Emergency Contact</h3>
                  {user.emergencyContactName && <p><strong>Name:</strong> {user.emergencyContactName}</p>}
                  {user.emergencyContactPhone && <p><strong>Phone:</strong> {user.emergencyContactPhone}</p>}
                  {user.emergencyContactRelationship && <p><strong>Relationship:</strong> {user.emergencyContactRelationship}</p>}
                </div>
              )}
            </div>
          )}

          {/* CLASSES TAB */}
          {activeTab === 'classes' && (
            <div>
              <div className="popup-section">
                <h3>Class History ({classes.length})</h3>
                {classes.length === 0 ? (
                  <p className="empty-message">No classes enrolled</p>
                ) : (
                  classes.map((c, i) => (
                    <div key={i} className="profile-list-item">
                      <div className="list-item-title">{c.title}</div>
                      <div className="list-item-details">
                        {c.series && <span>Series: {c.series}</span>}
                        <span>Instructor: {c.instructor}</span>
                        {c.price != null && <span>Price: ${c.price}</span>}
                        {c.sessions && <span>Sessions: {c.sessions.length}</span>}
                        <span>Enrolled: {new Date(c.enrolledAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CERTIFICATIONS TAB */}
          {activeTab === 'certifications' && (
            <div>
              <div className="popup-section">
                <h3>Shop Certifications ({certifications.length})</h3>
                {certifications.length === 0 ? (
                  <p className="empty-message">No certifications yet</p>
                ) : (
                  certifications.map(cert => (
                    <div key={cert.id} className="profile-list-item cert-item">
                      <div>
                        <span className="cert-badge">{cert.shopArea}</span>
                        <span className="cert-detail">
                          Certified {new Date(cert.certifiedAt).toLocaleDateString()}
                          {cert.certifiedByName && ` by ${cert.certifiedByName}`}
                        </span>
                      </div>
                      <button className="remove-btn" onClick={() => handleRemoveCert(cert.id)}>Remove</button>
                    </div>
                  ))
                )}
              </div>
              {availableAreas.length > 0 && (
                <div className="popup-section">
                  <h3>Add Certification</h3>
                  <div className="add-cert-row">
                    <select value={newCertArea} onChange={e => setNewCertArea(e.target.value)}>
                      <option value="">-- Select certification --</option>
                      {CERT_GROUPS.map(({ group, areas }) => {
                        const groupAvailable = areas.filter(a => availableAreas.includes(a));
                        if (groupAvailable.length === 0) return null;
                        return (
                          <optgroup key={group} label={group}>
                            {groupAvailable.map(area => (
                              <option key={area} value={area}>{area}</option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                    <button className="add-btn" onClick={handleAddCert} disabled={!newCertArea}>Add</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PURCHASES TAB */}
          {activeTab === 'purchases' && (
            <div>
              {unpaidInvoices.length > 0 && (
                <div className="popup-section">
                  <h3>Outstanding Invoices ({unpaidInvoices.length})</h3>
                  {unpaidInvoices.map(p => (
                    <div key={p.id} className="profile-list-item purchase-item">
                      <div>
                        <div className="list-item-title">{p.description}</div>
                        <div className="list-item-details">
                          <span className="purchase-amount">${p.amount.toFixed(2)}</span>
                          {p.dueDate && <span>Due: {p.dueDate}</span>}
                          <span className="status-badge unpaid">Unpaid</span>
                        </div>
                      </div>
                      <div className="purchase-actions">
                        <button className="paid-btn" onClick={() => handleMarkPaid(p.id)}>Mark Paid</button>
                        <button className="remove-btn" onClick={() => handleDeletePurchase(p.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="popup-section">
                <h3>All Transactions ({purchases.length})</h3>
                {purchases.length === 0 ? (
                  <p className="empty-message">No transactions</p>
                ) : (
                  purchases.map(p => (
                    <div key={p.id} className="profile-list-item purchase-item">
                      <div>
                        <div className="list-item-title">{p.description}</div>
                        <div className="list-item-details">
                          <span className="purchase-amount">${p.amount.toFixed(2)}</span>
                          <span className="type-label">{p.type}</span>
                          <span className={`status-badge ${p.status}`}>{p.status}</span>
                          <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="purchase-actions">
                        {p.status === 'unpaid' && (
                          <button className="paid-btn" onClick={() => handleMarkPaid(p.id)}>Mark Paid</button>
                        )}
                        <button className="remove-btn" onClick={() => handleDeletePurchase(p.id)}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="popup-section">
                <h3>New Invoice / Purchase</h3>
                <form className="purchase-form" onSubmit={handleCreatePurchase}>
                  <div>
                    <label>Description:</label>
                    <input
                      type="text"
                      value={purchaseForm.description}
                      onChange={e => setPurchaseForm({ ...purchaseForm, description: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label>Amount ($):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={purchaseForm.amount}
                      onChange={e => setPurchaseForm({ ...purchaseForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label>Type:</label>
                    <select
                      value={purchaseForm.type}
                      onChange={e => setPurchaseForm({ ...purchaseForm, type: e.target.value })}
                    >
                      <option value="invoice">Invoice (unpaid)</option>
                      <option value="purchase">Purchase (paid now)</option>
                    </select>
                  </div>
                  {purchaseForm.type === 'invoice' && (
                    <div>
                      <label>Due Date:</label>
                      <input
                        type="date"
                        value={purchaseForm.dueDate}
                        onChange={e => setPurchaseForm({ ...purchaseForm, dueDate: e.target.value })}
                      />
                    </div>
                  )}
                  <button type="submit" className="add-btn">Create</button>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="popup-footer">
          <button className="popup-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}

export default UserProfilePopup;
