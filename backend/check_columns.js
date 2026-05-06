const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from('complaints')
    .select('*');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total Complaints:', data.length);
    if (data.length > 0) {
      console.log('Sample Data:', data[0]);
    }
  }
}

checkData();
