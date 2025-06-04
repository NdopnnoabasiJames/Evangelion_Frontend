#!/usr/bin/env node

// Simple script to test backend connection
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3031';

console.log('🔍 Testing connection to backend at:', BACKEND_URL);

async function testConnection() {
  try {
    // Test basic connection
    const response = await axios.get(`${BACKEND_URL}/api/health`, {
      timeout: 5000
    });
    
    console.log('✅ Backend is reachable!');
    console.log('📊 Response status:', response.status);
    console.log('📄 Response data:', response.data);
    
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - Backend is not running on port 3031');
    } else if (error.code === 'ENOTFOUND') {
      console.log('❌ Host not found - Check if localhost is accessible');
    } else if (error.response) {
      console.log('⚠️ Backend responded with error:', error.response.status);
      console.log('📄 Error data:', error.response.data);
    } else {
      console.log('❌ Connection error:', error.message);
    }
    
    return false;
  }
}

async function testAPI() {
  console.log('\n🧪 Testing API endpoints...');
  
  const endpoints = [
    '/auth/profile',
    '/api/events',
    '/api/guests'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
        timeout: 3000
      });
      console.log(`✅ ${endpoint}: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`⚠️ ${endpoint}: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }
}

// Run tests
(async () => {
  const isConnected = await testConnection();
  
  if (isConnected) {
    await testAPI();
  }
  
  console.log('\n🏁 Connection test completed!');
  console.log('💡 If backend is not running, start it first, then run: npm run dev');
})();
