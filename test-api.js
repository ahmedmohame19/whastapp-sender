import axios from 'axios';

// Test API integration
const API_BASE_URL = process.env.MAIN_PROJECT_API_URL || 'http://localhost:3000/api';
const API_TOKEN = process.env.WHATSAPP_API_TOKEN || 'your-default-token';

async function testAPI() {
  console.log('Testing API integration...\n');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`
    }
  };

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`, config);
    console.log('✅ Health check passed:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  try {
    // Test 2: Find student by phone
    console.log('\n2. Testing find student by phone...');
    const studentResponse = await axios.get(`${API_BASE_URL}/students?mobileNo=+201001234567`, config);
    console.log('✅ Find student response:', studentResponse.data);
  } catch (error) {
    console.log('❌ Find student failed:', error.message);
  }

  try {
    // Test 3: Find student verification
    console.log('\n3. Testing find student verification...');
    const verificationResponse = await axios.get(`${API_BASE_URL}/student-verifications?studentId=1`, config);
    console.log('✅ Find verification response:', verificationResponse.data);
  } catch (error) {
    console.log('❌ Find verification failed:', error.message);
  }

  console.log('\nAPI test completed. Check the results above.');
}

testAPI().catch(console.error);
