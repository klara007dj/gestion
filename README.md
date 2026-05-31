# 🎓 Gestion des Formations SECEL

Application web fullstack de gestion des formations professionnelles pour SECEL SARL.

## Stack technique

| Côté | Technologie |
|------|------------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Node.js + Express |
| Base de données | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (bcryptjs) |
| Déploiement frontend | **Vercel** |
| Déploiement backend | **Railway** |

---

## Architecture

```
gestion-formations/
├── backend/          ← Express API (→ Railway)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── index.js
│       ├── lib/prisma.js
│       ├── middleware/auth.js
│       └── routes/
│           ├── auth.js
│           ├── formations.js
│           ├── inscriptions.js
│           ├── paiements.js
│           ├── presences.js
│           ├── attestations.js
│           ├── domaines.js
│           ├── users.js
│           └── stats.js
└── frontend/         ← Next.js (→ Vercel)
    └── src/app/
        ├── (admin)/admin/...
        ├── (formateur)/formateur/...
        ├── (participant)/participant/...
        └── (auth)/login, register/...
```

---

## 🚀 Déploiement Railway (Backend)

### Étape 1 — Créer le projet Railway

1. Va sur [railway.app](https://railway.app) → **New Project**
2. Clique **Deploy from GitHub repo** → sélectionne ton dépôt
3. Choisis le dossier `/backend` comme **Root Directory**

### Étape 2 — Ajouter PostgreSQL

1. Dans ton projet Railway → **+ New** → **Database** → **Add PostgreSQL**
2. Railway injecte automatiquement `DATABASE_URL` dans ton service

### Étape 3 — Variables d'environnement (Railway)

Dans ton service backend → **Variables** → ajouter :

```
JWT_SECRET=une-clé-secrète-très-longue-min-32-chars
FRONTEND_URL=https://ton-app.vercel.app
NODE_ENV=production
```

> ⚠️ `DATABASE_URL` est automatiquement injectée par Railway — ne l'ajoute pas manuellement.

### Étape 4 — Pre-deploy command (migrations auto)

Dans Railway → Settings → **Deploy** → **Pre-deploy command** :
```
npx prisma migrate deploy
```

> C'est la clé pour éviter le problème "prisma db push sans terminal" que tu avais !
> Les migrations tournent AVANT le démarrage du serveur à chaque déploiement.

### Étape 5 — Seed initial (une seule fois)

Dans Railway → ton service → **Shell** (ou via Railway CLI) :
```bash
node prisma/seed.js
```

Comptes créés :
- Admin : `admin@secel.cm` / `Admin@2025`
- Formateur : `formateur@secel.cm` / `Formateur@2025`

---

## 🚀 Déploiement Vercel (Frontend)

### Étape 1

1. Va sur [vercel.com](https://vercel.com) → **New Project**
2. Importe ton dépôt GitHub
3. **Root Directory** → `frontend`
4. Framework preset → **Next.js** (auto-détecté)

### Étape 2 — Variables d'environnement (Vercel)

Dans Vercel → Settings → **Environment Variables** :

```
NEXT_PUBLIC_API_URL=https://ton-backend.up.railway.app
```

> Remplace par l'URL réelle de ton service Railway (visible dans Railway → Settings → Domains)

### Étape 3 — Deploy

Clique **Deploy** → c'est tout !

---

## 💻 Développement local

### Backend

```bash
cd backend
cp .env.example .env
# Remplis DATABASE_URL avec ta base locale ou une Railway dev DB

npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run dev
# → http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001

npm install
npm run dev
# → http://localhost:3000
```

---

## 👥 Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| **ADMIN** | `/admin/*` — Tout gérer (formations, inscriptions, paiements, attestations, utilisateurs) |
| **FORMATEUR** | `/formateur/*` — Ses formations, prise de présences |
| **PARTICIPANT** | `/participant/*` — Catalogue, inscription, mes formations, attestations |

---

## 🔌 API Endpoints

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
PATCH  /api/auth/change-password

GET    /api/formations
GET    /api/formations/:id
POST   /api/formations          (ADMIN)
PUT    /api/formations/:id      (ADMIN)
DELETE /api/formations/:id      (ADMIN)

GET    /api/domaines
POST   /api/domaines            (ADMIN)
PUT    /api/domaines/:id        (ADMIN)
DELETE /api/domaines/:id        (ADMIN)

GET    /api/inscriptions
POST   /api/inscriptions        (PARTICIPANT)
PATCH  /api/inscriptions/:id/status  (ADMIN)

GET    /api/paiements           (ADMIN)
POST   /api/paiements           (ADMIN)

POST   /api/presences/bulk      (FORMATEUR, ADMIN)
GET    /api/presences/formation/:id

POST   /api/attestations        (ADMIN)
GET    /api/attestations/me     (PARTICIPANT)
GET    /api/attestations/verify/:code  (public)

GET    /api/users               (ADMIN)
POST   /api/users/formateurs    (ADMIN)
PATCH  /api/users/:id/toggle    (ADMIN)
PATCH  /api/users/me

GET    /api/stats/dashboard     (ADMIN)
GET    /api/stats/formateur     (FORMATEUR)

GET    /health
```

---

## ✅ Fonctionnalités implémentées

- [x] Auth JWT (login / register / rôles)
- [x] Gestion des domaines de formation
- [x] Gestion des formations (CRUD complet)
- [x] Catalogue public des formations
- [x] Inscriptions avec validation admin
- [x] Suivi des paiements
- [x] Prise de présences (formateur)
- [x] Génération d'attestations avec code de vérification unique
- [x] Page de vérification publique d'attestation (`/verify/[code]`)
- [x] Dashboard admin avec statistiques et graphiques
- [x] Dashboard formateur
- [x] Gestion des utilisateurs (activation/désactivation)
- [x] Déploiement Railway propre (railway.json + pre-deploy migrations)
- [x] Interface responsive (mobile + desktop)
