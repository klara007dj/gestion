// domaines.js
const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const domaines = await prisma.domaine.findMany({
      include: { _count: { select: { formations: { where: { isActive: true } } } } },
      orderBy: { nom: 'asc' },
    });
    res.json(domaines);
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { nom, description } = req.body;
    if (!nom) return res.status(400).json({ error: 'Nom requis.' });
    const domaine = await prisma.domaine.create({ data: { nom, description } });
    res.status(201).json(domaine);
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const domaine = await prisma.domaine.update({
      where: { id: parseInt(req.params.id) },
      data: { nom: req.body.nom, description: req.body.description },
    });
    res.json(domaine);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.domaine.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Domaine supprimé.' });
  } catch (err) { next(err); }
});

module.exports = router;
