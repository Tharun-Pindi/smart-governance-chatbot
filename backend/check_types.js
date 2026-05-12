const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkColumnTypes() {
    console.log('Checking "admins" table column types...');
    // We can't directly get column types easily without RPC, but we can try to insert a dummy row.
    // Or we can use the information schema if we have a way to run raw SQL.
    // Since we don't have a raw SQL tool, let's try to infer from a sample.
    const { data, error } = await supabase.from('admins').select('*').limit(1);
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Sample row:', data[0]);
    }
}

checkColumnTypes();
