import './App.css';
import { useState, useEffect } from 'react';
import BookingCalendar from './BookingCalendar';
import Auth from './Auth';
import AdminDashboard from './AdminDashboard';
import InstructorDashboard from './InstructorDashboard';
import HamburgerMenu from './HamburgerMenu';

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
  const [showInstructor, setShowInstructor] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Check if user is already logged in, and refresh from server
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Refresh user data from server (e.g. isInstructor may have changed)
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            const updatedUser = { ...JSON.parse(savedUser), ...data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        })
        .catch(() => {});
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
    setShowInstructor(false);
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
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    <div className="header-bar">
      {user && (
        <button className="hamburger-btn" onClick={() => setShowMenu(true)} aria-label="Open menu">
          <span /><span /><span />
        </button>
      )}
      <img src="/diycave-logo.svg" alt="DIY Cave" className="header-logo" />
    </div>
  );

  // If not logged in show auth screen
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Show instructor dashboard
  if (showInstructor && user.isInstructor) {
    return <InstructorDashboard user={user} onBack={() => setShowInstructor(false)} />;
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
        {showMenu && (
          <HamburgerMenu
            user={user}
            onClose={() => setShowMenu(false)}
            onLogout={() => { handleLogout(); setShowMenu(false); }}
          />
        )}
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
      {showMenu && (
        <HamburgerMenu
          user={user}
          onClose={() => setShowMenu(false)}
          onLogout={() => { handleLogout(); setShowMenu(false); }}
        />
      )}
      <main>
        <BookingCalendar onSelectSlot={handleSlotSelection} user={user} />
      </main>
    </div>
  );
}

export default App;