const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, initDb } = require('./db');
const { authenticate, requireAdmin, requireInstructor, loginLimiter } = require('./middleware');
const { CERT_REQUIREMENTS, CLASS_TO_CERTS } = require('./certConfig');

const app = express();
const PORT = process.env.PORT || 5001;
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-this-later';

// Middleware
app.use(bodyParser.json());

// Serve React build files in production
app.use(express.static(path.join(__dirname, '..', 'build')));

// GET all bookings
app.get('/api/bookings', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    const bookings = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      userId: row.user_id != null ? row.user_id.toString() : null,
      userType: row.user_type,
      date: row.date,
      timeSlot: row.time_slot,
      shopArea: row.shop_area,
      rateCharged: row.rate_charged != null ? parseFloat(row.rate_charged) : null,
      rateLabel: row.rate_label,
      bookedByAdmin: row.booked_by_admin,
      adminId: row.admin_id != null ? row.admin_id.toString() : null,
      createdAt: row.created_at
    }));
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST a new booking
app.post('/api/bookings', authenticate, async (req, res) => {
  try {
    const { name, email, userId, userType, date, timeSlot, shopArea, rateCharged, rateLabel, bookedByAdmin, adminId } = req.body;

    // Server-side certification check
    const certReq = CERT_REQUIREMENTS[shopArea];
    if (certReq && certReq.type === 'area' && req.user.userType !== 'admin') {
      const certResult = await pool.query(
        'SELECT id FROM certifications WHERE user_id = $1 AND shop_area = $2',
        [req.user.id, shopArea]
      );
      if (certResult.rows.length === 0) {
        return res.status(403).json({ error: certReq.message });
      }
    }

    const result = await pool.query(
      `INSERT INTO bookings (name, email, user_id, user_type, date, time_slot, shop_area, rate_charged, rate_label, booked_by_admin, admin_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, email, userId || null, userType, date, timeSlot, shopArea, rateCharged || null, rateLabel || null, bookedByAdmin || false, adminId || null]
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      userId: row.user_id != null ? row.user_id.toString() : null,
      userType: row.user_type,
      date: row.date,
      timeSlot: row.time_slot,
      shopArea: row.shop_area,
      rateCharged: row.rate_charged != null ? parseFloat(row.rate_charged) : null,
      rateLabel: row.rate_label,
      bookedByAdmin: row.booked_by_admin,
      adminId: row.admin_id != null ? row.admin_id.toString() : null,
      createdAt: row.created_at
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// DELETE a booking (admin or booking owner)
app.delete('/api/bookings/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    const booking = result.rows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (req.user.userType !== 'admin' && booking.user_id?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// PUT update a booking's date and time slot (admin or booking owner)
app.put('/api/bookings/:id', authenticate, async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    const booking = result.rows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (req.user.userType !== 'admin' && booking.user_id?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = await pool.query(
      'UPDATE bookings SET date = $1, time_slot = $2 WHERE id = $3 RETURNING *',
      [date, timeSlot, req.params.id]
    );
    const row = updated.rows[0];
    res.json({
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      userId: row.user_id != null ? row.user_id.toString() : null,
      userType: row.user_type,
      date: row.date,
      timeSlot: row.time_slot,
      shopArea: row.shop_area,
      rateCharged: row.rate_charged != null ? parseFloat(row.rate_charged) : null,
      rateLabel: row.rate_label,
      bookedByAdmin: row.booked_by_admin,
      adminId: row.admin_id != null ? row.admin_id.toString() : null,
      createdAt: row.created_at
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// GET all users (admin only)
app.get('/api/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, user_type, is_instructor, created_at FROM users ORDER BY created_at DESC');
    const users = result.rows.map(row => ({
      id: row.id.toString(),
      email: row.email,
      name: row.name,
      userType: row.user_type,
      isInstructor: row.is_instructor || false,
      createdAt: row.created_at
    }));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET instructor users (for class form dropdown)
app.get('/api/users/instructors', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE is_instructor = TRUE ORDER BY name'
    );
    const instructors = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      email: row.email
    }));
    res.json(instructors);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({ error: 'Failed to fetch instructors' });
  }
});

// UPDATE user type and/or instructor flag
app.patch('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userType, isInstructor, address, streetAddress, state, zipCode, phone, birthDate, emergencyContactName, emergencyContactPhone, emergencyContactRelationship } = req.body;

    // Build dynamic update
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (userType !== undefined) {
      updates.push(`user_type = $${paramIndex++}`);
      values.push(userType);
    }
    if (isInstructor !== undefined) {
      updates.push(`is_instructor = $${paramIndex++}`);
      values.push(isInstructor);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(address);
    }
    if (streetAddress !== undefined) {
      updates.push(`street_address = $${paramIndex++}`);
      values.push(streetAddress);
    }
    if (state !== undefined) {
      updates.push(`state = $${paramIndex++}`);
      values.push(state);
    }
    if (zipCode !== undefined) {
      updates.push(`zip_code = $${paramIndex++}`);
      values.push(zipCode);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (birthDate !== undefined) {
      updates.push(`birth_date = $${paramIndex++}`);
      values.push(birthDate);
    }
    if (emergencyContactName !== undefined) {
      updates.push(`emergency_contact_name = $${paramIndex++}`);
      values.push(emergencyContactName);
    }
    if (emergencyContactPhone !== undefined) {
      updates.push(`emergency_contact_phone = $${paramIndex++}`);
      values.push(emergencyContactPhone);
    }
    if (emergencyContactRelationship !== undefined) {
      updates.push(`emergency_contact_relationship = $${paramIndex++}`);
      values.push(emergencyContactRelationship);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, name, user_type, is_instructor, created_at`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const row = result.rows[0];
    res.json({
      id: row.id.toString(),
      email: row.email,
      name: row.name,
      userType: row.user_type,
      isInstructor: row.is_instructor || false,
      createdAt: row.created_at
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE user
app.delete('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET full user profile (admin only)
app.get('/api/users/:id/profile', authenticate, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user details
    const userResult = await pool.query(
      'SELECT id, email, name, user_type, is_instructor, address, street_address, state, zip_code, phone, birth_date, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = userResult.rows[0];

    // Get class history
    const classesResult = await pool.query(
      `SELECT c.title, c.series, c.instructor, c.price, c.sessions, es.enrolled_at
       FROM enrolled_students es
       JOIN classes c ON c.id = es.class_id
       WHERE es.user_id = $1
       ORDER BY es.enrolled_at DESC`,
      [userId]
    );

    // Get certifications
    const certsResult = await pool.query(
      `SELECT cert.id, cert.shop_area, cert.certified_at, u.name AS certified_by_name
       FROM certifications cert
       LEFT JOIN users u ON u.id = cert.certified_by
       WHERE cert.user_id = $1
       ORDER BY cert.certified_at DESC`,
      [userId]
    );

    // Get purchases
    const purchasesResult = await pool.query(
      `SELECT p.id, p.description, p.amount, p.type, p.status, p.due_date, p.paid_at, p.created_at, u.name AS created_by_name
       FROM purchases p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json({
      user: {
        id: u.id.toString(),
        email: u.email,
        name: u.name,
        userType: u.user_type,
        isInstructor: u.is_instructor || false,
        address: u.address,
        streetAddress: u.street_address,
        state: u.state,
        zipCode: u.zip_code,
        phone: u.phone,
        birthDate: u.birth_date,
        emergencyContactName: u.emergency_contact_name,
        emergencyContactPhone: u.emergency_contact_phone,
        emergencyContactRelationship: u.emergency_contact_relationship,
        createdAt: u.created_at
      },
      classes: classesResult.rows.map(r => ({
        title: r.title,
        series: r.series,
        instructor: r.instructor,
        price: r.price != null ? parseFloat(r.price) : null,
        sessions: r.sessions,
        enrolledAt: r.enrolled_at
      })),
      certifications: certsResult.rows.map(r => ({
        id: r.id.toString(),
        shopArea: r.shop_area,
        certifiedAt: r.certified_at,
        certifiedByName: r.certified_by_name
      })),
      purchases: purchasesResult.rows.map(r => ({
        id: r.id.toString(),
        description: r.description,
        amount: parseFloat(r.amount),
        type: r.type,
        status: r.status,
        dueDate: r.due_date,
        paidAt: r.paid_at,
        createdAt: r.created_at,
        createdByName: r.created_by_name
      }))
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET user certifications (own or admin)
app.get('/api/users/:id/certifications', authenticate, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const result = await pool.query(
      `SELECT cert.id, cert.shop_area, cert.certified_at, u.name AS certified_by_name
       FROM certifications cert
       LEFT JOIN users u ON u.id = cert.certified_by
       WHERE cert.user_id = $1
       ORDER BY cert.certified_at DESC`,
      [req.params.id]
    );
    res.json(result.rows.map(r => ({
      id: r.id.toString(),
      shopArea: r.shop_area,
      certifiedAt: r.certified_at,
      certifiedByName: r.certified_by_name
    })));
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ error: 'Failed to fetch certifications' });
  }
});

// POST add certification (admin only)
app.post('/api/users/:id/certifications', authenticate, requireAdmin, async (req, res) => {
  try {
    const { shopArea } = req.body;
    if (!shopArea) {
      return res.status(400).json({ error: 'Shop area is required' });
    }
    const result = await pool.query(
      'INSERT INTO certifications (user_id, shop_area, certified_by) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, shopArea, req.user.id]
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id.toString(),
      shopArea: row.shop_area,
      certifiedAt: row.certified_at,
      certifiedByName: req.user.name
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'User already has this certification' });
    }
    console.error('Error adding certification:', error);
    res.status(500).json({ error: 'Failed to add certification' });
  }
});

// DELETE remove certification (admin only)
app.delete('/api/users/:id/certifications/:certId', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM certifications WHERE id = $1 AND user_id = $2', [req.params.certId, req.params.id]);
    res.json({ message: 'Certification removed' });
  } catch (error) {
    console.error('Error removing certification:', error);
    res.status(500).json({ error: 'Failed to remove certification' });
  }
});

// GET certification check for booking
app.get('/api/certifications/check', authenticate, async (req, res) => {
  try {
    const { shopArea } = req.query;
    if (!shopArea) {
      return res.status(400).json({ error: 'shopArea query parameter is required' });
    }
    const certReq = CERT_REQUIREMENTS[shopArea];
    if (!certReq || certReq.type !== 'area') {
      return res.json({ allowed: true });
    }
    if (req.user.userType === 'admin') {
      return res.json({ allowed: true });
    }
    const certResult = await pool.query(
      'SELECT id FROM certifications WHERE user_id = $1 AND shop_area = $2',
      [req.user.id, shopArea]
    );
    if (certResult.rows.length > 0) {
      return res.json({ allowed: true });
    }
    res.json({
      allowed: false,
      message: certReq.message,
      method: certReq.method,
      qualifyingClasses: certReq.qualifyingClasses
    });
  } catch (error) {
    console.error('Error checking certification:', error);
    res.status(500).json({ error: 'Failed to check certification' });
  }
});

// POST create purchase/invoice (admin only)
app.post('/api/users/:id/purchases', authenticate, requireAdmin, async (req, res) => {
  try {
    const { description, amount, type, dueDate } = req.body;
    if (!description || amount == null || !type) {
      return res.status(400).json({ error: 'Description, amount, and type are required' });
    }
    const status = type === 'purchase' ? 'paid' : 'unpaid';
    const paidAt = type === 'purchase' ? new Date() : null;
    const result = await pool.query(
      'INSERT INTO purchases (user_id, description, amount, type, status, due_date, paid_at, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.params.id, description, amount, type, status, dueDate || null, paidAt, req.user.id]
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id.toString(),
      description: row.description,
      amount: parseFloat(row.amount),
      type: row.type,
      status: row.status,
      dueDate: row.due_date,
      paidAt: row.paid_at,
      createdAt: row.created_at,
      createdByName: req.user.name
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ error: 'Failed to create purchase' });
  }
});

// PATCH mark purchase as paid (admin only)
app.patch('/api/users/:id/purchases/:purchaseId', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE purchases SET status = $1, paid_at = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      ['paid', new Date(), req.params.purchaseId, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    const row = result.rows[0];
    res.json({
      id: row.id.toString(),
      description: row.description,
      amount: parseFloat(row.amount),
      type: row.type,
      status: row.status,
      dueDate: row.due_date,
      paidAt: row.paid_at,
      createdAt: row.created_at
    });
  } catch (error) {
    console.error('Error updating purchase:', error);
    res.status(500).json({ error: 'Failed to update purchase' });
  }
});

// DELETE purchase (admin only)
app.delete('/api/users/:id/purchases/:purchaseId', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM purchases WHERE id = $1 AND user_id = $2', [req.params.purchaseId, req.params.id]);
    res.json({ message: 'Purchase deleted' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ error: 'Failed to delete purchase' });
  }
});

// GET all classes
app.get('/api/classes', async (req, res) => {
  try {
    const classesResult = await pool.query('SELECT * FROM classes ORDER BY created_at DESC');
    const classes = [];
    for (const row of classesResult.rows) {
      const enrolledResult = await pool.query(
        'SELECT user_id, user_name, user_email, enrolled_at FROM enrolled_students WHERE class_id = $1',
        [row.id]
      );
      classes.push({
        id: row.id.toString(),
        title: row.title,
        series: row.series,
        instructor: row.instructor,
        instructorId: row.instructor_id != null ? row.instructor_id.toString() : null,
        sessions: row.sessions,
        duration: row.duration,
        maxCapacity: row.max_capacity,
        price: row.price != null ? parseFloat(row.price) : null,
        description: row.description,
        prerequisites: row.prerequisites,
        enrolledStudents: enrolledResult.rows.map(s => ({
          userId: s.user_id != null ? s.user_id.toString() : null,
          userName: s.user_name,
          userEmail: s.user_email,
          enrolledAt: s.enrolled_at
        })),
        createdAt: row.created_at
      });
    }
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// POST create new class
app.post('/api/classes', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, series, instructor, instructorId, sessions, duration, maxCapacity, price, description, prerequisites } = req.body;
    const result = await pool.query(
      `INSERT INTO classes (title, series, instructor, instructor_id, sessions, duration, max_capacity, price, description, prerequisites)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [title, series || null, instructor, instructorId || null, JSON.stringify(sessions || []), duration, maxCapacity, price || null, description || null, prerequisites || null]
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id.toString(),
      title: row.title,
      series: row.series,
      instructor: row.instructor,
      instructorId: row.instructor_id != null ? row.instructor_id.toString() : null,
      sessions: row.sessions,
      duration: row.duration,
      maxCapacity: row.max_capacity,
      price: row.price != null ? parseFloat(row.price) : null,
      description: row.description,
      prerequisites: row.prerequisites,
      enrolledStudents: [],
      createdAt: row.created_at
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// PATCH update class
app.patch('/api/classes/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, series, instructor, instructorId, sessions, duration, maxCapacity, price, description, prerequisites } = req.body;
    const result = await pool.query(
      `UPDATE classes SET title = $1, series = $2, instructor = $3, instructor_id = $4, sessions = $5, duration = $6,
       max_capacity = $7, price = $8, description = $9, prerequisites = $10
       WHERE id = $11 RETURNING *`,
      [title, series || null, instructor, instructorId || null, JSON.stringify(sessions || []), duration, maxCapacity, price || null, description || null, prerequisites || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    const row = result.rows[0];
    const enrolledResult = await pool.query(
      'SELECT user_id, user_name, user_email, enrolled_at FROM enrolled_students WHERE class_id = $1',
      [row.id]
    );
    res.json({
      id: row.id.toString(),
      title: row.title,
      series: row.series,
      instructor: row.instructor,
      instructorId: row.instructor_id != null ? row.instructor_id.toString() : null,
      sessions: row.sessions,
      duration: row.duration,
      maxCapacity: row.max_capacity,
      price: row.price != null ? parseFloat(row.price) : null,
      description: row.description,
      prerequisites: row.prerequisites,
      enrolledStudents: enrolledResult.rows.map(s => ({
        userId: s.user_id != null ? s.user_id.toString() : null,
        userName: s.user_name,
        userEmail: s.user_email,
        enrolledAt: s.enrolled_at
      })),
      createdAt: row.created_at
    });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// DELETE class
app.delete('/api/classes/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM classes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Class deleted' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// POST enroll student in class
app.post('/api/classes/:id/enroll', authenticate, async (req, res) => {
  try {
    const classId = req.params.id;
    const { userId, userName, userEmail } = req.body;

    // Get class and check capacity
    const classResult = await pool.query('SELECT * FROM classes WHERE id = $1', [classId]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      'SELECT id FROM enrolled_students WHERE class_id = $1 AND user_id = $2',
      [classId, userId]
    );
    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled' });
    }

    // Check capacity
    const enrolledCount = await pool.query(
      'SELECT COUNT(*) FROM enrolled_students WHERE class_id = $1',
      [classId]
    );
    if (parseInt(enrolledCount.rows[0].count) >= classResult.rows[0].max_capacity) {
      return res.status(400).json({ error: 'Class is full' });
    }

    // Enroll
    await pool.query(
      'INSERT INTO enrolled_students (class_id, user_id, user_name, user_email) VALUES ($1, $2, $3, $4)',
      [classId, userId, userName, userEmail]
    );

    // Return updated class
    const row = classResult.rows[0];
    const enrolledResult = await pool.query(
      'SELECT user_id, user_name, user_email, enrolled_at FROM enrolled_students WHERE class_id = $1',
      [classId]
    );
    res.json({
      id: row.id.toString(),
      title: row.title,
      series: row.series,
      instructor: row.instructor,
      instructorId: row.instructor_id != null ? row.instructor_id.toString() : null,
      sessions: row.sessions,
      duration: row.duration,
      maxCapacity: row.max_capacity,
      price: row.price != null ? parseFloat(row.price) : null,
      description: row.description,
      prerequisites: row.prerequisites,
      enrolledStudents: enrolledResult.rows.map(s => ({
        userId: s.user_id != null ? s.user_id.toString() : null,
        userName: s.user_name,
        userEmail: s.user_email,
        enrolledAt: s.enrolled_at
      })),
      createdAt: row.created_at
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

// REGISTER new user
app.post('/api/auth/register', loginLimiter, async (req, res) => {
  try {
    const { email, password, name, userType, address, phone, birthDate, emergencyContactName, emergencyContactPhone, emergencyContactRelationship } = req.body;

    // Validate input
    if (!email || !password || !name || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const result = await pool.query(
      `INSERT INTO users (email, password, name, user_type, address, phone, birth_date, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, email, name, user_type`,
      [email, hashedPassword, name, userType, address || null, phone || null, birthDate || null, emergencyContactName || null, emergencyContactPhone || null, emergencyContactRelationship || null]
    );
    const user = result.rows[0];

    // Create JWT token
    const token = jwt.sign(
      { id: user.id.toString(), email: user.email, userType: user.user_type },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        userType: user.user_type,
        isInstructor: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// LOGIN user
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id.toString(), email: user.email, userType: user.user_type },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        userType: user.user_type,
        isInstructor: user.is_instructor || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET current user (verify token)
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json(req.user);
});

// GET instructor's classes (with enrolled students)
app.get('/api/instructor/classes', authenticate, requireInstructor, async (req, res) => {
  try {
    const classesResult = await pool.query(
      'SELECT * FROM classes WHERE instructor_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    const classes = [];
    for (const row of classesResult.rows) {
      const enrolledResult = await pool.query(
        'SELECT id, user_id, user_name, user_email, enrolled_at FROM enrolled_students WHERE class_id = $1',
        [row.id]
      );
      classes.push({
        id: row.id.toString(),
        title: row.title,
        series: row.series,
        instructor: row.instructor,
        instructorId: row.instructor_id != null ? row.instructor_id.toString() : null,
        sessions: row.sessions,
        duration: row.duration,
        maxCapacity: row.max_capacity,
        price: row.price != null ? parseFloat(row.price) : null,
        description: row.description,
        prerequisites: row.prerequisites,
        enrolledStudents: enrolledResult.rows.map(s => ({
          id: s.id.toString(),
          userId: s.user_id != null ? s.user_id.toString() : null,
          userName: s.user_name,
          userEmail: s.user_email,
          enrolledAt: s.enrolled_at
        })),
        createdAt: row.created_at
      });
    }
    res.json(classes);
  } catch (error) {
    console.error('Error fetching instructor classes:', error);
    res.status(500).json({ error: 'Failed to fetch instructor classes' });
  }
});

// GET attendance for a class
app.get('/api/classes/:id/attendance', authenticate, async (req, res) => {
  try {
    // Only allow instructor of this class or admin
    const classResult = await pool.query('SELECT instructor_id FROM classes WHERE id = $1', [req.params.id]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    const classRow = classResult.rows[0];
    if (classRow.instructor_id?.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(
      'SELECT * FROM attendance WHERE class_id = $1',
      [req.params.id]
    );
    const attendance = result.rows.map(row => ({
      id: row.id.toString(),
      classId: row.class_id.toString(),
      enrolledStudentId: row.enrolled_student_id.toString(),
      sessionDate: row.session_date,
      present: row.present,
      checkedInAt: row.checked_in_at
    }));
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// POST (upsert) attendance for a class session
app.post('/api/classes/:id/attendance', authenticate, async (req, res) => {
  try {
    // Only allow instructor of this class or admin
    const classResult = await pool.query('SELECT instructor_id FROM classes WHERE id = $1', [req.params.id]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    const classRow = classResult.rows[0];
    if (classRow.instructor_id?.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { enrolledStudentId, sessionDate, present } = req.body;
    const result = await pool.query(
      `INSERT INTO attendance (class_id, enrolled_student_id, session_date, present, checked_in_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (class_id, enrolled_student_id, session_date)
       DO UPDATE SET present = $4, checked_in_at = $5
       RETURNING *`,
      [req.params.id, enrolledStudentId, sessionDate, present, present ? new Date() : null]
    );
    const row = result.rows[0];

    // Auto-grant certifications when all sessions attended
    if (present) {
      try {
        const classData = await pool.query('SELECT title, sessions FROM classes WHERE id = $1', [req.params.id]);
        if (classData.rows.length > 0) {
          const classTitle = classData.rows[0].title;
          const sessions = classData.rows[0].sessions; // JSONB array
          const certAreas = CLASS_TO_CERTS[classTitle];
          if (certAreas && certAreas.length > 0 && Array.isArray(sessions)) {
            // Get user_id from enrolled_students
            const studentRow = await pool.query(
              'SELECT user_id FROM enrolled_students WHERE id = $1',
              [enrolledStudentId]
            );
            if (studentRow.rows.length > 0 && studentRow.rows[0].user_id) {
              const studentUserId = studentRow.rows[0].user_id;
              // Count present attendance records for this student in this class
              const attendanceCount = await pool.query(
                'SELECT COUNT(*) FROM attendance WHERE class_id = $1 AND enrolled_student_id = $2 AND present = true',
                [req.params.id, enrolledStudentId]
              );
              const presentCount = parseInt(attendanceCount.rows[0].count);
              if (presentCount >= sessions.length) {
                for (const area of certAreas) {
                  await pool.query(
                    'INSERT INTO certifications (user_id, shop_area, certified_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                    [studentUserId, area, req.user.id]
                  );
                }
              }
            }
          }
        }
      } catch (certError) {
        console.error('Error auto-granting certification (non-fatal):', certError);
      }
    }

    res.json({
      id: row.id.toString(),
      classId: row.class_id.toString(),
      enrolledStudentId: row.enrolled_student_id.toString(),
      sessionDate: row.session_date,
      present: row.present,
      checkedInAt: row.checked_in_at
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ error: 'Failed to save attendance' });
  }
});

// Catch-all: serve React app for client-side routing
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// Initialize database and start server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
