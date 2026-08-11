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

// GET all habits
app.get('/api/habits', async (req, res) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: 1, isActive: true }
    });
    res.json(habits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST create a habit
app.post('/api/habits', async (req, res) => {
  try {
    const { name, frequency, targetPerWeek } = req.body;
    const habit = await prisma.habit.create({
      data: {
        userId: 1,
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
app.get('/api/habits/:id', async (req, res) => {
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
app.put('/api/habits/:id', async (req, res) => {
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
app.delete('/api/habits/:id', async (req, res) => {
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