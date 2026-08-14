require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

// POST login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    next();
  });
}

// POST signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash }
    });

    // Never send the password hash back, even though it's hashed
    res.status(201).json({ id: user.id, email: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

//Get all habits
app.get('/api/habits', authenticateToken, async (req, res) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId, isActive: true }
    });
    res.json(habits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

//Post a habit
app.post('/api/habits', authenticateToken, async (req, res) => {
  try {
    const { name, frequency, targetPerWeek } = req.body;
    const habit = await prisma.habit.create({
      data: {
        userId: req.userId,
        name,
        frequency,
        targetPerWeek: targetPerWeek || null
      }
    });
    res.status(201).json(habit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET a single habit
app.get('/api/habits/:id', authenticateToken, async (req, res) => {
  try {
    const habit = await prisma.habit.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json(habit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PUT update a habit
app.put('/api/habits/:id',authenticateToken, async (req, res) => {
  try {
    const { name, frequency, targetPerWeek } = req.body;
    const habit = await prisma.habit.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(frequency && { frequency }),
        ...(targetPerWeek !== undefined && { targetPerWeek })
      }
    });
    res.json(habit);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Habit not found' });
    }
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// DELETE (soft delete) a habit
app.delete('/api/habits/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.habit.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Habit not found' });
    }
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});