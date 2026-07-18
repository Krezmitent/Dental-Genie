const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const indianDentists = [
  {
    _id: 'dr-rajesh-kumar',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@dentalgenie.com',
    role: 'dentist',
    isActive: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
    profile: {
      specialization: 'Orthodontics',
      department: 'Braces & Aligners',
      bio: 'Dr. Rajesh Kumar specializes in correcting misaligned teeth and jaws. With over 15 years of experience, he has successfully transformed thousands of smiles using traditional braces and modern clear aligners.',
      education: 'MDS Orthodontics, AIIMS New Delhi',
      languages: 'English, Hindi',
      experience: '15 Years',
      avatarUrl: 'https://i.pravatar.cc/150?u=dr-rajesh-kumar'
    }
  },
  {
    _id: 'dr-priya-sharma',
    name: 'Priya Sharma',
    email: 'priya.sharma@dentalgenie.com',
    role: 'dentist',
    isActive: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
    profile: {
      specialization: 'Pediatric Dentistry',
      department: 'Children\'s Dentistry',
      bio: 'Dr. Priya Sharma is dedicated to the oral health of children from infancy through the teen years. She creates a welcoming, fear-free environment for young patients.',
      education: 'BDS, MDS Pedodontics, Manipal College of Dental Sciences',
      languages: 'English, Hindi, Kannada',
      experience: '8 Years',
      avatarUrl: 'https://i.pravatar.cc/150?u=dr-priya-sharma'
    }
  },
  {
    _id: 'dr-amit-patel',
    name: 'Amit Patel',
    email: 'amit.patel@dentalgenie.com',
    role: 'dentist',
    isActive: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
    profile: {
      specialization: 'Oral and Maxillofacial Surgery',
      department: 'Oral Surgery',
      bio: 'Dr. Amit Patel is an expert in complex extractions, including impacted wisdom teeth, and corrective jaw surgery. He employs the latest pain management techniques.',
      education: 'MDS Oral Surgery, Government Dental College, Ahmedabad',
      languages: 'English, Gujarati, Hindi',
      experience: '12 Years',
      avatarUrl: 'https://i.pravatar.cc/150?u=dr-amit-patel'
    }
  },
  {
    _id: 'dr-neha-gupta',
    name: 'Neha Gupta',
    email: 'neha.gupta@dentalgenie.com',
    role: 'dentist',
    isActive: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
    profile: {
      specialization: 'Endodontics',
      department: 'Root Canal Therapy',
      bio: 'Dr. Neha Gupta focuses on diagnosing tooth pain and performing root canal treatments to save diseased teeth. She is highly skilled in microscopic endodontics.',
      education: 'MDS Endodontics, Maulana Azad Institute of Dental Sciences',
      languages: 'English, Hindi, Punjabi',
      experience: '10 Years',
      avatarUrl: 'https://i.pravatar.cc/150?u=dr-neha-gupta'
    }
  },
  {
    _id: 'dr-vikram-singh',
    name: 'Vikram Singh',
    email: 'vikram.singh@dentalgenie.com',
    role: 'dentist',
    isActive: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
    profile: {
      specialization: 'Prosthodontics',
      department: 'Dental Implants & Prosthetics',
      bio: 'Dr. Vikram Singh is renowned for his expertise in restoring and replacing teeth with crowns, bridges, and implants, bringing back functionality and aesthetics to his patients.',
      education: 'MDS Prosthodontics, PGIMER Chandigarh',
      languages: 'English, Hindi',
      experience: '14 Years',
      avatarUrl: 'https://i.pravatar.cc/150?u=dr-vikram-singh'
    }
  },
  {
    _id: 'dr-sneha-reddy',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@dentalgenie.com',
    role: 'dentist',
    isActive: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
    profile: {
      specialization: 'Periodontics',
      department: 'Gum Disease & Treatment',
      bio: 'Dr. Sneha Reddy specializes in the prevention, diagnosis, and treatment of periodontal disease, and in the placement of dental implants.',
      education: 'BDS, MDS Periodontology, Saveetha Dental College, Chennai',
      languages: 'English, Telugu, Hindi',
      experience: '9 Years',
      avatarUrl: 'https://i.pravatar.cc/150?u=dr-sneha-reddy'
    }
  },
  {
    _id: 'dr-arjun-nair',
    name: 'Arjun Nair',
    email: 'arjun.nair@dentalgenie.com',
    role: 'dentist',
    isActive: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
    profile: {
      specialization: 'Cosmetic Dentistry',
      department: 'Aesthetic Dentistry',
      bio: 'Dr. Arjun Nair is passionate about smile design. He offers services like teeth whitening, veneers, and bonding to help patients achieve their dream smiles.',
      education: 'MDS Conservative Dentistry, Amrita School of Dentistry, Kochi',
      languages: 'English, Malayalam, Tamil',
      experience: '11 Years',
      avatarUrl: 'https://i.pravatar.cc/150?u=dr-arjun-nair'
    }
  },
  {
    _id: 'dr-kavita-desai',
    name: 'Kavita Desai',
    email: 'kavita.desai@dentalgenie.com',
    role: 'dentist',
    isActive: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
    profile: {
      specialization: 'General Dentistry',
      department: 'Comprehensive Care',
      bio: 'Dr. Kavita Desai provides comprehensive dental care including routine check-ups, cleanings, and preventative education for patients of all ages.',
      education: 'BDS, Nair Hospital Dental College, Mumbai',
      languages: 'English, Marathi, Hindi',
      experience: '7 Years',
      avatarUrl: 'https://i.pravatar.cc/150?u=dr-kavita-desai'
    }
  }
];

async function runSeeder() {
  try {
    console.log('Fetching existing dentists...');
    const snapshot = await db.collection('users').where('role', '==', 'dentist').get();
    
    console.log(`Found ${snapshot.docs.length} existing dentists. Deleting them...`);
    
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Commit the deletions
    if (snapshot.docs.length > 0) {
      await batch.commit();
      console.log('Deleted existing dentists.');
    }
    
    console.log('Inserting new Indian dentist profiles...');
    
    for (const dentist of indianDentists) {
      const docId = dentist._id;
      delete dentist._id;
      await db.collection('users').doc(docId).set(dentist);
      console.log(`Inserted: ${dentist.name}`);
    }
    
    console.log('Database successfully seeded with 8 dentists!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

runSeeder();
