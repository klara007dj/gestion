const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin par défaut
  const hashedPassword = await bcrypt.hash('Admin@2025', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@secel.cm' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'SECEL',
      email: 'admin@secel.cm',
      password: hashedPassword,
      phone: '+237699000000',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin créé:', adminUser.email);

  // Domaines de formation
  const domaines = [
    { nom: 'Développement Web', description: 'HTML, CSS, JavaScript, React, Node.js...' },
    { nom: 'Cybersécurité', description: 'Sécurité réseau, ethical hacking, SIEM...' },
    { nom: 'Data Science', description: 'Python, R, Machine Learning, Power BI...' },
    { nom: 'Intelligence Artificielle', description: 'Deep Learning, NLP, Vision par ordinateur...' },
    { nom: 'Réseaux Informatiques', description: 'Cisco, TCP/IP, administration réseau...' },
    { nom: 'Bureautique', description: 'Word, Excel, PowerPoint, Access...' },
    { nom: 'Infographie', description: 'Photoshop, Illustrator, InDesign...' },
    { nom: 'Développement Mobile', description: 'Flutter, React Native, Android...' },
    { nom: 'Maintenance Informatique', description: 'Hardware, Windows, Linux, dépannage...' },
  ];

  for (const d of domaines) {
    await prisma.domaine.upsert({
      where: { nom: d.nom },
      update: {},
      create: d,
    });
  }
  console.log(`✅ ${domaines.length} domaines créés`);

  // Formateur exemple
  const formateurPassword = await bcrypt.hash('Formateur@2025', 12);
  const formateurUser = await prisma.user.upsert({
    where: { email: 'formateur@secel.cm' },
    update: {},
    create: {
      firstName: 'Jean',
      lastName: 'DIFFO',
      email: 'formateur@secel.cm',
      password: formateurPassword,
      phone: '+237677000000',
      role: 'FORMATEUR',
      formateur: {
        create: {
          specialite: 'Développement Web',
          bio: 'Formateur certifié avec 5 ans d\'expérience',
        },
      },
    },
  });
  console.log('✅ Formateur créé:', formateurUser.email);

  console.log('🎉 Seed terminé !');
  console.log('\n📋 Comptes de test:');
  console.log('  Admin:     admin@secel.cm     / Admin@2025');
  console.log('  Formateur: formateur@secel.cm / Formateur@2025');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
