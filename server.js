require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const app = express();
const prisma = new PrismaClient({ adapter });
const PORT = 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/auth')(prisma));
app.use('/api/habits', require('./routes/habits')(prisma));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});