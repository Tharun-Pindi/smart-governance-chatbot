require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Supabase initialization (Logged once on boot)


if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Database operations will fail.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
