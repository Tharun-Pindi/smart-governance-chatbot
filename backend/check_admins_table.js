const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkAdminsTable() {
    console.log('Checking "admins" table...');
    const { data, error } = await supabase.from('admins').select('*').limit(1);
    
    if (error) {
        console.error('Error fetching admins:', error.message);
    } else {
        console.log('Admins table exists. Sample data:', data);
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('Admins table is empty.');
        }
    }
}

checkAdminsTable();
