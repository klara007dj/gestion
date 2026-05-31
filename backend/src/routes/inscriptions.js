const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/inscriptions — Participant s'inscrit à une formation ────────
router.post('/', authenticate, authorize('PARTICIPANT'), async (req, res, next) => {
  try {
    const { formationId } = req.body;
    if (!formationId) return res.status(400).json({ error: 'formationId requis.' });

    // Trouver le participant lié au user
    const participant = await prisma.participant.findUnique({
      where: { userId: req.user.id },
    });
    if (!participant) return res.status(404).json({ error: 'Profil participant non trouvé.' });

    // Vérifier que la formation existe et a des places
    const formation = await prisma.formation.findUnique({
      where: { id: parseInt(formationId), isActive: true },
      include: { _count: { select: { inscriptions: { where: { status: 'VALIDEE' } } } } },
    });
    if (!formation) return res.status(404).json({ error: 'Formation non trouvée.' });
    if (formation._count.inscriptions >= formation.placesMax) {
      return res.status(400).json({ error: 'Plus de places disponibles.' });
    }

    // Vérifier pas de double inscription
    const existing = await prisma.inscription.findUnique({
      where: { participantId_formationId: { participantId: participant.id, formationId: parseInt(formationId) } },
    });
    if (existing) return res.status(409).json({ error: 'Vous êtes déjà inscrit à cette formation.' });

    const inscription = await prisma.inscription.create({
      data: { participantId: participant.id, formationId: parseInt(formationId) },
      include: {
        formation: { select: { titre: true, prix: true, dateDebut: true } },
        participant: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    res.status(201).json(inscription);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/inscriptions — Admin: toutes | Participant: les siennes ──────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, formationId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    if (status) where.status = status;
    if (formationId) where.formationId = parseInt(formationId);

    // Participants voient uniquement leurs inscriptions
    if (req.user.role === 'PARTICIPANT') {
      const participant = await prisma.participant.findUnique({ where: { userId: req.user.id } });
      if (!participant) return res.json({ data: [], meta: { total: 0 } });
      where.participantId = participant.id;
    }

    // Formateurs voient les inscriptions de leurs formations
    if (req.user.role === 'FORMATEUR') {
      const formateur = await prisma.formateur.findUnique({ where: { userId: req.user.id } });
      where.formation = { formateurId: formateur.id };
    }

    const [inscriptions, total] = await Promise.all([
      prisma.inscription.findMany({
        where,
        include: {
          participant: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
          formation: { select: { id: true, titre: true, dateDebut: true, dateFin: true, prix: true } },
          paiements: { select: { montant: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.inscription.count({ where }),
    ]);

    res.json({
      data: inscriptions,
      meta: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/inscriptions/:id/status — Admin valide/refuse ─────────────
router.patch('/:id/status', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { status, motifRefus } = req.body;
    const validStatuses = ['VALIDEE', 'REFUSEE', 'ANNULEE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide.' });
    }

    const inscription = await prisma.inscription.update({
      where: { id: parseInt(req.params.id) },
      data: { status, motifRefus: status === 'REFUSEE' ? motifRefus : null },
      include: {
        participant: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        formation: { select: { titre: true } },
      },
    });

    res.json(inscription);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
