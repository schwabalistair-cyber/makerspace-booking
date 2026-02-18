import React from 'react';
import './BookingPopup.css';

function BookingPopup({ booking, onClose, onDelete }) {
  if (!booking) return null;

  return (
    <>
      <div className="popup-overlay" onClick={onClose} />
      <div className="popup">
        <div className="popup-header">
          <h2>Booking Details</h2>
          <button className="popup-close" onClick={onClose}>×</button>
        </div>

        <div className="popup-body">
          <div className="popup-section">
            <h3>Booking Info</h3>
            <p><strong>Space:</strong> {booking.shopArea}</p>
            <p><strong>Date:</strong> {booking.date}</p>
            <p><strong>Time:</strong> {booking.timeSlot}</p>
            <p><strong>Rate:</strong> ${booking.rateCharged}/hr ({booking.rateLabel})</p>
            {booking.bookingType && (
              <p><strong>Type:</strong> {booking.bookingType}</p>
            )}
            {booking.bookedByAdmin && (
              <span className="admin-badge">Booked by Admin</span>
            )}
          </div>

          <div className="popup-section">
            <h3>Customer Info</h3>
            <p><strong>Name:</strong> {booking.name}</p>
            <p><strong>Email:</strong> {booking.email}</p>
            <p><strong>Account Type:</strong> {booking.userType}</p>
          </div>

          {booking.description && (
            <div className="popup-section">
              <h3>Description</h3>
              <p>{booking.description}</p>
            </div>
          )}
        </div>

        <div className="popup-footer">
          <button className="popup-delete-btn" onClick={() => onDelete(booking.id)}>
            Cancel Booking
          </button>
          <button className="popup-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}

export default BookingPopup;