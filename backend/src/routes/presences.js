// ═══════════════════════════════════════════════════════════════
// presences.js
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const presenceRouter = express.Router();

// Formateur enregistre les présences d'une session
presenceRouter.post('/bulk', authenticate, authorize('FORMATEUR', 'ADMIN'), async (req, res, next) => {
  try {
    const { formationId, date, presences } = req.body;
    // presences = [{ participantId, status }]
    if (!formationId || !presences?.length) {
      return res.status(400).json({ error: 'formationId et presences requis.' });
    }

    const formateur = await prisma.formateur.findUnique({ where: { userId: req.user.id } });
    if (!formateur && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Profil formateur non trouvé.' });
    }

    const sessionDate = date ? new Date(date) : new Date();
    // Normaliser à minuit pour éviter les doublons par heure
    sessionDate.setHours(0, 0, 0, 0);

    const created = await prisma.$transaction(
      presences.map(p =>
        prisma.presence.upsert({
          where: {
            participantId_formationId_date: {
              participantId: p.participantId,
              formationId: parseInt(formationId),
              date: sessionDate,
            },
          },
          update: { status: p.status, notes: p.notes },
          create: {
            participantId: p.participantId,
            formationId: parseInt(formationId),
            formateurId: formateur?.id || 1,
            status: p.status || 'PRESENT',
            date: sessionDate,
            notes: p.notes,
          },
        })
      )
    );

    res.json({ message: `${created.length} présences enregistrées.`, data: created });
  } catch (err) {
    next(err);
  }
});

// Liste des présences d'une formation
presenceRouter.get('/formation/:formationId', authenticate, async (req, res, next) => {
  try {
    const presences = await prisma.presence.findMany({
      where: { formationId: parseInt(req.params.formationId) },
      include: {
        participant: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(presences);
  } catch (err) {
    next(err);
  }
});

module.exports = presenceRouter;
