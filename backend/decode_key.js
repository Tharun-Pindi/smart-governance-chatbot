const jwt = require('jsonwebtoken');
require('dotenv').config();

const key = process.env.SUPABASE_KEY;
if (key) {
    const decoded = jwt.decode(key);
    console.log('Decoded Supabase Key:', decoded);
} else {
    console.log('No SUPABASE_KEY found in .env');
}
