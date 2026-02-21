import React, { useState, useEffect } from 'react';
import './InstructorDashboard.css';

function InstructorDashboard({ user, onBack }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/instructor/classes', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = async (classItem) => {
    setSelectedClass(classItem);
    // Set the first session as active by default
    if (classItem.sessions && classItem.sessions.length > 0) {
      setActiveSession(classItem.sessions[0].date);
    }
    // Fetch attendance for this class
    try {
      const response = await fetch(`/api/classes/${classItem.id}/attendance`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleToggleAttendance = async (enrolledStudentId, sessionDate, currentPresent) => {
    const newPresent = !currentPresent;
    try {
      const response = await fetch(`/api/classes/${selectedClass.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          enrolledStudentId,
          sessionDate,
          present: newPresent
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setAttendance(prev => {
          const existing = prev.findIndex(
            a => a.enrolledStudentId === enrolledStudentId && a.sessionDate === sessionDate
          );
          if (existing >= 0) {
            const newArr = [...prev];
            newArr[existing] = updated;
            return newArr;
          }
          return [...prev, updated];
        });
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  const isPresent = (enrolledStudentId, sessionDate) => {
    const record = attendance.find(
      a => a.enrolledStudentId === enrolledStudentId && a.sessionDate === sessionDate
    );
    return record ? record.present : false;
  };

  // Filter to only show classes with upcoming sessions
  const upcomingClasses = classes.filter(c => {
    if (c.sessions && c.sessions.length > 0) {
      return c.sessions.some(s => new Date(s.date) >= new Date(new Date().toDateString()));
    }
    return false;
  });

  if (loading) {
    return (
      <div className="instructor-dashboard">
        <div className="instructor-header">
          <div className="instructor-header-left">
            <h1>My Classes</h1>
            <span>Instructor Dashboard</span>
          </div>
          <button className="back-button" onClick={onBack}>
            ← Back to Booking
          </button>
        </div>
        <div className="instructor-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-dashboard">
      <div className="instructor-header">
        <div className="instructor-header-left">
          <h1>My Classes</h1>
          <span>Instructor Dashboard</span>
        </div>
        <button className="back-button" onClick={onBack}>
          ← Back to Booking
        </button>
      </div>

      <div className="instructor-content">
        {!selectedClass ? (
          /* CLASS LIST VIEW */
          <div className="instructor-class-list">
            <h2>Upcoming Classes</h2>
            {upcomingClasses.length === 0 ? (
              <div className="no-classes-message">
                <p>You have no upcoming classes assigned to you.</p>
              </div>
            ) : (
              upcomingClasses.map(classItem => (
                <div
                  key={classItem.id}
                  className="instructor-class-card"
                  onClick={() => handleSelectClass(classItem)}
                >
                  <div className="instructor-class-card-header">
                    <h3>{classItem.title}</h3>
                    <span className="series-badge">{classItem.series}</span>
                  </div>
                  <div className="instructor-class-card-body">
                    <p>
                      <strong>Sessions:</strong> {classItem.sessions?.length || 0} session{classItem.sessions?.length !== 1 ? 's' : ''}
                    </p>
                    <p>
                      <strong>Next:</strong>{' '}
                      {classItem.sessions
                        ? new Date(classItem.sessions.find(s => new Date(s.date) >= new Date(new Date().toDateString()))?.date || classItem.sessions[0].date).toLocaleDateString()
                        : 'N/A'}
                    </p>
                    <p>
                      <strong>Enrolled:</strong> {classItem.enrolledStudents?.length || 0} / {classItem.maxCapacity}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* CLASS DETAIL VIEW */
          <div className="instructor-class-detail">
            <button className="back-to-list" onClick={() => { setSelectedClass(null); setAttendance([]); }}>
              ← Back to Class List
            </button>

            <div className="class-detail-header">
              <h2>{selectedClass.title}</h2>
              <span className="series-badge">{selectedClass.series}</span>
            </div>

            <div className="class-detail-info">
              <p><strong>Duration:</strong> {selectedClass.duration}</p>
              <p><strong>Price:</strong> ${selectedClass.price}</p>
              <p><strong>Capacity:</strong> {selectedClass.enrolledStudents?.length || 0} / {selectedClass.maxCapacity}</p>
              {selectedClass.description && <p><strong>Description:</strong> {selectedClass.description}</p>}
            </div>

            {/* Session Tabs */}
            <div className="session-tabs">
              <h3>Sessions</h3>
              <div className="session-tab-bar">
                {selectedClass.sessions?.map((session, index) => (
                  <button
                    key={index}
                    className={`session-tab ${activeSession === session.date ? 'active' : ''}`}
                    onClick={() => setActiveSession(session.date)}
                  >
                    {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {session.time && ` @ ${session.time}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Attendance List */}
            {activeSession && (
              <div className="attendance-section">
                <h3>
                  Attendance — {new Date(activeSession).toLocaleDateString()}
                </h3>
                {(!selectedClass.enrolledStudents || selectedClass.enrolledStudents.length === 0) ? (
                  <p className="no-students">No students enrolled yet.</p>
                ) : (
                  <div className="attendance-list">
                    <div className="attendance-header">
                      <span>Student</span>
                      <span>Email</span>
                      <span>Present</span>
                    </div>
                    {selectedClass.enrolledStudents.map(student => (
                      <div key={student.id} className="attendance-row">
                        <span>{student.userName}</span>
                        <span>{student.userEmail}</span>
                        <span>
                          <input
                            type="checkbox"
                            checked={isPresent(student.id, activeSession)}
                            onChange={() => handleToggleAttendance(student.id, activeSession, isPresent(student.id, activeSession))}
                            className="attendance-checkbox"
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default InstructorDashboard;
