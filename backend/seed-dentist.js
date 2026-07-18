const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('./firebase-service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedDentist() {
  const dentistId = 'demo-dentist-id-123';
  
  const dentist = {
    name: 'Sarah Jenkins',
    email: 'dr.sarah@dentalgenie.com',
    role: 'dentist',
    isActive: true,
    isApproved: true,
    profile: {
      specialization: 'Orthodontics',
      bio: 'Over 10 years of experience in AI-assisted diagnosis.',
      avatarUrl: 'https://i.pravatar.cc/150?img=5'
    },
    createdAt: new Date().toISOString()
  };

  await db.collection('users').doc(dentistId).set(dentist);
  console.log('Successfully seeded dentist:', dentistId);
}

seedDentist().catch(console.error).finally(() => process.exit(0));
