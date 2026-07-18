require('dotenv').config();
const { db } = require('./config/firebase');

async function fixDentists() {
  try {
    const snap = await db.collection('users').where('role', '==', 'dentist').get();
    let updated = 0;
    
    for (const doc of snap.docs) {
      const data = doc.data();
      // If profile is missing or specialization is missing
      if (!data.profile || !data.profile.specialization) {
        console.log(`Fixing dentist ${data.name || doc.id}...`);
        await doc.ref.update({
          'profile.specialization': 'Pediatric Dentistry', // Hardcode default for this fix since they mentioned pediadentrics
          'profile.licenseNumber': 'PENDING-FIX'
        });
        updated++;
      }
    }
    console.log(`Fixed ${updated} dentists.`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixDentists();
