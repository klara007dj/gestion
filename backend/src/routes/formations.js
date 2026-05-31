const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/formations — Liste publique ──────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { domaineId, niveau, search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true };
    if (domaineId) where.domaineId = parseInt(domaineId);
    if (niveau) where.niveau = niveau;
    if (search) where.titre = { contains: search, mode: 'insensitive' };

    const [formations, total] = await Promise.all([
      prisma.formation.findMany({
        where,
        include: {
          domaine: { select: { id: true, nom: true } },
          formateur: { include: { user: { select: { firstName: true, lastName: true } } } },
          _count: { select: { inscriptions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.formation.count({ where }),
    ]);

    res.json({
      data: formations,
      meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/formations/:id ───────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const formation = await prisma.formation.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        domaine: true,
        formateur: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        _count: { select: { inscriptions: { where: { status: 'VALIDEE' } } } },
      },
    });
    if (!formation) return res.status(404).json({ error: 'Formation non trouvée.' });
    res.json(formation);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/formations — Admin uniquement ───────────────────────────────
router.post('/', authenticate, authorize('ADMIN'), [
  body('titre').trim().notEmpty().withMessage('Titre requis'),
  body('domaineId').isInt().withMessage('Domaine requis'),
  body('dateDebut').isISO8601().withMessage('Date de début invalide'),
  body('dateFin').isISO8601().withMessage('Date de fin invalide'),
  body('prix').isDecimal().withMessage('Prix invalide'),
  body('placesMax').isInt({ min: 1 }).withMessage('Nombre de places invalide'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const formation = await prisma.formation.create({
      data: {
        titre: req.body.titre,
        description: req.body.description,
        domaineId: parseInt(req.body.domaineId),
        niveau: req.body.niveau || 'DEBUTANT',
        duree: req.body.duree,
        dateDebut: new Date(req.body.dateDebut),
        dateFin: new Date(req.body.dateFin),
        prix: parseFloat(req.body.prix),
        placesMax: parseInt(req.body.placesMax),
        formateurId: req.body.formateurId ? parseInt(req.body.formateurId) : null,
      },
      include: { domaine: true, formateur: { include: { user: true } } },
    });
    res.status(201).json(formation);
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/formations/:id — Admin uniquement ────────────────────────────
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = {};
    const fields = ['titre', 'description', 'niveau', 'duree', 'isActive'];
    fields.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    if (req.body.domaineId) data.domaineId = parseInt(req.body.domaineId);
    if (req.body.prix) data.prix = parseFloat(req.body.prix);
    if (req.body.placesMax) data.placesMax = parseInt(req.body.placesMax);
    if (req.body.formateurId) data.formateurId = parseInt(req.body.formateurId);
    if (req.body.dateDebut) data.dateDebut = new Date(req.body.dateDebut);
    if (req.body.dateFin) data.dateFin = new Date(req.body.dateFin);

    const formation = await prisma.formation.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: { domaine: true, formateur: { include: { user: true } } },
    });
    res.json(formation);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/formations/:id — Admin uniquement ────────────────────────
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    // Soft delete
    await prisma.formation.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.json({ message: 'Formation désactivée.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
