const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkComplaintsColumns() {
    console.log('Checking "complaints" table columns...');
    const { data, error } = await supabase.from('complaints').select('*').limit(1);
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        if (data.length > 0) {
            console.log('Existing columns:', Object.keys(data[0]));
        } else {
            console.log('Complaints table is empty.');
        }
    }
}

checkComplaintsColumns();
