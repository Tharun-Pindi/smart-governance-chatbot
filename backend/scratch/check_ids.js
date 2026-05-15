const supabase = require('../services/supabaseService');
async function checkIds() {
    const { data, error } = await supabase.from('complaints').select('tracking_id').limit(5);
    if (error) console.error("Error:", error);
    else console.log("Stored IDs:", data);
    process.exit();
}
checkIds();
