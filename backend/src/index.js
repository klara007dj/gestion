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

// ─── Middlewares de sécurité ───────────────────────────────────────────────
app.set('trust proxy', 1); // Requis sur Railway derrière un proxy

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
