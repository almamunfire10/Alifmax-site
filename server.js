const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const ADMIN_PASSWORD = '12345678';
const ROOT_DIR = __dirname;
const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');
const PROFILE_PATH = path.join(UPLOAD_DIR, 'profile.jpg');
const BACKGROUND_PATH = path.join(UPLOAD_DIR, 'background.jpg');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.urlencoded({ extended: true }));
app.use(express.static(ROOT_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

const profileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, 'profile.jpg')
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const backgroundUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, 'background.jpg')
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function isAdmin(req) {
  const cookie = req.headers.cookie || '';
  return cookie.includes('admin=true');
}

function listFiles() {
  return fs.readdirSync(UPLOAD_DIR).filter((name) => !name.startsWith('.'));
}

app.get('/admin', (req, res) => {
  if (!isAdmin(req)) {
    return res.sendFile(path.join(ROOT_DIR, 'admin-login.html'));
  }
  return res.sendFile(path.join(ROOT_DIR, 'admin.html'));
});

app.post('/login', (req, res) => {
  const { password } = req.body || {};

  if (password === ADMIN_PASSWORD) {
    res.setHeader('Set-Cookie', 'admin=true; Path=/; HttpOnly');
    return res.redirect('/admin');
  }

  return res.status(401).send('Incorrect password.');
});

app.post('/upload-profile', profileUpload.single('profileImage'), (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send('Admin access required.');
  }

  if (!req.file) {
    return res.status(400).send('No profile image uploaded.');
  }

  return res.redirect('/admin');
});

app.post('/upload-background', backgroundUpload.single('backgroundImage'), (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send('Admin access required.');
  }

  if (!req.file) {
    return res.status(400).send('No background image uploaded.');
  }

  return res.redirect('/admin');
});

app.post('/upload', upload.array('files', 20), (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send('Admin access required.');
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const uploaded = req.files.map((file) => file.filename);
  return res.send(`Uploaded ${uploaded.length} file(s): ${uploaded.join(', ')}`);
});

app.get('/api/files', (req, res) => {
  const files = listFiles()
    .filter((file) => file !== 'profile.jpg' && file !== 'background.jpg')
    .map((file) => ({
      name: file,
      url: `/uploads/${file}`
    }));

  res.json(files);
});

app.get('/api/profile', (req, res) => {
  if (fs.existsSync(PROFILE_PATH)) {
    return res.json({ url: '/uploads/profile.jpg' });
  }
  return res.json({ url: '' });
});

app.get('/api/background', (req, res) => {
  if (fs.existsSync(BACKGROUND_PATH)) {
    return res.json({ url: '/uploads/background.jpg' });
  }
  return res.json({ url: '' });
});

app.get('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'admin=; Path=/; Max-Age=0');
  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log(`Personal site server running on http://localhost:${PORT}`);
});
