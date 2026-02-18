import './App.css';
import { useState, useEffect } from 'react';
import BookingCalendar from './BookingCalendar';
import Auth from './Auth';
import AdminDashboard from './AdminDashboard';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    timeSlot: '',
    shopArea: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setFormData({
      name: '',
      email: '',
      date: '',
      timeSlot: '',
      shopArea: ''
    });
    setSubmitted(false);
    setShowAdmin(false);
  };

  const handleSlotSelection = async (slotData) => {
    const bookingData = {
      name: user.name,
      email: user.email,
      userId: user.id,
      userType: user.userType,
      date: slotData.date,
      timeSlot: slotData.timeSlot,
      shopArea: slotData.shopArea,
      rateCharged: slotData.rateCharged,
      rateLabel: slotData.rateLabel
    };

    try {
      const response = await fetch('http://localhost:5001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        const savedBooking = await response.json();
        console.log('Booking saved:', savedBooking);
        setFormData(bookingData);
        setSubmitted(true);
      } else {
        alert('Failed to save booking. Please try again.');
      }
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Error saving booking. Make sure the backend server is running.');
    }
  };

  const handleStartOver = () => {
    setFormData({
      name: '',
      email: '',
      date: '',
      timeSlot: '',
      shopArea: ''
    });
    setSubmitted(false);
  };

  // Header component used in all views
  const Header = () => (
    <header>
      <h1>Makerspace Booking System</h1>
      <div className="user-info">
        {user && user.userType === 'admin' && (
          <button className="admin-btn" onClick={() => setShowAdmin(true)}>
            Admin Dashboard
          </button>
        )}
        {user && (
          <span>Welcome, {user.name} ({user.userType})</span>
        )}
        {user && (
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        )}
      </div>
    </header>
  );

  // If not logged in show auth screen
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Show admin dashboard
  if (showAdmin && user.userType === 'admin') {
    return <AdminDashboard user={user} onBack={() => setShowAdmin(false)} />;
  }

  // Success screen
  if (submitted) {
    return (
      <div className="App">
        <Header />
        <main>
          <div className="success-message">
            <h2>✓ Booking Confirmed!</h2>
            <p><strong>Name:</strong> {formData.name}</p>
            <p><strong>Email:</strong> {formData.email}</p>
            <p><strong>Date:</strong> {formData.date}</p>
            <p><strong>Time:</strong> {formData.timeSlot}</p>
            <p><strong>Shop Area:</strong> {formData.shopArea}</p>
            {formData.rateCharged !== undefined && (
              <p><strong>Rate:</strong> ${formData.rateCharged}/hr ({formData.rateLabel})</p>
            )}
            <button onClick={handleStartOver}>Book Another Slot</button>
          </div>
        </main>
      </div>
    );
  }

  // Calendar view (default)
  return (
    <div className="App">
      <Header />
      <main>
        <BookingCalendar onSelectSlot={handleSlotSelection} user={user} />
      </main>
    </div>
  );
}

export default App;