const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Liste tous les utilisateurs (Admin)
router.get('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true, email: true,
          phone: true, role: true, isActive: true, createdAt: true,
          formateur: { select: { id: true, specialite: true } },
          participant: { select: { id: true, numInscription: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: users, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
});

// Créer un formateur (Admin)
router.post('/formateurs', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, specialite, bio } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        firstName, lastName, email, password: hashed, phone,
        role: 'FORMATEUR',
        formateur: { create: { specialite, bio } },
      },
      include: { formateur: true },
    });

    const { password: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (err) { next(err); }
});

// Activer/désactiver un compte
router.patch('/:id/toggle', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    const updated = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true, firstName: true, lastName: true },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// Mettre à jour son profil
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { firstName, lastName, phone, address },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, address: true },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
