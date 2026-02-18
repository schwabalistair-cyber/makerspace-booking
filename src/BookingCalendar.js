import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './BookingCalendar.css';

function BookingCalendar({ onSelectSlot, user }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSubArea, setSelectedSubArea] = useState('');
  const [bookings, setBookings] = useState([]);

  const shopCategories = {
    'Textiles & Tech': {
      '3D Printer': { capacity: 2, memberRate: 12, nonMemberRate: 24 },
      'Boss Laser': { capacity: 1, memberRate: 24, nonMemberRate: 48 },
      'Cricut Machine': { capacity: 1, memberRate: 12, nonMemberRate: 24 },
      'Fused Glass': { capacity: 4, memberRate: 12, nonMemberRate: 24 },
      'Glass Studio': { capacity: 2, memberRate: 12, nonMemberRate: 24 },
      'Glowforge': { capacity: 1, memberRate: 12, nonMemberRate: 24 },
      'Glowforge Proficiency Test': { capacity: 1, memberRate: 0, nonMemberRate: 0 },
      'Jewelry Bench': { capacity: 2, memberRate: 12, nonMemberRate: 24 },
      'Leather': { capacity: 2, memberRate: 12, nonMemberRate: 24 },
      'Sewing Space': { capacity: 1, memberRate: 12, nonMemberRate: 24 }
    },
    'Wood & Metal': {
      'Auto Bay': { capacity: 1, memberRate: 12, nonMemberRate: 24 },
      'Bridgeport Mill': { capacity: 1, memberRate: 12, nonMemberRate: 24 },
      'CNC Plasma': { capacity: 1, memberRate: 24, nonMemberRate: 48 },
      'Forge': { capacity: 3, memberRate: 18, nonMemberRate: 36 },
      'Metal Lathes': {
        subcategories: {
          'Grizzly Mill': { capacity: 1, memberRate: 12, nonMemberRate: 24 },
          'Metal Lathe': { capacity: 1, memberRate: 12, nonMemberRate: 24 },
          'Small Metal Lathe': { capacity: 1, memberRate: 12, nonMemberRate: 24 }
        }
      },
      'Metal Shop': { capacity: 3, memberRate: 12, nonMemberRate: 24 },
      'Wood Lathe': {
        subcategories: {
          'Mini Jet': { capacity: 1, memberRate: 12, nonMemberRate: 24 },
          'Non-Powermatic': { capacity: 2, memberRate: 12, nonMemberRate: 24 },
          'Powermatic': { capacity: 1, memberRate: 12, nonMemberRate: 24 }
        }
      },
      'Wood Planer': { capacity: 1, memberRate: 12, nonMemberRate: 24 },
      'Woodshop': { capacity: 3, memberRate: 12, nonMemberRate: 24 },
      'Xcarve CNC': { capacity: 1, memberRate: 12, nonMemberRate: 24 }
    }
  };

  // Fetch all bookings when component loads
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Determine allowed booking hours based on user type and day of week
  const getAllowedHours = (date) => {
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

    // Admin can book anytime
    if (user.userType === 'admin') {
      return { start: 8, end: 22 };
    }

    // Cave Pro: Any day 8am - 10pm
    if (user.userType === 'cave-pro') {
      return { start: 8, end: 22 };
    }

    // Steward: Regular hours + Wednesday 8am-10pm
    if (user.userType === 'steward') {
      if (dayOfWeek === 3) { // Wednesday
        return { start: 8, end: 22 };
      }
    }

    // Thursday: 10am - 10pm
    if (dayOfWeek === 4) {
      return { start: 10, end: 22 };
    }

    // Friday, Saturday: 8am - 8pm
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return { start: 8, end: 20 };
    }

    // Sunday: 8am - 5pm
    if (dayOfWeek === 0) {
      return { start: 8, end: 17 };
    }

    // Monday, Tuesday, Wednesday (non-stewards): Not allowed
    return null;
  };

  // Check if a date is bookable for this user
  const isDateBookable = (date) => {
    return getAllowedHours(date) !== null;
  };

  // Generate time slots based on allowed hours for selected date
  const generateTimeSlots = () => {
    const allowedHours = getAllowedHours(selectedDate);

    if (!allowedHours) return [];

    const slots = [];
    for (let hour = allowedHours.start; hour < allowedHours.end; hour++) {
      const formatHour = (h) => {
        const period = h >= 12 ? 'pm' : 'am';
        const displayHour = h > 12 ? h - 12 : h === 12 ? 12 : h;
        return `${displayHour}${period}`;
      };
      slots.push(`${formatHour(hour)} - ${formatHour(hour + 1)}`);
    }
    return slots;
  };

  // Get the final area name (including subarea if applicable)
  const getFinalAreaName = () => {
    if (selectedSubArea) {
      return `${selectedArea} - ${selectedSubArea}`;
    }
    return selectedArea;
  };

  // Get area data (handles subcategories)
  const getAreaData = () => {
    const categoryData = shopCategories[selectedCategory];
    if (!categoryData) return null;

    const areaData = categoryData[selectedArea];
    if (!areaData) return null;

    if (areaData.subcategories && selectedSubArea) {
      return areaData.subcategories[selectedSubArea];
    }

    return areaData.subcategories ? null : areaData;
  };

  // Get pricing based on user type
  const getRate = () => {
    const areaData = getAreaData();
    if (!areaData) return null;

    // Stewards: free except Boss Laser and CNC Plasma ($12/hr)
    if (user.userType === 'steward') {
      if (selectedArea === 'Boss Laser' || selectedArea === 'CNC Plasma') {
        return { rate: 12, label: 'Steward Rate' };
      }
      return { rate: 0, label: 'Free (Steward)' };
    }

    // Cave Pro: member pricing
    if (user.userType === 'cave-pro') {
      return { rate: areaData.memberRate, label: 'Cave Pro Rate' };
    }

    // Member pricing
    if (user.userType === 'member' || user.userType === 'admin') {
      return { rate: areaData.memberRate, label: 'Member Rate' };
    }

    // Non-member pricing
    return { rate: areaData.nonMemberRate, label: 'Non-Member Rate' };
  };

  // Check if a time slot is fully booked
  const getSlotAvailability = (slot) => {
    if (!selectedArea || !selectedDate) return { available: 0, total: 0 };

    const areaData = getAreaData();
    if (!areaData) return { available: 0, total: 0 };

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const capacity = areaData.capacity;
    const finalAreaName = getFinalAreaName();

    const bookedCount = bookings.filter(booking => {
      return (
        booking.date === selectedDateStr &&
        booking.shopArea === finalAreaName &&
        booking.timeSlot === slot
      );
    }).length;

    return {
      available: capacity - bookedCount,
      total: capacity,
      isFullyBooked: bookedCount >= capacity
    };
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedArea('');
    setSelectedSubArea('');
    setSelectedTimeSlot('');
  };

  const handleAreaClick = (area) => {
    setSelectedArea(area);
    setSelectedSubArea('');
    setSelectedTimeSlot('');
  };

  const handleSubAreaClick = (subArea) => {
    setSelectedSubArea(subArea);
    setSelectedTimeSlot('');
  };

  const handleTimeSlotClick = (slot) => {
    const availability = getSlotAvailability(slot);
    if (!availability.isFullyBooked) {
      setSelectedTimeSlot(slot);
    }
  };

  const handleContinue = () => {
    if (selectedTimeSlot && selectedArea) {
      const areaData = getAreaData();
      if (!areaData) {
        alert('Please select a specific area');
        return;
      }
      const rate = getRate();
      onSelectSlot({
        date: selectedDate.toISOString().split('T')[0],
        timeSlot: selectedTimeSlot,
        shopArea: getFinalAreaName(),
        memberRate: areaData.memberRate,
        nonMemberRate: areaData.nonMemberRate,
        rateCharged: rate.rate,
        rateLabel: rate.label
      });
    } else {
      alert('Please select a time slot and shop area');
    }
  };

  const shouldShowTimeSlots = () => {
    if (!selectedArea) return false;
    const areaData = shopCategories[selectedCategory][selectedArea];
    if (areaData.subcategories) {
      return selectedSubArea !== '';
    }
    return true;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="booking-calendar">
      <h2>Select Your Booking</h2>

      <div className="calendar-container">
        <h3>1. Choose a Date</h3>
        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          minDate={new Date()}
          maxDate={new Date(new Date().getFullYear() + 1, 11, 31)}
          maxDetail="month"
          navigationLabel={({ date }) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          prev2Label={null}
          next2Label={null}
          tileDisabled={({ date }) => !isDateBookable(date)}
        />
      </div>

      <div className="time-slots">
        <h3>2. Choose a Category</h3>
        <div className="slot-grid">
          {Object.keys(shopCategories).map((category) => (
            <button
              key={category}
              className={selectedCategory === category ? 'slot-button active' : 'slot-button'}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {selectedCategory && (
        <div className="time-slots">
          <h3>3. Choose a Specific Area</h3>
          <div className="slot-grid">
            {Object.keys(shopCategories[selectedCategory]).map((area) => (
              <button
                key={area}
                className={selectedArea === area ? 'slot-button active' : 'slot-button'}
                onClick={() => handleAreaClick(area)}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedArea && shopCategories[selectedCategory][selectedArea].subcategories && (
        <div className="time-slots">
          <h3>4. Choose Specific {selectedArea}</h3>
          <div className="slot-grid">
            {Object.keys(shopCategories[selectedCategory][selectedArea].subcategories).map((subArea) => (
              <button
                key={subArea}
                className={selectedSubArea === subArea ? 'slot-button active' : 'slot-button'}
                onClick={() => handleSubAreaClick(subArea)}
              >
                {subArea}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedArea && timeSlots.length === 0 && (
        <div className="no-slots-message">
          No time slots available for this date with your account type.
          Please select a different date.
        </div>
      )}

      {shouldShowTimeSlots() && timeSlots.length > 0 && (
        <div className="time-slots">
          <h3>{shopCategories[selectedCategory][selectedArea].subcategories ? '5' : '4'}. Choose Your Time Slot</h3>
          <div className="time-slot-grid">
            {timeSlots.map((slot) => {
              const availability = getSlotAvailability(slot);
              return (
                <button
                  key={slot}
                  className={`time-slot-button ${selectedTimeSlot === slot ? 'active' : ''} ${availability.isFullyBooked ? 'booked' : ''}`}
                  onClick={() => handleTimeSlotClick(slot)}
                  disabled={availability.isFullyBooked}
                >
                  {slot}
                  {availability.total > 1 && (
                    <span className="availability-label">
                      {availability.isFullyBooked
                        ? ' (Fully Booked)'
                        : ` (${availability.available}/${availability.total} available)`}
                    </span>
                  )}
                  {availability.total === 1 && availability.isFullyBooked && (
                    <span className="booked-label"> (Booked)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && selectedTimeSlot && selectedArea && (
        <div className="selection-summary">
          <p><strong>Selected:</strong> {selectedDate.toLocaleDateString()} - {selectedTimeSlot} - {getFinalAreaName()}</p>
          {getRate() && (
            <p><strong>Rate:</strong> ${getRate().rate}/hr ({getRate().label})</p>
          )}
          <button className="continue-button" onClick={handleContinue}>
            Continue to Booking Details
          </button>
        </div>
      )}
    </div>
  );
}

export default BookingCalendar;