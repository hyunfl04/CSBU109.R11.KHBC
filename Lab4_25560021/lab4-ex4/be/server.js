// server.js - Task Manager REST API (in-memory storage) - FIXED VERSION
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5002;

// [BUG 1 & BUG 2 FIX]
// Bug 1: `origin` was restricted to 'http://localhost:3000', blocking Live Server ('http://127.0.0.1:5500').
// Bug 2: `methods` only allowed ['GET', 'POST'], causing CORS preflight (OPTIONS) failures on PUT and DELETE.
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// [BUG 3 FIX]
// Express does not parse JSON request bodies by default; without `express.json()`,
// `req.body` is `undefined` and destructuring `{ title }` throws a 500 TypeError.
app.use(express.json());

// ---------- In-memory "database" ----------
let tasks = [
  { id: 1, title: 'Read the Express routing docs', done: true, createdAt: '2026-09-20T08:00:00.000Z' },
  { id: 2, title: 'Install Postman', done: false, createdAt: '2026-09-21T09:30:00.000Z' },
  { id: 3, title: 'Finish Lab 4 exercise 3', done: false, createdAt: '2026-09-22T14:15:00.000Z' },
  { id: 4, title: 'Review HTTP status codes', done: false, createdAt: '2026-09-23T10:45:00.000Z' }
];
let nextId = 5;

// [BUG 4 FIX]
// Changed `name: task.title` to `title: task.title` to match the API contract
// expected by the frontend (`task.title`).
const toDto = (task) => ({
  id: task.id,
  title: task.title,
  done: task.done,
  createdAt: task.createdAt
});

// ---------- Routes ----------

// GET /api/tasks?status=all|active|done
app.get('/api/tasks', (req, res) => {
  const { status } = req.query;

  if (status === 'active') {
    return res.json({ success: true, data: tasks.filter((t) => !t.done).map(toDto) });
  }

  // [BUG 5 FIX]
  // Added `return res.json(...)` so requests with `?status=done` send a response
  // instead of hanging indefinitely in `(pending)` state.
  if (status === 'done') {
    const doneTasks = tasks.filter((t) => t.done);
    return res.json({ success: true, data: doneTasks.map(toDto) });
  }

  if (!status || status === 'all') {
    return res.json({ success: true, data: tasks.map(toDto) });
  }

  return res.status(400).json({ success: false, message: 'Invalid status filter' });
});

// GET /api/tasks/stats
app.get('/api/tasks/stats', (req, res) => {
  const total = tasks.length;

  // [BUG 6 FIX]
  // Swapped the inverted filter conditions: `active` must count `!t.done`
  // and `done` must count `t.done`.
  const active = tasks.filter((t) => !t.done).length;
  const done = tasks.filter((t) => t.done).length;

  res.json({ success: true, data: { total, active, done } });
});

// POST /api/tasks  body: { title }
app.post('/api/tasks', (req, res) => {
  const { title } = req.body;

  // [BUG 7 FIX]
  // Added `return` before `res.status(400).json(...)` so execution stops immediately
  // on invalid/blank titles instead of falling through and creating an empty task.
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const task = {
    id: nextId++,
    title: title.trim(),
    done: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  res.status(201).json({ success: true, data: toDto(task) });
});

// PUT /api/tasks/:id  body: { title?, done? }
app.put('/api/tasks/:id', (req, res) => {
  // [BUG 8 FIX]
  // Converted `req.params.id` from a string to a number with `parseInt()`
  // so strict equality (`t.id === id`) finds the matching task instead of returning 404.
  const id = parseInt(req.params.id, 10);
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  if (req.body.title !== undefined) {
    if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    task.title = req.body.title.trim();
  }

  // [BUG 9 FIX]
  // Replaced `req.body.done || task.done` with an explicit `!== undefined` check;
  // `false || true` previously evaluated to `true`, making it impossible to uncheck a done task.
  if (req.body.done !== undefined) {
    task.done = Boolean(req.body.done);
  }

  res.json({ success: true, data: toDto(task) });
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  // [BUG 10 FIX]
  // Resolved the zero-based array index using `findIndex()` before calling `splice()`;
  // previously `tasks.splice(id, 1)` used the 1-based task ID as an array index and deleted the wrong task.
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  tasks.splice(index, 1);
  res.json({ success: true, message: 'Task deleted' });
});

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
});