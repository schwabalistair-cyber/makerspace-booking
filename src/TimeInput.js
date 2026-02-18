import React, { useState } from 'react';
import './TimeInput.css';

function TimeInput({ value, onChange, label }) {
  const [showKeypad, setShowKeypad] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleNumberClick = (num) => {
    if (inputValue.length < 4) {
      setInputValue(inputValue + num);
    }
  };

  const handleClear = () => {
    setInputValue('');
  };

  const handleDelete = () => {
    setInputValue(inputValue.slice(0, -1));
  };

  const handleDone = () => {
    if (inputValue.length === 4) {
      const hours = inputValue.substring(0, 2);
      const minutes = inputValue.substring(2, 4);
      
      // Validate
      const h = parseInt(hours);
      const m = parseInt(minutes);
      
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        // Check if minutes are in 15-minute increments
        if (m % 15 === 0) {
          const formattedTime = `${hours}:${minutes}`;
          onChange(formattedTime);
          setShowKeypad(false);
          setInputValue('');
        } else {
          alert('Minutes must be in 15-minute increments (00, 15, 30, 45)');
        }
      } else {
        alert('Invalid time. Hours: 00-23, Minutes: 00-59');
      }
    } else {
      alert('Please enter 4 digits (HHMM)');
    }
  };

  const formatDisplayTime = (time) => {
    if (!time) return '--:--';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <div className="time-input-container">
      <label>{label}</label>
      <div className="time-display" onClick={() => setShowKeypad(true)}>
        {formatDisplayTime(value)}
      </div>

      {showKeypad && (
        <>
          <div className="keypad-overlay" onClick={() => setShowKeypad(false)} />
          <div className="keypad">
            <div className="keypad-header">
              <span>Enter Time (HHMM)</span>
              <button className="close-btn" onClick={() => setShowKeypad(false)}>×</button>
            </div>
            
            <div className="keypad-display">
              {inputValue.padEnd(4, '_')}
            </div>

            <div className="keypad-hint">
              Format: HHMM (e.g., 0900 for 9:00 AM)
              <br />
              Minutes: 00, 15, 30, or 45 only
            </div>

            <div className="keypad-buttons">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} onClick={() => handleNumberClick(num.toString())}>
                  {num}
                </button>
              ))}
              <button onClick={handleClear}>Clear</button>
              <button onClick={() => handleNumberClick('0')}>0</button>
              <button onClick={handleDelete}>⌫</button>
            </div>

            <button className="done-btn" onClick={handleDone}>
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TimeInput;
