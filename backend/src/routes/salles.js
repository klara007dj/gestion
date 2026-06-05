// ═══════════════════════════════════════════════════════════════
// salles.js — Gestion des salles
// Lecture : tout utilisateur authentifié — Écritures : ADMIN
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/salles — Liste (authentifié) ─────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const salles = await prisma.salle.findMany({
      include: { _count: { select: { seances: true } } },
      orderBy: { nom: 'asc' },
    });
    res.json(salles);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/salles — Créer (ADMIN) ──────────────────────────────────────
router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const nom = typeof req.body.nom === 'string' ? req.body.nom.trim() : '';
    const capacite = parseInt(req.body.capacite, 10);

    if (!nom) return res.status(400).json({ error: 'Le nom de la salle est requis.' });
    if (!Number.isInteger(capacite) || capacite <= 0) {
      return res.status(400).json({ error: 'La capacité doit être un entier supérieur à 0.' });
    }

    const salle = await prisma.salle.create({ data: { nom, capacite } });
    res.status(201).json(salle);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/salles/:id — Modifier (ADMIN) ──────────────────────────────
router.patch('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = {};

    if (req.body.nom !== undefined) {
      const nom = typeof req.body.nom === 'string' ? req.body.nom.trim() : '';
      if (!nom) return res.status(400).json({ error: 'Le nom de la salle ne peut pas être vide.' });
      data.nom = nom;
    }

    if (req.body.capacite !== undefined) {
      const capacite = parseInt(req.body.capacite, 10);
      if (!Number.isInteger(capacite) || capacite <= 0) {
        return res.status(400).json({ error: 'La capacité doit être un entier supérieur à 0.' });
      }
      data.capacite = capacite;
    }

    if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive);

    const salle = await prisma.salle.update({
      where: { id: parseInt(req.params.id, 10) },
      data,
    });
    res.json(salle);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/salles/:id — Supprimer (ADMIN) ────────────────────────────
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const count = await prisma.seance.count({ where: { salleId: id } });
    if (count > 0) {
      return res.status(409).json({
        error: 'Impossible de supprimer : des séances sont liées à cette salle.',
      });
    }

    await prisma.salle.delete({ where: { id } });
    res.json({ message: 'Salle supprimée.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
