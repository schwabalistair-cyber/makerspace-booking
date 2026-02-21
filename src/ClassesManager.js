import React, { useState, useEffect } from 'react';
import './ClassesManager.css';

function ClassesManager() {
  const [classes, setClasses] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  
  const [instructors, setInstructors] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    series: '',
    instructor: '',
    instructorId: '',
    sessions: [{ date: '', time: '' }],
    duration: '',
    maxCapacity: '',
    price: '',
    description: '',
    prerequisites: ''
  });

  const classSeries = [
    'Automotive',
    'Blacksmith',
    'Community Events',
    'Glass',
    'Jewelry',
    'Kids Classes',
    'Lapidary',
    'Leather',
    'Member Events',
    'Metal',
    'Sewing',
    'Tech',
    'Tool Certification',
    'Wood Lathe',
    'Woodshop'
  ];

  useEffect(() => {
    fetchClasses();
    fetchInstructors();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await fetch('/api/users/instructors', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInstructors(data);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const handleInstructorChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === '') {
      setFormData({ ...formData, instructorId: '', instructor: '' });
    } else {
      const selected = instructors.find(i => i.id === selectedId);
      setFormData({
        ...formData,
        instructorId: selectedId,
        instructor: selected ? selected.name : ''
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSessionChange = (index, field, value) => {
    const newSessions = [...formData.sessions];
    newSessions[index][field] = value;
    setFormData({ ...formData, sessions: newSessions });
  };

  const addSession = () => {
    setFormData({
      ...formData,
      sessions: [...formData.sessions, { date: '', time: '' }]
    });
  };

  const removeSession = (index) => {
    if (formData.sessions.length === 1) return;
    const newSessions = formData.sessions.filter((_, i) => i !== index);
    setFormData({ ...formData, sessions: newSessions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingClass 
        ? `/api/classes/${editingClass.id}`
        : '/api/classes';
      
      const method = editingClass ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        fetchClasses();
        resetForm();
        alert(editingClass ? 'Class updated!' : 'Class created!');
      }
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Error saving class');
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      title: classItem.title,
      series: classItem.series,
      instructor: classItem.instructor,
      instructorId: classItem.instructorId || '',
      sessions: classItem.sessions || [{ date: classItem.date, time: classItem.time }],
      duration: classItem.duration,
      maxCapacity: classItem.maxCapacity,
      price: classItem.price,
      description: classItem.description || '',
      prerequisites: classItem.prerequisites || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class?')) return;
    
    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchClasses();
      }
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      series: '',
      instructor: '',
      instructorId: '',
      sessions: [{ date: '', time: '' }],
      duration: '',
      maxCapacity: '',
      price: '',
      description: '',
      prerequisites: ''
    });
    setEditingClass(null);
    setShowForm(false);
  };

  const filteredClasses = selectedSeries === 'all'
    ? classes
    : classes.filter(c => c.series === selectedSeries);

  const upcomingClasses = filteredClasses
    .filter(c => {
      if (c.sessions && c.sessions.length > 0) {
        return c.sessions.some(s => new Date(s.date) >= new Date());
      }
      return new Date(c.date) >= new Date();
    })
    .sort((a, b) => {
      const aDate = a.sessions ? new Date(a.sessions[0].date) : new Date(a.date);
      const bDate = b.sessions ? new Date(b.sessions[0].date) : new Date(b.date);
      return aDate - bDate;
    });

  return (
    <div className="classes-manager">
      
      {/* Left Side - Class List */}
      <div className="classes-list-panel">
        <h2>Upcoming Classes</h2>
        
        <div className="series-filter">
          <label>Filter by Series:</label>
          <select value={selectedSeries} onChange={(e) => setSelectedSeries(e.target.value)}>
            <option value="all">All Classes</option>
            {classSeries.map(series => (
              <option key={series} value={series}>{series}</option>
            ))}
          </select>
        </div>

        <div className="classes-list">
          {upcomingClasses.length === 0 ? (
            <div className="no-classes">No upcoming classes</div>
          ) : (
            upcomingClasses.map(classItem => (
              <div key={classItem.id} className="class-item">
                <div className="class-item-header">
                  <h3>{classItem.title}</h3>
                  <span className="class-series-badge">{classItem.series}</span>
                </div>
                <div className="class-item-body">
                  <p><strong>Instructor:</strong> {classItem.instructor}</p>
                  <p>
                    <strong>Date{classItem.sessions?.length > 1 ? 's' : ''}:</strong>{' '}
                    {classItem.sessions 
                      ? classItem.sessions.map(s => new Date(s.date).toLocaleDateString()).join(', ')
                      : new Date(classItem.date).toLocaleDateString()
                    }
                  </p>
                  <p>
                    <strong>Time:</strong>{' '}
                    {classItem.sessions 
                      ? classItem.sessions[0].time
                      : classItem.time
                    } ({classItem.duration})
                  </p>
                  <p><strong>Capacity:</strong> {classItem.enrolledStudents?.length || 0} / {classItem.maxCapacity}</p>
                  <p><strong>Price:</strong> ${classItem.price}</p>
                </div>
                <div className="class-item-actions">
                  <button onClick={() => handleEdit(classItem)}>Edit</button>
                  <button onClick={() => handleDelete(classItem.id)} className="delete-btn-small">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Add/Edit Form */}
      <div className="classes-form-panel">
        <div className="form-header">
          <h2>{editingClass ? 'Edit Class' : 'Add New Class'}</h2>
          {showForm && !editingClass && (
            <button onClick={resetForm} className="cancel-btn">Cancel</button>
          )}
          {editingClass && (
            <button onClick={resetForm} className="cancel-btn">Cancel Edit</button>
          )}
        </div>

        {!showForm && !editingClass ? (
          <button className="add-class-btn" onClick={() => setShowForm(true)}>
            + Add New Class
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="class-form">
            <div className="form-group">
              <label>Class Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Series *</label>
              <select
                name="series"
                value={formData.series}
                onChange={handleInputChange}
                required
              >
                <option value="">Select series...</option>
                {classSeries.map(series => (
                  <option key={series} value={series}>{series}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Instructor *</label>
              <select
                name="instructorId"
                value={formData.instructorId}
                onChange={handleInstructorChange}
                required
              >
                <option value="">Select instructor...</option>
                {instructors.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div className="sessions-header">
                <label>Class Sessions *</label>
                <button
                  type="button"
                  className="add-session-btn"
                  onClick={addSession}
                >
                  + Add Another Day
                </button>
              </div>
              
              {formData.sessions.map((session, index) => (
                <div key={index} className="session-row">
                  <div className="session-inputs">
                    <input
                      type="date"
                      value={session.date}
                      onChange={(e) => handleSessionChange(index, 'date', e.target.value)}
                      required
                    />
                    <input
                      type="time"
                      value={session.time}
                      onChange={(e) => handleSessionChange(index, 'time', e.target.value)}
                      required
                    />
                  </div>
                  {formData.sessions.length > 1 && (
                    <button
                      type="button"
                      className="remove-session-btn"
                      onClick={() => removeSession(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Duration *</label>
                <input
                  type="text"
                  name="duration"
                  placeholder="e.g., 2 hours"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Max Capacity *</label>
                <input
                  type="number"
                  name="maxCapacity"
                  value={formData.maxCapacity}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                name="price"
                placeholder="0.00"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Prerequisites</label>
              <textarea
                name="prerequisites"
                rows="2"
                value={formData.prerequisites}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" className="submit-btn">
              {editingClass ? 'Update Class' : 'Create Class'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ClassesManager;