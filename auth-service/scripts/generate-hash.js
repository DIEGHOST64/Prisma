// filepath: scripts/generate-hash.js
// Script para generar hash de contraseña

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'SuperAdmin2025!@#';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('\n====================================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('====================================\n');
  console.log('Copia este hash en el schema.sql');
  console.log('====================================\n');
});
