const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-this-later';

// Middleware
app.use(bodyParser.json());

// Serve React build files in production
app.use(express.static(path.join(__dirname, '..', 'build')));

// GET all bookings
app.get('/api/bookings', async (req, res) => {
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
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, userId, userType, date, timeSlot, shopArea, rateCharged, rateLabel, bookedByAdmin, adminId } = req.body;
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

// DELETE a booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// GET all users (admin only)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, user_type, created_at FROM users ORDER BY created_at DESC');
    const users = result.rows.map(row => ({
      id: row.id.toString(),
      email: row.email,
      name: row.name,
      userType: row.user_type,
      createdAt: row.created_at
    }));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// UPDATE user type
app.patch('/api/users/:id', async (req, res) => {
  try {
    const { userType } = req.body;
    const result = await pool.query(
      'UPDATE users SET user_type = $1 WHERE id = $2 RETURNING id, email, name, user_type, created_at',
      [userType, req.params.id]
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
      createdAt: row.created_at
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE user
app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
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
app.post('/api/classes', async (req, res) => {
  try {
    const { title, series, instructor, sessions, duration, maxCapacity, price, description, prerequisites } = req.body;
    const result = await pool.query(
      `INSERT INTO classes (title, series, instructor, sessions, duration, max_capacity, price, description, prerequisites)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, series || null, instructor, JSON.stringify(sessions || []), duration, maxCapacity, price || null, description || null, prerequisites || null]
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id.toString(),
      title: row.title,
      series: row.series,
      instructor: row.instructor,
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
app.patch('/api/classes/:id', async (req, res) => {
  try {
    const { title, series, instructor, sessions, duration, maxCapacity, price, description, prerequisites } = req.body;
    const result = await pool.query(
      `UPDATE classes SET title = $1, series = $2, instructor = $3, sessions = $4, duration = $5,
       max_capacity = $6, price = $7, description = $8, prerequisites = $9
       WHERE id = $10 RETURNING *`,
      [title, series || null, instructor, JSON.stringify(sessions || []), duration, maxCapacity, price || null, description || null, prerequisites || null, req.params.id]
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
app.delete('/api/classes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM classes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Class deleted' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// POST enroll student in class
app.post('/api/classes/:id/enroll', async (req, res) => {
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
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, userType } = req.body;

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
      'INSERT INTO users (email, password, name, user_type) VALUES ($1, $2, $3, $4) RETURNING id, email, name, user_type',
      [email, hashedPassword, name, userType]
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
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// LOGIN user
app.post('/api/auth/login', async (req, res) => {
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
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET current user (verify token)
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const result = await pool.query('SELECT id, email, name, user_type FROM users WHERE id = $1', [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      userType: user.user_type
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
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
