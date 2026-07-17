const express = require('express');
const app = express();
app.use(express.json());
let habits = [];
let nextId = 1;
const PORT = 3000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET all habits
app.get('/api/habits', (req, res) => {
  res.json(habits);
});

// POST create a habit
app.post('/api/habits', (req, res) => {
  const { name, frequency } = req.body;
  const habit = { id: nextId++, name, frequency };
  habits.push(habit);
  res.status(201).json(habit);
});

// GET a single habit
app.get('/api/habits/:id', (req, res) => {
  const habit = habits.find(h => h.id === parseInt(req.params.id));
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  res.json(habit);
});

// PUT update a habit
app.put('/api/habits/:id', (req, res) => {
  const habit = habits.find(h => h.id === parseInt(req.params.id));
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  const { name, frequency } = req.body;
  if (name) habit.name = name;
  if (frequency) habit.frequency = frequency;
  res.json(habit);
});

// DELETE a habit
app.delete('/api/habits/:id', (req, res) => {
  const index = habits.findIndex(h => h.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Habit not found' });
  habits.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});