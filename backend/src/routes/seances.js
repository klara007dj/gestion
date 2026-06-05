// ═══════════════════════════════════════════════════════════════
// seances.js — Emploi du temps (planning)
// Lecture : authentifié (filtrée par rôle) — Écritures : ADMIN
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Include commun pour les réponses
const seanceInclude = {
  formation: { select: { id: true, titre: true } },
  formateur: { include: { user: { select: { firstName: true, lastName: true } } } },
  salle: { select: { id: true, nom: true } },
};

// "YYYY-MM-DD" → Date (minuit UTC) pour un champ @db.Date
function toDateOnly(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// "HH:MM" ou "HH:MM:SS" → Date (1970-01-01 UTC) pour un champ @db.Time
function toTimeOnly(value) {
  if (typeof value !== 'string') return null;
  const m = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const sec = m[3] ? parseInt(m[3], 10) : 0;
  if (h > 23 || min > 59 || sec > 59) return null;
  return new Date(Date.UTC(1970, 0, 1, h, min, sec));
}

// Chevauchement de deux créneaux : debutA < finB && finA > debutB
function overlaps(debutA, finA, debutB, finB) {
  return debutA < finB && finA > debutB;
}

// ─── POST /api/seances — Créer (ADMIN) ─────────────────────────────────────
router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { titre, date, heureDebut, heureFin } = req.body;
    const formationId = parseInt(req.body.formationId, 10);
    const formateurId = parseInt(req.body.formateurId, 10);
    const salleId = parseInt(req.body.salleId, 10);

    const dateOnly = toDateOnly(date);
    const debut = toTimeOnly(heureDebut);
    const fin = toTimeOnly(heureFin);

    if (!dateOnly) return res.status(400).json({ error: 'Date invalide.' });
    if (!debut || !fin) return res.status(400).json({ error: 'Heures invalides (format attendu HH:MM).' });
    if (fin <= debut) return res.status(400).json({ error: "L'heure de fin doit être après l'heure de début." });
    if (!Number.isInteger(formationId)) return res.status(400).json({ error: 'Formation requise.' });
    if (!Number.isInteger(formateurId)) return res.status(400).json({ error: 'Formateur requis.' });
    if (!Number.isInteger(salleId)) return res.status(400).json({ error: 'Salle requise.' });

    // ─ Détection de conflits sur la même date ─
    const sameDay = await prisma.seance.findMany({
      where: { date: dateOnly, OR: [{ salleId }, { formateurId }] },
      select: { salleId: true, formateurId: true, heureDebut: true, heureFin: true },
    });

    const salleConflit = sameDay.some(
      (s) => s.salleId === salleId && overlaps(debut, fin, s.heureDebut, s.heureFin)
    );
    if (salleConflit) {
      return res.status(409).json({ error: 'La salle est déjà occupée sur ce créneau.' });
    }

    const formateurConflit = sameDay.some(
      (s) => s.formateurId === formateurId && overlaps(debut, fin, s.heureDebut, s.heureFin)
    );
    if (formateurConflit) {
      return res.status(409).json({ error: 'Le formateur donne déjà un cours sur ce créneau.' });
    }

    const seance = await prisma.seance.create({
      data: {
        titre: titre?.trim() || null,
        date: dateOnly,
        heureDebut: debut,
        heureFin: fin,
        formationId,
        formateurId,
        salleId,
      },
      include: seanceInclude,
    });

    res.status(201).json(seance);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/seances — Emploi du temps (filtré par rôle) ──────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { formationId, formateurId, salleId, date, from, to } = req.query;
    const where = {};

    if (formationId) where.formationId = parseInt(formationId, 10);
    if (salleId) where.salleId = parseInt(salleId, 10);
    if (formateurId) where.formateurId = parseInt(formateurId, 10);

    // Filtre de date : exact (date) ou plage (from/to)
    if (date) {
      const d = toDateOnly(date);
      if (d) where.date = d;
    } else if (from || to) {
      where.date = {};
      const f = from && toDateOnly(from);
      const t = to && toDateOnly(to);
      if (f) where.date.gte = f;
      if (t) where.date.lte = t;
    }

    // Restriction selon le rôle
    if (req.user.role === 'FORMATEUR') {
      const formateur = await prisma.formateur.findUnique({ where: { userId: req.user.id } });
      if (!formateur) return res.json([]);
      where.formateurId = formateur.id;
    } else if (req.user.role === 'PARTICIPANT') {
      const participant = await prisma.participant.findUnique({ where: { userId: req.user.id } });
      if (!participant) return res.json([]);
      const inscriptions = await prisma.inscription.findMany({
        where: { participantId: participant.id, status: 'VALIDEE' },
        select: { formationId: true },
      });
      const formationIds = inscriptions.map((i) => i.formationId);
      if (formationIds.length === 0) return res.json([]);
      where.formationId = where.formationId
        ? (formationIds.includes(where.formationId) ? where.formationId : -1)
        : { in: formationIds };
    }

    const seances = await prisma.seance.findMany({
      where,
      include: seanceInclude,
      orderBy: [{ date: 'asc' }, { heureDebut: 'asc' }],
    });

    res.json(seances);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/seances/:id — Supprimer (ADMIN) ───────────────────────────
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.seance.delete({ where: { id: parseInt(req.params.id, 10) } });
    res.json({ message: 'Séance supprimée.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
