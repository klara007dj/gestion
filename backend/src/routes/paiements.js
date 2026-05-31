const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Enregistrer un paiement (Admin)
router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { inscriptionId, montant, modePaiement, reference, notes, datePaiement } = req.body;
    if (!inscriptionId || !montant) {
      return res.status(400).json({ error: 'inscriptionId et montant requis.' });
    }

    const inscription = await prisma.inscription.findUnique({
      where: { id: parseInt(inscriptionId) },
      include: { participant: true },
    });
    if (!inscription) return res.status(404).json({ error: 'Inscription non trouvée.' });

    const paiement = await prisma.paiement.create({
      data: {
        inscriptionId: parseInt(inscriptionId),
        participantId: inscription.participantId,
        montant: parseFloat(montant),
        modePaiement,
        reference,
        notes,
        datePaiement: datePaiement ? new Date(datePaiement) : new Date(),
        status: 'PAYE',
      },
      include: {
        inscription: { include: { formation: { select: { titre: true, prix: true } } } },
        participant: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    res.status(201).json(paiement);
  } catch (err) {
    next(err);
  }
});

// Liste des paiements
router.get('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = status ? { status } : {};

    const [paiements, total] = await Promise.all([
      prisma.paiement.findMany({
        where,
        include: {
          participant: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          inscription: { include: { formation: { select: { titre: true, prix: true } } } },
        },
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
