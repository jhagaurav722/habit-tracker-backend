const express = require('express');
const authenticateToken = require('../middleware/auth');

module.exports = function (prisma) {
  const router = express.Router();

  router.get('/', authenticateToken, async (req, res) => {
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

  router.post('/', authenticateToken, async (req, res) => {
    try {
      const { name, frequency, targetPerWeek } = req.body;
      const habit = await prisma.habit.create({
        data: { userId: req.userId, name, frequency, targetPerWeek: targetPerWeek || null }
      });
      res.status(201).json(habit);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  });

  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const habit = await prisma.habit.findFirst({
        where: { id: parseInt(req.params.id), userId: req.userId }
      });
      if (!habit) return res.status(404).json({ error: 'Habit not found' });
      res.json(habit);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  });

  router.put('/:id', authenticateToken, async (req, res) => {
    try {
      const existing = await prisma.habit.findFirst({
        where: { id: parseInt(req.params.id), userId: req.userId }
      });
      if (!existing) return res.status(404).json({ error: 'Habit not found' });
      const { name, frequency, targetPerWeek } = req.body;
      const habit = await prisma.habit.update({
        where: { id: existing.id },
        data: {
          ...(name && { name }),
          ...(frequency && { frequency }),
          ...(targetPerWeek !== undefined && { targetPerWeek })
        }
      });
      res.json(habit);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  });

  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      const existing = await prisma.habit.findFirst({
        where: { id: parseInt(req.params.id), userId: req.userId }
      });
      if (!existing) return res.status(404).json({ error: 'Habit not found' });
      await prisma.habit.update({ where: { id: existing.id }, data: { isActive: false } });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  });

  return router;
};