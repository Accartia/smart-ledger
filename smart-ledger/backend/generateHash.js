const bcrypt = require('bcryptjs');

// The password you want to hash
const password = 'admin123';

// Generate hash (10 is the salt rounds - higher = more secure but slower)
const hash = bcrypt.hashSync(password, 10);

console.log('=================================');
console.log('🔐 PASSWORD HASH GENERATOR');
console.log('=================================');
console.log('Original Password:', password);
console.log('Generated Hash:', hash);
console.log('=================================');
console.log('Copy this hash to your database!');
console.log('=================================');