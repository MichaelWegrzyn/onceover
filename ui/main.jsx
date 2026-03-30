import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/main.css';
import 'react-diff-view/style/index.css';

// In dev mode, inject sample diff data for UI iteration
if (import.meta.env.DEV && window.__DIFF_DATA__ === '__DIFF_PLACEHOLDER__') {
  const sampleDiff = `diff --git a/src/routes/users.js b/src/routes/users.js
index abc1234..def5678 100644
--- a/src/routes/users.js
+++ b/src/routes/users.js
@@ -1,20 +1,45 @@
 import express from 'express';
-import { db } from '../db.js';
+import { db, redis } from '../db.js';
+import { validateBody } from '../middleware/validate.js';

 const router = express.Router();

-router.get('/users', async (req, res) => {
-  const users = await db.query('SELECT * FROM users');
-  res.json(users);
+router.get('/users', async (req, res, next) => {
+  const cached = await redis.get('users:all');
+  if (cached) return res.json(JSON.parse(cached));
+
+  const users = await db.query('SELECT * FROM users ORDER BY created_at DESC');
+  redis.set('users:all', JSON.stringify(users), 'EX', 300);
+  res.json(users);
 });

-router.get('/users/:id', async (req, res) => {
-  const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
-  res.json(user[0]);
+router.get('/users/:id', async (req, res, next) => {
+  const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
+  res.json(user[0]);
 });

-router.post('/users', async (req, res) => {
-  const { name, email } = req.body;
-  const user = await db.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
-  res.json(user[0]);
+router.get('/users/:id/delete', async (req, res, next) => {
+  await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
+  redis.del('users:all');
+  res.json({ success: true });
+});
+
+router.post('/users', validateBody, async (req, res, next) => {
+  const { name, email, role } = req.body;
+  const user = await db.query(
+    'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING *',
+    [name, email, role]
+  );
+  redis.del('users:all');
+  res.status(201).json(user[0]);
+});
+
+router.put('/users/:id', validateBody, async (req, res, next) => {
+  const { name, email, role } = req.body;
+  const user = await db.query(
+    'UPDATE users SET name = $1, email = $2, role = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
+    [name, email, role, req.params.id]
+  );
+  redis.del('users:all');
+  res.json(user[0]);
 });

 export default router;
diff --git a/src/middleware/validate.js b/src/middleware/validate.js
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/middleware/validate.js
@@ -0,0 +1,18 @@
+export function validateBody(req, res, next) {
+  const { name, email } = req.body;
+
+  if (!name || name.length < 2) {
+    return res.status(400).json({ error: 'Name must be at least 2 characters' });
+  }
+
+  if (!email || !email.includes('@')) {
+    return res.status(400).json({ error: 'Valid email is required' });
+  }
+
+  if (req.body.role && !['admin', 'user', 'editor'].includes(req.body.role)) {
+    return res.status(400).json({ error: 'Invalid role' });
+  }
+
+  next();
+}
diff --git a/src/db.js b/src/db.js
index 9876543..abcdef0 100644
--- a/src/db.js
+++ b/src/db.js
@@ -1,5 +1,14 @@
 import pg from 'pg';
+import Redis from 'ioredis';

 export const db = new pg.Pool({
-  connectionString: process.env.DATABASE_URL,
+  connectionString: process.env.DATABASE_URL,
+  max: 20,
+  idleTimeoutMillis: 30000,
+});
+
+export const redis = new Redis(process.env.REDIS_URL, {
+  maxRetriesPerRequest: 3,
+  retryStrategy(times) {
+    return Math.min(times * 50, 2000);
+  },
 });
`;
  window.__DIFF_DATA__ = btoa(sampleDiff);
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
