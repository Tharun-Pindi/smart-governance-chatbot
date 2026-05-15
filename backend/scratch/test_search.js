const supabase = require('../services/supabaseService');

async function testSearch(input) {
    const text = input.trim(); // Simulating bot's cleaned input
    console.log(`\n🔍 Searching for: "${text}"`);
    
    const { data: complaint, error } = await supabase
        .from('complaints')
        .select('tracking_id, status')
        .or(`tracking_id.ilike.%${text}%,tracking_id.eq.${text}`)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !complaint || complaint.length === 0) {
        console.log(`❌ RESULT: Not Found`);
    } else {
        console.log(`✅ RESULT: Found! -> ${complaint[0].tracking_id} (Status: ${complaint[0].status})`);
    }
}

async function runTests() {
    // Test 1: Exact full ID
    await testSearch('SG-GEN-SAN-W5-S-9443');
    // Test 2: Partial ID (just the number)
    await testSearch('9443');
    // Test 3: Lowercase partial
    await testSearch('san-w5-s-9443');
    
    process.exit(0);
}

runTests();
