const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkWardNumberType() {
    console.log('Testing "ward_number" column type...');
    // Try to insert a string into ward_number
    const { error } = await supabase.from('admins').insert([{ name: 'Test', phone: '+1234567890', role: 'ward_admin', ward_number: '5' }]).select();
    if (error) {
        console.error('Error with string "5":', error.message);
    } else {
        console.log('Successfully inserted string "5"');
        // Clean up
        await supabase.from('admins').delete().eq('phone', '+1234567890');
    }

    // Try to insert an empty string
    const { error: error2 } = await supabase.from('admins').insert([{ name: 'Test2', phone: '+1234567891', role: 'ward_admin', ward_number: '' }]).select();
    if (error2) {
        console.error('Error with empty string "":', error2.message);
    } else {
        console.log('Successfully inserted empty string ""');
        // Clean up
        await supabase.from('admins').delete().eq('phone', '+1234567891');
    }
}

checkWardNumberType();
