import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/main.css';
import 'react-diff-view/style/index.css';

// In dev mode, inject sample diff data for UI iteration
if (import.meta.env.DEV && window.__DIFF_DATA__ === '__DIFF_PLACEHOLDER__') {
  const sampleDiff = `diff --git a/src/index.js b/src/index.js
index abc1234..def5678 100644
--- a/src/index.js
+++ b/src/index.js
@@ -1,8 +1,10 @@
-const express = require('express');
+import express from 'express';
+import cors from 'cors';

 const app = express();
+app.use(cors());

 app.get('/', (req, res) => {
-  res.send('Hello World');
+  res.json({ message: 'Hello World' });
 });

-app.listen(3000);
+app.listen(process.env.PORT || 3000);
diff --git a/src/utils.js b/src/utils.js
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/utils.js
@@ -0,0 +1,12 @@
+export function formatDate(date) {
+  return new Intl.DateTimeFormat('en-US', {
+    year: 'numeric',
+    month: 'long',
+    day: 'numeric',
+  }).format(date);
+}
+
+export function slugify(text) {
+  return text.toLowerCase()
+    .replace(/[^a-z0-9]+/g, '-')
+    .replace(/(^-|-$)/g, '');
+}
diff --git a/package.json b/package.json
index 9876543..abcdef0 100644
--- a/package.json
+++ b/package.json
@@ -3,7 +3,9 @@
   "version": "1.0.0",
   "scripts": {
-    "start": "node src/index.js"
+    "start": "node src/index.js",
+    "dev": "nodemon src/index.js",
+    "test": "jest"
   },
   "dependencies": {
-    "express": "^4.18.0"
+    "express": "^4.18.0",
+    "cors": "^2.8.5"
   }
`;
  window.__DIFF_DATA__ = btoa(sampleDiff);
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
