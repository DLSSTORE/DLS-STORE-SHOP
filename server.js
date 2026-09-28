const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const SESSION_COOKIE = 'dls_admin_session';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'caothangzzz';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'CHANGE_ME_TO_A_STRONG_PASSWORD';
const COOKIE_SECURE = String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true';

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const defaultData = {
  heroImage: '',
  products: [
    {
      id: 1,
      name: 'DLS ACC VIP #01',
      price: '500.000đ',
      status: 'available',
      description: '• Đội hình mạnh\n• Nhiều cầu thủ chất lượng\n• Thông tin đúng theo hình ảnh\n• Xem ảnh chi tiết trước khi mua\n\nKhách hàng vui lòng liên hệ Zalo để kiểm tra\nthông tin và trao đổi trước khi giao dịch.',
      image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=85',
      images: [
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=85'
      ]
    }
  ]
};

function readData() {
  try {
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error(e);
    return JSON.parse(JSON.stringify(defaultData));
  }
}
function writeData(data) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach(pair => {
    const i = pair.indexOf('=');
    if (i > -1) out[pair.slice(0, i).trim()] = decodeURIComponent(pair.slice(i + 1));
  });
  return out;
}
const sessions = new Map();
function requireAdmin(req, res, next) {
  const token = parseCookies(req)[SESSION_COOKIE];
  const session = token && sessions.get(token);
  if (!session || session.expires < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  }
  next();
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, crypto.randomBytes(12).toString('hex') + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype))
});

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }));
app.use(express.static(PUBLIC));

app.get('/api/store', (_req, res) => {
  const data = readData();
  res.json({ ok: true, heroImage: data.heroImage || '', products: data.products || [] });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Sai tài khoản hoặc mật khẩu.' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${COOKIE_SECURE ? '; Secure' : ''}`);
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${COOKIE_SECURE ? '; Secure' : ''}`);
  res.json({ ok: true });
});
app.get('/api/me', (req, res) => {
  const token = parseCookies(req)[SESSION_COOKIE];
  const session = token && sessions.get(token);
  if (session && session.expires >= Date.now()) return res.json({ ok: true, admin: true });
  res.json({ ok: true, admin: false });
});

app.post('/api/hero', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'Chưa chọn ảnh hợp lệ.' });
  const data = readData();
  data.heroImage = `/uploads/${req.file.filename}`;
  writeData(data);
  res.json({ ok: true, heroImage: data.heroImage });
});
app.delete('/api/hero', requireAdmin, (_req, res) => {
  const data = readData();
  if (data.heroImage && data.heroImage.startsWith('/uploads/')) {
    const old = path.join(UPLOAD_DIR, path.basename(data.heroImage));
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }
  data.heroImage = '';
  writeData(data);
  res.json({ ok: true });
});

app.post('/api/products', requireAdmin, upload.array('images', 12), (req, res) => {
  const { id, name, price, status, description, mainIndex } = req.body || {};
  if (!name || !price) return res.status(400).json({ ok: false, error: 'Thiếu tên hoặc giá.' });
  const files = req.files || [];
  let urls = files.map(f => `/uploads/${f.filename}`);
  if (!urls.length && req.body.existingImages) {
    try { urls = JSON.parse(req.body.existingImages); } catch {}
  }
  if (!urls.length) return res.status(400).json({ ok: false, error: 'Hãy chọn ít nhất một ảnh.' });
  const main = Math.max(0, Math.min(Number(mainIndex || 0), urls.length - 1));
  const product = {
    id: id ? Number(id) : Date.now(),
    name: String(name).trim(), price: String(price).trim(),
    status: status === 'sold' ? 'sold' : 'available',
    description: String(description || '').trim(),
    image: urls[main], images: urls
  };
  const data = readData();
  const idx = data.products.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    const old = data.products[idx];
    const oldFiles = [...new Set([old.image, ...(old.images || [])])].filter(x => x && x.startsWith('/uploads/'));
    const newSet = new Set(urls);
    oldFiles.filter(x => !newSet.has(x)).forEach(x => { const f = path.join(UPLOAD_DIR, path.basename(x)); if (fs.existsSync(f)) fs.unlinkSync(f); });
    data.products[idx] = product;
  } else data.products.push(product);
  writeData(data);
  res.json({ ok: true, product });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  const p = data.products.find(x => x.id === id);
  if (!p) return res.status(404).json({ ok: false, error: 'Không tìm thấy tài khoản.' });
  [...new Set([p.image, ...(p.images || [])])].filter(x => x && x.startsWith('/uploads/')).forEach(x => {
    const f = path.join(UPLOAD_DIR, path.basename(x)); if (fs.existsSync(f)) fs.unlinkSync(f);
  });
  data.products = data.products.filter(x => x.id !== id);
  writeData(data);
  res.json({ ok: true });
});

app.put('/api/products/:id/status', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  const p = data.products.find(x => x.id === id);
  if (!p) return res.status(404).json({ ok: false, error: 'Không tìm thấy.' });
  p.status = req.body?.status === 'sold' ? 'sold' : 'available';
  writeData(data);
  res.json({ ok: true, product: p });
});

app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));

app.listen(PORT, () => console.log(`DLS Store running on http://localhost:${PORT}`));
