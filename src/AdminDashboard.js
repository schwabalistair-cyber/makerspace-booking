import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import BookingCalendar from './BookingCalendar';
import WeeklyCalendar from './WeeklyCalendar';
import BookingPopup from './BookingPopup';
import ClassesManager from './ClassesManager';
import UserProfilePopup from './UserProfilePopup';

function AdminDashboard({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookingForUser, setBookingForUser] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  useEffect(() => {
    fetchBookings();
    fetchUsers();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setBookings(bookings.filter(b => b.id !== bookingId));
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleChangeUserType = async (userId, newType) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userType: newType })
      });
      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, userType: newType } : u));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleToggleInstructor = async (userId, isInstructor) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isInstructor })
      });
      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isInstructor } : u));
      }
    } catch (error) {
      console.error('Error updating instructor status:', error);
    }
  };

  const handleUserClick = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!selectedUserProfile) return;
    try {
      const response = await fetch(`/api/users/${selectedUserProfile.user.id}/profile`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedUserProfile(data);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const handleBookForClient = async (slotData) => {
    if (!bookingForUser) {
      alert('Please select a client first');
      return;
    }

    const bookingData = {
      name: bookingForUser.name,
      email: bookingForUser.email,
      userId: bookingForUser.id,
      userType: bookingForUser.userType,
      date: slotData.date,
      timeSlot: slotData.timeSlot,
      shopArea: slotData.shopArea,
      rateCharged: slotData.rateCharged,
      rateLabel: slotData.rateLabel,
      bookedByAdmin: true,
      adminId: user.id
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bookingData)
      });
      if (response.ok) {
        alert(`Booking confirmed for ${bookingForUser.name}!`);
        fetchBookings();
        setActiveTab('bookings');
        setBookingForUser(null);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  // Calculate revenue stats
  const getRevenueStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    const todayBookings = bookings.filter(b => b.date === today);
    const monthBookings = bookings.filter(b => b.date?.startsWith(thisMonth));

    const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.rateCharged || 0), 0);
    const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.rateCharged || 0), 0);
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.rateCharged || 0), 0);

    return { todayRevenue, monthRevenue, totalRevenue, todayBookings, monthBookings };
  };

  const stats = getRevenueStats();

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Admin Dashboard</h1>
          <img src="/diycave-logo.svg" alt="DIY Cave" className="header-logo" />
        </div>
        <button className="back-button" onClick={onBack}>
          ← Back to Booking
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'bookings' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('bookings')}
        >
          📅 Bookings
        </button>
        <button
          className={activeTab === 'users' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={activeTab === 'book-for-client' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('book-for-client')}
        >
          ✏️ Book for Client
        </button>
        <button
          className={activeTab === 'revenue' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('revenue')}
        >
          💰 Revenue
        </button>
        <button
          className={activeTab === 'classes' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('classes')}
        >
          📚 Classes
        </button>
      </div>

      <div className="admin-content">

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="tab-content">
            <h2>Weekly Calendar</h2>
            <WeeklyCalendar
              bookings={bookings}
              onBookingClick={(booking) => setSelectedBooking(booking)}
            />
            {selectedBooking && (
              <BookingPopup
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onDelete={(id) => {
                  handleDeleteBooking(id);
                  setSelectedBooking(null);
                }}
              />
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="tab-content">
            <h2>User Management</h2>
            <p className="user-count">{users.length} registered users</p>

            <div className="users-table">
              <div className="table-header">
                <span>Name</span>
                <span>Email</span>
                <span>Account Type</span>
                <span>Instructor</span>
                <span>Joined</span>
                <span>Actions</span>
              </div>
              {users.map((u) => (
                <div key={u.id} className="table-row clickable-row" onClick={() => handleUserClick(u.id)}>
                  <span>{u.name}</span>
                  <span>{u.email}</span>
                  <span>
                    <select
                      value={u.userType}
                      onChange={(e) => handleChangeUserType(u.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="type-select"
                    >
                      <option value="member">Member</option>
                      <option value="non-member">Non-Member</option>
                      <option value="steward">Steward</option>
                      <option value="cave-pro">Cave Pro</option>
                      <option value="admin">Admin</option>
                    </select>
                  </span>
                  <span>
                    <input
                      type="checkbox"
                      checked={u.isInstructor || false}
                      onChange={(e) => handleToggleInstructor(u.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="instructor-checkbox"
                    />
                  </span>
                  <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                  <span>
                    <button
                      className="delete-btn small"
                      onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOOK FOR CLIENT TAB */}
        {activeTab === 'book-for-client' && (
          <div className="tab-content">
            <h2>Book for Client</h2>

            <div className="client-selector">
              <label>Select Client:</label>
              <select
                value={bookingForUser?.id || ''}
                onChange={(e) => {
                  const selected = users.find(u => u.id === e.target.value);
                  setBookingForUser(selected || null);
                }}
              >
                <option value="">-- Select a client --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) - {u.userType}
                  </option>
                ))}
              </select>
            </div>

            {bookingForUser && (
              <div className="selected-client">
                <p>Booking for: <strong>{bookingForUser.name}</strong> ({bookingForUser.userType})</p>
              </div>
            )}

            <BookingCalendar
              onSelectSlot={handleBookForClient}
              user={bookingForUser || user}
            />
          </div>
        )}

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          <div className="tab-content">
            <h2>Revenue Summary</h2>

            <div className="revenue-cards">
              <div className="revenue-card">
                <h3>Today</h3>
                <div className="revenue-amount">${stats.todayRevenue}/hr</div>
                <p>{stats.todayBookings.length} bookings</p>
              </div>
              <div className="revenue-card">
                <h3>This Month</h3>
                <div className="revenue-amount">${stats.monthRevenue}/hr</div>
                <p>{stats.monthBookings.length} bookings</p>
              </div>
              <div className="revenue-card">
                <h3>All Time</h3>
                <div className="revenue-amount">${stats.totalRevenue}/hr</div>
                <p>{bookings.length} total bookings</p>
              </div>
            </div>

            <h3>Bookings by Space</h3>
            <div className="space-stats">
              {Object.entries(
                bookings.reduce((acc, booking) => {
                  acc[booking.shopArea] = (acc[booking.shopArea] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .map(([space, count]) => (
                  <div key={space} className="space-stat-row">
                    <span>{space}</span>
                    <div className="stat-bar-container">
                      <div
                        className="stat-bar"
                        style={{ width: `${(count / bookings.length) * 100}%` }}
                      />
                    </div>
                    <span>{count} booking(s)</span>
                  </div>
                ))}
            </div>
          </div>
        )}
        {/* CLASSES TAB */}
        {activeTab === 'classes' && (
          <div className="tab-content">
            <ClassesManager />
          </div>
        )}
      </div>

      {selectedUserProfile && (
        <UserProfilePopup
          profile={selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}

export default AdminDashboard;

