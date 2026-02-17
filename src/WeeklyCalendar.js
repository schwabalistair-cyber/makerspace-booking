import React, { useState, useEffect } from 'react';
import './WeeklyCalendar.css';

function WeeklyCalendar({ bookings, onBookingClick }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [currentDay, setCurrentDay] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    if (hours < 8 || hours >= 22) return null;
    const hourOffset = hours - 8;
    const minuteOffset = minutes / 60;
    return (hourOffset + minuteOffset) * 80;
  };

  // Week view navigation
  const goToPreviousWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  // Day view navigation
  const goToPreviousDay = () => {
    const prev = new Date(currentDay);
    prev.setDate(prev.getDate() - 1);
    setCurrentDay(prev);
  };

  const goToNextDay = () => {
    const next = new Date(currentDay);
    next.setDate(next.getDate() + 1);
    setCurrentDay(next);
  };

  const goToToday = () => {
    setCurrentDay(new Date());
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getHours = () => {
    const hours = [];
    for (let h = 8; h <= 22; h++) {
      hours.push(h);
    }
    return hours;
  };

  const formatHour = (h) => {
    const period = h >= 12 ? 'pm' : 'am';
    const displayHour = h > 12 ? h - 12 : h === 12 ? 12 : h;
    return `${displayHour}${period}`;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDayNumber = (date) => {
    return date.getDate();
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const getBookingsForSlot = (date, hour) => {
    const dateStr = formatDate(date);
    const hourFormatted = formatHour(hour);
    const nextHourFormatted = formatHour(hour + 1);
    const slotTime = `${hourFormatted} - ${nextHourFormatted}`;
    return bookings.filter(b => b.date === dateStr && b.timeSlot === slotTime);
  };

  const getBookingColor = (booking) => {
    if (booking.bookingType === 'class') return 'booking-class';
    if (booking.bookingType === 'private-event') return 'booking-private-event';

    const textilesTechSpaces = [
      '3D Printer', 'Boss Laser', 'Cricut Machine', 'Fused Glass',
      'Glass Studio', 'Glowforge', 'Glowforge Proficiency Test',
      'Jewelry Bench', 'Leather', 'Sewing Space'
    ];

    const isTextilesTech = textilesTechSpaces.some(space =>
      booking.shopArea?.includes(space)
    );

    return isTextilesTech ? 'booking-textiles' : 'booking-wood-metal';
  };

  const weekDays = getWeekDays();
  const hours = getHours();

  const weekRangeLabel = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${getMonthName(start)} ${start.getDate()} - ${getMonthName(end)} ${end.getDate()}, ${end.getFullYear()}`;
  };

  const dayLabel = () => {
    return currentDay.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="weekly-calendar">

      {/* View Toggle */}
      <div className="view-toggle">
        <button
          className={viewMode === 'week' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setViewMode('week')}
        >
          Week
        </button>
        <button
          className={viewMode === 'day' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setViewMode('day')}
        >
          Day
        </button>
      </div>

      {/* Navigation */}
      <div className="calendar-nav">
        <button onClick={viewMode === 'week' ? goToPreviousWeek : goToPreviousDay}>
          ← Previous
        </button>
        <div className="calendar-nav-center">
          <h3>{viewMode === 'week' ? weekRangeLabel() : dayLabel()}</h3>
          <button className="today-btn" onClick={goToToday}>Today</button>
        </div>
        <button onClick={viewMode === 'week' ? goToNextWeek : goToNextDay}>
          Next →
        </button>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <span className="legend-item">
          <span className="legend-color wood-metal"></span> Wood & Metal
        </span>
        <span className="legend-item">
          <span className="legend-color textiles"></span> Textiles & Tech
        </span>
        <span className="legend-item">
          <span className="legend-color classes"></span> Classes
        </span>
        <span className="legend-item">
          <span className="legend-color private-events"></span> Private Events
        </span>
      </div>

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="calendar-grid-wrapper">
          <div className="calendar-grid">
            <div className="time-column-header"></div>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`day-header ${isToday(day) ? 'today' : ''}`}
                onClick={() => {
                  setCurrentDay(new Date(day));
                  setViewMode('day');
                }}
                style={{ cursor: 'pointer' }}
              >
                <span className="day-name">{getDayName(day)}</span>
                <span className="day-number">{getDayNumber(day)}</span>
                <span className="day-month">{getMonthName(day)}</span>
              </div>
            ))}

            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div className="time-label">{formatHour(hour)}</div>
                {weekDays.map((day, dayIndex) => {
                  const slotBookings = getBookingsForSlot(day, hour);
                  return (
                    <div
                      key={dayIndex}
                      className={`calendar-cell ${isToday(day) ? 'today-column' : ''}`}
                    >
                      {slotBookings.map((booking, bIndex) => (
                        <div
                          key={bIndex}
                          className={`booking-block ${getBookingColor(booking)}`}
                          onClick={() => onBookingClick(booking)}
                          title={`${booking.shopArea} - ${booking.name}`}
                        >
                          <span className="booking-block-area">{booking.shopArea}</span>
                          <span className="booking-block-name">{booking.name}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {getCurrentTimePosition() !== null && (
            <div
              className="current-time-line"
              style={{ top: `${getCurrentTimePosition() + 47}px` }}
            >
              <div className="current-time-dot" />
            </div>
          )}
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="calendar-grid-wrapper">
          <div className="calendar-grid day-view-grid">
            <div className="time-column-header"></div>
            <div className={`day-header ${isToday(currentDay) ? 'today' : ''}`}>
              <span className="day-name">{getDayName(currentDay)}</span>
              <span className="day-number">{getDayNumber(currentDay)}</span>
              <span className="day-month">{getMonthName(currentDay)}</span>
            </div>

            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div className="time-label">{formatHour(hour)}</div>
                <div className={`calendar-cell day-view-cell ${isToday(currentDay) ? 'today-column' : ''}`}>
                  {getBookingsForSlot(currentDay, hour).map((booking, bIndex) => (
                    <div
                      key={bIndex}
                      className={`booking-block day-view-booking ${getBookingColor(booking)}`}
                      onClick={() => onBookingClick(booking)}
                      title={`${booking.shopArea} - ${booking.name}`}
                    >
                      <span className="booking-block-area">{booking.shopArea}</span>
                      <span className="booking-block-name">{booking.name}</span>
                      <span className="booking-block-time">{booking.timeSlot}</span>
                    </div>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>

          {getCurrentTimePosition() !== null && (
            <div
              className="current-time-line"
              style={{ top: `${getCurrentTimePosition() + 47}px` }}
            >
              <div className="current-time-dot" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WeeklyCalendar;