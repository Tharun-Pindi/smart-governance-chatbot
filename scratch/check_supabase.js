const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('Fetching complaints from:', supabaseUrl);
  const { data, error } = await supabase
    .from('complaints')
    .select('*');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data found:', data);
    console.log('Count:', data.length);
  }
}

checkData();
