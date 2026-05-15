const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing /api/auth/send-otp...');
        const res = await axios.post('http://localhost:5001/api/auth/send-otp', {
            phone: '+918309741822',
            name: 'Tharun Pindi'
        });
        console.log('Response:', res.data);
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
}

testLogin();
