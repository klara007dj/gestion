const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Générer une attestation (Admin)
router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { participantId, formationId } = req.body;

    // Vérifier que le participant a une inscription validée
    const inscription = await prisma.inscription.findFirst({
      where: {
        participantId: parseInt(participantId),
        formationId: parseInt(formationId),
        status: 'VALIDEE',
      },
    });
    if (!inscription) {
      return res.status(400).json({ error: 'Aucune inscription validée trouvée.' });
    }

    // Vérifier pas de doublon
    const existing = await prisma.attestation.findFirst({
      where: { participantId: parseInt(participantId), formationId: parseInt(formationId) },
    });
    if (existing) return res.status(409).json({ error: 'Attestation déjà générée.', data: existing });

    const attestation = await prisma.attestation.create({
      data: {
        participantId: parseInt(participantId),
        formationId: parseInt(formationId),
      },
      include: {
        participant: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        formation: {
          include: { domaine: { select: { nom: true } } },
        },
      },
    });

    res.status(201).json(attestation);
  } catch (err) {
    next(err);
  }
});

// Liste attestations d'un participant
router.get('/me', authenticate, authorize('PARTICIPANT'), async (req, res, next) => {
  try {
    const participant = await prisma.participant.findUnique({ where: { userId: req.user.id } });
    if (!participant) return res.json([]);

    const attestations = await prisma.attestation.findMany({
      where: { participantId: participant.id, isValid: true },
      include: {
        formation: {
          include: {
            domaine: { select: { nom: true } },
            formateur: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { dateEmission: 'desc' },
    });

    res.json(attestations);
  } catch (err) {
    next(err);
  }
});

// Vérifier une attestation par code (public)
router.get('/verify/:code', async (req, res, next) => {
  try {
    const attestation = await prisma.attestation.findUnique({
      where: { code: req.params.code },
      include: {
        participant: { include: { user: { select: { firstName: true, lastName: true } } } },
        formation: { select: { titre: true, duree: true, dateDebut: true, dateFin: true } },
      },
    });
    if (!attestation) return res.status(404).json({ error: 'Attestation non trouvée ou invalide.' });
    res.json(attestation);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
