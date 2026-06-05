const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const paiementInclude = {
  inscription: { include: { formation: { select: { titre: true, prix: true } } } },
  participant: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
};

// ─── POST /api/paiements ──────────────────────────────────────────────────
// Participant : déclare un paiement pour SA propre inscription validée → EN_ATTENTE
// Admin       : enregistre un paiement déjà encaissé → PAYE (incrémente le solde)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { inscriptionId, montant, modePaiement, reference, notes, datePaiement } = req.body;
    if (!inscriptionId || !montant) {
      return res.status(400).json({ error: 'inscriptionId et montant requis.' });
    }
    if (parseFloat(montant) <= 0) {
      return res.status(400).json({ error: 'Le montant doit être supérieur à 0.' });
    }

    const inscription = await prisma.inscription.findUnique({
      where: { id: parseInt(inscriptionId) },
      include: { participant: true, formation: { select: { prix: true } }, paiements: true },
    });
    if (!inscription) return res.status(404).json({ error: 'Inscription non trouvée.' });

    const isAdmin = req.user.role === 'ADMIN';

    // Contrôles spécifiques au participant
    if (!isAdmin) {
      const participant = await prisma.participant.findUnique({ where: { userId: req.user.id } });
      if (!participant || participant.id !== inscription.participantId) {
        return res.status(403).json({ error: 'Accès refusé.' });
      }
      if (inscription.status !== 'VALIDEE') {
        return res.status(400).json({ error: "L'inscription doit être validée avant de payer." });
      }
      // Empêcher un second paiement en attente sur la même inscription
      const dejaEnAttente = inscription.paiements.some(p => p.status === 'EN_ATTENTE');
      if (dejaEnAttente) {
        return res.status(409).json({ error: 'Un paiement est déjà en attente de validation.' });
      }
    }

    const paiement = await prisma.paiement.create({
      data: {
        inscriptionId: parseInt(inscriptionId),
        participantId: inscription.participantId,
        montant: parseFloat(montant),
        modePaiement,
        reference,
        notes,
        // Admin → encaissé directement. Participant → en attente de validation admin.
        status: isAdmin ? 'PAYE' : 'EN_ATTENTE',
        datePaiement: isAdmin ? (datePaiement ? new Date(datePaiement) : new Date()) : null,
      },
      include: paiementInclude,
    });

    res.status(201).json(paiement);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/paiements/:id/valider — Admin valide un paiement déclaré ───
// → passe en PAYE : le montant s'ajoute au solde de l'administration
router.patch('/:id/valider', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const paiement = await prisma.paiement.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!paiement) return res.status(404).json({ error: 'Paiement non trouvé.' });
    if (paiement.status === 'PAYE') {
      return res.status(400).json({ error: 'Ce paiement est déjà validé.' });
    }

    const updated = await prisma.paiement.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'PAYE', datePaiement: paiement.datePaiement || new Date() },
      include: paiementInclude,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/paiements/:id — Admin refuse/annule un paiement en attente ─
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const paiement = await prisma.paiement.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!paiement) return res.status(404).json({ error: 'Paiement non trouvé.' });
    if (paiement.status === 'PAYE') {
      return res.status(400).json({ error: 'Impossible de supprimer un paiement déjà validé.' });
    }

    await prisma.paiement.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/paiements — Admin: tous | Participant: les siens ─────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (status) where.status = status;

    // Le participant ne voit que ses propres paiements
    if (req.user.role === 'PARTICIPANT') {
      const participant = await prisma.participant.findUnique({ where: { userId: req.user.id } });
      if (!participant) return res.json({ data: [], meta: { total: 0 } });
      where.participantId = participant.id;
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const [paiements, total] = await Promise.all([
      prisma.paiement.findMany({
        where,
        include: paiementInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.paiement.count({ where }),
    ]);

    res.json({ data: paiements, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
