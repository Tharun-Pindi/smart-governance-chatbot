const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkComplaintsWard() {
    console.log('Checking complaints "ward" column...');
    const { data, error } = await supabase.from('complaints').select('id, address, ward');
    
    if (error) {
        console.error('Error:', error.message);
        return;
    }
    
    const missingWard = data.filter(c => !c.ward);
    console.log(`Total complaints: ${data.length}`);
    console.log(`Complaints missing ward: ${missingWard.length}`);
    
    if (missingWard.length > 0) {
        console.log('Sample missing ward address:', missingWard[0].address);
    }
}

checkComplaintsWard();
