const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findId() {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .ilike('id', '5fcc7556%');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Matches Found:', data.length);
    if (data.length > 0) {
      data.forEach(d => console.log('Found:', d.id));
    }
  }
}

findId();
