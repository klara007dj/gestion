// ─────────────────────────────────────────────────────────────────────────
// FICHIER TEMPORAIRE : backend/src/routes/setup.js
// Ajoute cet endpoint UNE SEULE FOIS pour créer l'admin,
// puis SUPPRIME ce fichier et la ligne qui l'importe dans index.js
// ─────────────────────────────────────────────────────────────────────────
const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET https://gestion-production-ca87.up.railway.app/api/setup
// Ouvre cette URL dans ton navigateur UNE SEULE FOIS
router.get('/', async (req, res) => {
  // Clé de sécurité — change-la si tu veux
  const SECRET = process.env.SETUP_SECRET || 'secel-setup-2025';
  if (req.query.key !== SECRET) {
    return res.status(403).json({ error: 'Clé manquante. Ajoute ?key=secel-setup-2025 à l\'URL' });
  }

  try {
    const results = [];

    // ── Admin ──────────────────────────────────────────────────────────
    const adminPwd = await bcrypt.hash('Admin@2025', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@secel.cm' },
      update: {},
      create: {
        firstName: 'Admin',
        lastName: 'SECEL',
        email: 'admin@secel.cm',
        password: adminPwd,
        phone: '+237699000000',
        role: 'ADMIN',
        isActive: true,
      },
    });
    results.push(`✅ Admin créé/existant : ${admin.email}`);

    // ── Formateur ──────────────────────────────────────────────────────
    const fmtPwd = await bcrypt.hash('Formateur@2025', 12);
    const fmt = await prisma.user.upsert({
      where: { email: 'formateur@secel.cm' },
      update: {},
      create: {
        firstName: 'Jean',
        lastName: 'DIFFO',
        email: 'formateur@secel.cm',
        password: fmtPwd,
        phone: '+237677000000',
        role: 'FORMATEUR',
        isActive: true,
        formateur: {
          create: {
            specialite: 'Développement Web',
            bio: 'Formateur certifié',
          },
        },
      },
    });
    results.push(`✅ Formateur créé/existant : ${fmt.email}`);

    // ── Domaines ───────────────────────────────────────────────────────
    const domaines = [
      'Développement Web', 'Cybersécurité', 'Data Science',
      'Intelligence Artificielle', 'Réseaux Informatiques',
      'Bureautique', 'Infographie', 'Développement Mobile',
      'Maintenance Informatique',
    ];
    for (const nom of domaines) {
      await prisma.domaine.upsert({
        where: { nom },
        update: {},
        create: { nom },
      });
    }
    results.push(`✅ ${domaines.length} domaines créés/existants`);

    return res.json({
      success: true,
      message: '🎉 Base de données initialisée !',
      details: results,
      comptes: {
        admin: { email: 'admin@secel.cm', password: 'Admin@2025' },
        formateur: { email: 'formateur@secel.cm', password: 'Formateur@2025' },
      },
      action: '⚠️  SUPPRIME ce fichier setup.js et son import dans index.js maintenant !',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
