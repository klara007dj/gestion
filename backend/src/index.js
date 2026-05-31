require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const domaineRoutes = require('./routes/domaines');
const formationRoutes = require('./routes/formations');
const inscriptionRoutes = require('./routes/inscriptions');
const paiementRoutes = require('./routes/paiements');
const presenceRoutes = require('./routes/presences');
const attestationRoutes = require('./routes/attestations');
const statsRoutes = require('./routes/stats');

const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS Manuel — EN PREMIER avant tout ─────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = rawOrigins.split(',').map(o => o.trim().replace(/\/$/, ''));

  if (origin && allowedOrigins.includes(origin.replace(/\/$/, ''))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// ─── Middlewares ──────────────────────────────────────────────────────────
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
  skip: (req) => req.method === 'OPTIONS',
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives de connexion.' },
  skip: (req) => req.method === 'OPTIONS',
});

// ─── Healthcheck ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'API Gestion Formations SECEL - v1.0', status: 'running' });
});

// ─── Route setup (initialise admin + domaines) ────────────────────────────
// Appelle: GET /api/setup?key=secel-setup-2025
// SUPPRIME cette route après usage
app.get('/api/setup', async (req, res) => {
  const SECRET = process.env.SETUP_SECRET || 'secel-setup-2025';
  if (req.query.key !== SECRET) {
    return res.status(403).json({ error: 'Ajoute ?key=secel-setup-2025 à l\'URL' });
  }

  try {
    const results = [];

    // Admin
    const adminPwd = await bcrypt.hash('Admin@2025', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@secel.cm' },
      update: {},
      create: {
        firstName: 'Admin', lastName: 'SECEL',
        email: 'admin@secel.cm', password: adminPwd,
        phone: '+237699000000', role: 'ADMIN', isActive: true,
      },
    });
    results.push('✅ Admin: ' + admin.email);

    // Formateur
    const fmtPwd = await bcrypt.hash('Formateur@2025', 12);
    const fmt = await prisma.user.upsert({
      where: { email: 'formateur@secel.cm' },
      update: {},
      create: {
        firstName: 'Jean', lastName: 'DIFFO',
        email: 'formateur@secel.cm', password: fmtPwd,
        phone: '+237677000000', role: 'FORMATEUR', isActive: true,
        formateur: { create: { specialite: 'Développement Web', bio: 'Formateur certifié' } },
      },
    });
    results.push('✅ Formateur: ' + fmt.email);

    // Domaines
    const domaines = [
      'Développement Web', 'Cybersécurité', 'Data Science',
      'Intelligence Artificielle', 'Réseaux Informatiques',
      'Bureautique', 'Infographie', 'Développement Mobile',
      'Maintenance Informatique',
    ];
    for (const nom of domaines) {
      await prisma.domaine.upsert({ where: { nom }, update: {}, create: { nom } });
    }
    results.push('✅ ' + domaines.length + ' domaines créés');

    return res.json({
      success: true,
      message: '🎉 Base initialisée !',
      details: results,
      comptes: {
        admin: { email: 'admin@secel.cm', password: 'Admin@2025' },
        formateur: { email: 'formateur@secel.cm', password: 'Formateur@2025' },
      },
    });
  } catch (err) {
    console.error('Setup error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Routes API ───────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/domaines', domaineRoutes);
app.use('/api/formations', formationRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/presences', presenceRoutes);
app.use('/api/attestations', attestationRoutes);
app.use('/api/stats', statsRoutes);

// ─── Gestion des erreurs ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  if (err.code === 'P2002') return res.status(409).json({ error: 'Valeur déjà existante.' });
  if (err.code === 'P2025') return res.status(404).json({ error: 'Enregistrement non trouvé.' });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message,
  });
});

// ─── Démarrage ────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ CORS autorisé pour: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

module.exports = app;
