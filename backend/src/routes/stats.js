const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Dashboard admin — statistiques globales
router.get('/dashboard', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const [
      totalFormations,
      totalParticipants,
      totalFormateurs,
      totalInscriptions,
      inscriptionsEnAttente,
      inscriptionsValidees,
      totalPaiements,
      paiementsEnAttente,
      attestationsDelivrees,
      formationsActives,
      formationsParDomaine,
      inscriptionsParMois,
    ] = await Promise.all([
      prisma.formation.count(),
      prisma.participant.count(),
      prisma.formateur.count(),
      prisma.inscription.count(),
      prisma.inscription.count({ where: { status: 'EN_ATTENTE' } }),
      prisma.inscription.count({ where: { status: 'VALIDEE' } }),
      prisma.paiement.aggregate({ _sum: { montant: true }, where: { status: 'PAYE' } }),
      prisma.paiement.count({ where: { status: 'EN_ATTENTE' } }),
      prisma.attestation.count({ where: { isValid: true } }),
      prisma.formation.count({ where: { isActive: true } }),
      prisma.domaine.findMany({
        include: { _count: { select: { formations: true } } },
        orderBy: { formations: { _count: 'desc' } },
        take: 5,
      }),
      // Inscriptions des 6 derniers mois
      // COUNT(*)::int → renvoie un entier JS (sinon BigInt non sérialisable en JSON → 500)
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") as mois,
          COUNT(*)::int as total
        FROM inscriptions
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY mois ASC
      `,
    ]);

    // Top 5 formations les plus demandées
    const topFormations = await prisma.formation.findMany({
      include: {
        _count: { select: { inscriptions: true } },
        domaine: { select: { nom: true } },
      },
      orderBy: { inscriptions: { _count: 'desc' } },
      take: 5,
    });

    res.json({
      formations: {
        total: totalFormations,
        actives: formationsActives,
        top: topFormations,
        parDomaine: formationsParDomaine,
      },
      participants: { total: totalParticipants },
      formateurs: { total: totalFormateurs },
      inscriptions: {
        total: totalInscriptions,
        enAttente: inscriptionsEnAttente,
        validees: inscriptionsValidees,
        parMois: inscriptionsParMois,
      },
      finances: {
        totalPercu: totalPaiements._sum.montant || 0,
        paiementsEnAttente,
      },
      attestations: { total: attestationsDelivrees },
    });
  } catch (err) {
    next(err);
  }
});

// Stats formateur
router.get('/formateur', authenticate, authorize('FORMATEUR'), async (req, res, next) => {
  try {
    const formateur = await prisma.formateur.findUnique({ where: { userId: req.user.id } });
    if (!formateur) return res.status(404).json({ error: 'Profil formateur non trouvé.' });

    const formations = await prisma.formation.findMany({
      where: { formateurId: formateur.id, isActive: true },
      include: {
        _count: { select: { inscriptions: { where: { status: 'VALIDEE' } }, presences: true } },
        domaine: { select: { nom: true } },
      },
    });

    res.json({
      totalFormations: formations.length,
      formations,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
