const supabase = require('../services/supabaseService');

async function checkComplaints() {
    const { data, error } = await supabase
        .from('complaints')
        .select('id, citizen_id, status, title')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Last 5 complaints:');
    data.forEach(c => {
        console.log(`ID: ${c.id}, Status: ${c.status}, Citizen ID: ${c.citizen_id}, Title: ${c.title}`);
    });
}

checkComplaints();
