const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/auth/register ───────────────────────────────────────────────
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('Prénom requis'),
  body('lastName').trim().notEmpty().withMessage('Nom requis'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe min 6 caractères'),
  body('phone').optional().isMobilePhone().withMessage('Numéro de téléphone invalide'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, email, password, phone } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé.' });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        role: 'PARTICIPANT',
        participant: { create: {} },
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, role: true,
        participant: { select: { id: true, numInscription: true } },
      },
    });

    const token = generateToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        formateur: { select: { id: true } },
        participant: { select: { id: true, numInscription: true } },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });

    const token = generateToken(user.id);
    const { password: _, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        isActive: true,
        createdAt: true,
        formateur: { select: { id: true, specialite: true } },
        participant: {
          select: {
            id: true,
            numInscription: true,
            _count: { select: { inscriptions: true } },
          },
        },
      },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/auth/change-password ──────────────────────────────────────
router.patch('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nouveau mot de passe min 6 caractères'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    res.json({ message: 'Mot de passe mis à jour.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
