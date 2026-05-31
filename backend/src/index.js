require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const domaineRoutes = require('./routes/domaines');
const formationRoutes = require('./routes/formations');
const inscriptionRoutes = require('./routes/inscriptions');
const paiementRoutes = require('./routes/paiements');
const presenceRoutes = require('./routes/presences');
const attestationRoutes = require('./routes/attestations');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Liste des origines autorisées ────────────────────────────────────────
// FRONTEND_URL peut être une seule URL ou plusieurs séparées par des virgules
// Ex: FRONTEND_URL=https://gestion-alpha-one.vercel.app,https://mon-autre-domaine.com
const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = rawOrigins
  .split(',')
  .map(o => o.trim().replace(/\/$/, '')); // supprimer les slashes finaux

console.log('✅ Origines CORS autorisées:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    // Supprimer le slash final éventuel de l'origine entrante
    const cleanOrigin = origin.replace(/\/$/, '');

    if (allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
    } else {
      console.warn(`⛔ Origine CORS bloquée: ${origin}`);
      console.warn(`   Origines autorisées: ${allowedOrigins.join(', ')}`);
      callback(new Error(`Origine non autorisée par CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200, // Certains navigateurs (IE11) ont des problèmes avec 204
};

// ─── Middlewares de sécurité ───────────────────────────────────────────────
app.set('trust proxy', 1); // Requis sur Railway derrière un proxy

// ⚠️ CORS DOIT être avant helmet et tout le reste
app.use(cors(corsOptions));

// Gérer explicitement les requêtes preflight OPTIONS sur toutes les routes
app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
});
app.use(limiter);

// Rate limiting strict pour l'auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
});

// ─── Healthcheck Railway ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'API Gestion Formations SECEL - v1.0', status: 'running' });
});

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/domaines', domaineRoutes);
app.use('/api/formations', formationRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/presences', presenceRoutes);
app.use('/api/attestations', attestationRoutes);
app.use('/api/stats', statsRoutes);

// ─── Gestion des erreurs ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  
  // Erreurs Prisma courantes
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Cette valeur existe déjà (doublon).' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Enregistrement non trouvé.' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message,
  });
});

// ─── Démarrage ─────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
