const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5001;
const SECRET_KEY = 'your-secret-key-change-this-later'; // For JWT tokens

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Path to bookings file
const bookingsFile = path.join(__dirname, 'bookings.json');

// Initialize bookings file if it doesn't exist
if (!fs.existsSync(bookingsFile)) {
  fs.writeFileSync(bookingsFile, JSON.stringify([]));
}

// Helper function to read bookings
const readBookings = () => {
  const data = fs.readFileSync(bookingsFile);
  return JSON.parse(data);
};

// Helper function to write bookings
const writeBookings = (bookings) => {
  fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));
};

// GET all bookings
app.get('/api/bookings', (req, res) => {
  const bookings = readBookings();
  res.json(bookings);
});

// POST a new booking
app.post('/api/bookings', (req, res) => {
  const bookings = readBookings();
  const newBooking = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  bookings.push(newBooking);
  writeBookings(bookings);
  
  res.status(201).json(newBooking);
});

// DELETE a booking
app.delete('/api/bookings/:id', (req, res) => {
  const bookings = readBookings();
  const filteredBookings = bookings.filter(b => b.id !== req.params.id);
  writeBookings(filteredBookings);
  res.json({ message: 'Booking deleted' });
});

// GET all users (admin only)
app.get('/api/users', (req, res) => {
  const users = readUsers();
  // Return users without passwords
  const safeUsers = users.map(({ password, ...user }) => user);
  res.json(safeUsers);
});

// UPDATE user type
app.patch('/api/users/:id', (req, res) => {
  const users = readUsers();
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users[userIndex] = { ...users[userIndex], ...req.body };
  writeUsers(users);
  
  const { password, ...safeUser } = users[userIndex];
  res.json(safeUser);
});

// DELETE user
app.delete('/api/users/:id', (req, res) => {
  const users = readUsers();
  const filteredUsers = users.filter(u => u.id !== req.params.id);
  writeUsers(filteredUsers);
  res.json({ message: 'User deleted' });
});

// Path to classes file
const classesFile = path.join(__dirname, 'classes.json');

// Initialize classes file if it doesn't exist
if (!fs.existsSync(classesFile)) {
  fs.writeFileSync(classesFile, JSON.stringify([]));
}

// Helper functions for classes
const readClasses = () => {
  const data = fs.readFileSync(classesFile);
  return JSON.parse(data);
};

const writeClasses = (classes) => {
  fs.writeFileSync(classesFile, JSON.stringify(classes, null, 2));
};

// GET all classes
app.get('/api/classes', (req, res) => {
  const classes = readClasses();
  res.json(classes);
});

// POST create new class
app.post('/api/classes', (req, res) => {
  const classes = readClasses();
  const newClass = {
    id: Date.now().toString(),
    ...req.body,
    enrolledStudents: [],
    createdAt: new Date().toISOString()
  };
  
  classes.push(newClass);
  writeClasses(classes);
  res.status(201).json(newClass);
});

// PATCH update class
app.patch('/api/classes/:id', (req, res) => {
  const classes = readClasses();
  const classIndex = classes.findIndex(c => c.id === req.params.id);
  
  if (classIndex === -1) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  classes[classIndex] = { ...classes[classIndex], ...req.body };
  writeClasses(classes);
  res.json(classes[classIndex]);
});

// DELETE class
app.delete('/api/classes/:id', (req, res) => {
  const classes = readClasses();
  const filteredClasses = classes.filter(c => c.id !== req.params.id);
  writeClasses(filteredClasses);
  res.json({ message: 'Class deleted' });
});

// POST enroll student in class
app.post('/api/classes/:id/enroll', (req, res) => {
  const classes = readClasses();
  const classIndex = classes.findIndex(c => c.id === req.params.id);
  
  if (classIndex === -1) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  const classItem = classes[classIndex];
  const { userId, userName, userEmail } = req.body;
  
  // Check if already enrolled
  if (classItem.enrolledStudents.some(s => s.userId === userId)) {
    return res.status(400).json({ error: 'Already enrolled' });
  }
  
  // Check if class is full
  if (classItem.enrolledStudents.length >= classItem.maxCapacity) {
    return res.status(400).json({ error: 'Class is full' });
  }
  
  classItem.enrolledStudents.push({
    userId,
    userName,
    userEmail,
    enrolledAt: new Date().toISOString()
  });
  
  writeClasses(classes);
  res.json(classItem);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:5001`);
});

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Path to users file
const usersFile = path.join(__dirname, 'users.json');

// Initialize users file if it doesn't exist
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([]));
}

// Helper functions for users
const readUsers = () => {
  const data = fs.readFileSync(usersFile);
  return JSON.parse(data);
};

const writeUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// REGISTER new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, userType } = req.body;
    
    // Validate input
    if (!email || !password || !name || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const users = readUsers();
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      userType, // 'admin', 'member', 'non-member', 'steward', 'cave-pro'
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    // Create JWT token
    const token = jwt.sign({ id: newUser.id, email: newUser.email, userType: newUser.userType }, SECRET_KEY, { expiresIn: '7d' });

    // Return user info (without password)
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        userType: newUser.userType
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
    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id, email: user.email, userType: user.userType }, SECRET_KEY, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET current user (verify token)
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const users = readUsers();
    const user = users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

