const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function addWardColumn() {
    console.log('Attempting to add "ward" column to complaints table...');
    
    // We use rpc if we have a function to run sql, or we just try to insert a dummy row with ward to see if it works.
    // However, the best way is to try a select on 'ward'
    const { data, error } = await supabase.from('complaints').select('ward').limit(1);
    
    if (error && error.message.includes('column "ward" does not exist')) {
        console.log('Column "ward" does not exist. Please add it in Supabase Dashboard:');
        console.log('ALTER TABLE complaints ADD COLUMN ward TEXT;');
    } else if (error) {
        console.error('Error checking column:', error.message);
    } else {
        console.log('Column "ward" already exists!');
    }
}

addWardColumn();
