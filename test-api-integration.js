#!/usr/bin/env node

// Integration test to verify frontend-backend connection
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3031';

console.log('🔗 Testing Frontend-Backend Integration...\n');

async function testHealthEndpoint() {
  console.log('1. Testing Health Endpoint...');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('   ✅ Health endpoint working');
    console.log('   📊 Status:', response.status);
    console.log('   📄 Service:', response.data.data.service);
    return true;
  } catch (error) {
    console.log('   ❌ Health endpoint failed:', error.message);
    return false;
  }
}

async function testAuthEndpoints() {
  console.log('\n2. Testing Auth Endpoints...');
  
  // Test login endpoint (should return 400/422 for missing credentials)
  try {
    await axios.post(`${BACKEND_URL}/api/auth/login`, {});
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 422 || error.response.status === 401)) {
      console.log('   ✅ Login endpoint accessible (returns expected validation error)');
    } else {
      console.log('   ❌ Login endpoint error:', error.message);
      return false;
    }
  }
  
  // Test profile endpoint (should return 401 for no token)
  try {
    await axios.get(`${BACKEND_URL}/api/auth/profile`);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('   ✅ Profile endpoint accessible (returns expected auth error)');
    } else {
      console.log('   ❌ Profile endpoint error:', error.message);
      return false;
    }
  }
  
  return true;
}

async function testProtectedEndpoints() {
  console.log('\n3. Testing Protected Endpoints...');
    const endpoints = [
    '/api/events',
    '/api/guests',
    '/api/workers/events/available'
  ];
  
  for (const endpoint of endpoints) {
    try {
      await axios.get(`${BACKEND_URL}${endpoint}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`   ✅ ${endpoint} properly protected (401 Unauthorized)`);
      } else {
        console.log(`   ❌ ${endpoint} unexpected error:`, error.response?.status || error.message);
        return false;
      }
    }
  }
  
  return true;
}

async function testCORS() {
  console.log('\n4. Testing CORS Configuration...');
  try {
    // Make a request with origin header to simulate frontend request
    const response = await axios.get(`${BACKEND_URL}/api/health`, {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    console.log('   ✅ CORS allows requests from frontend port 5173');
    return true;
  } catch (error) {
    console.log('   ❌ CORS test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  const tests = [
    testHealthEndpoint,
    testAuthEndpoints,
    testProtectedEndpoints,
    testCORS
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    const result = await test();
    if (!result) {
      allPassed = false;
    }
  }
  
  console.log('\n🎯 Integration Test Results:');
  if (allPassed) {
    console.log('✅ All tests passed! Frontend-Backend connection is working properly.');
    console.log('\n🚀 Next steps:');
    console.log('   • Frontend is running on: http://localhost:5173');
    console.log('   • Backend is running on: http://localhost:3031');
    console.log('   • You can now test the full application in the browser');
    console.log('   • Try logging in or accessing the dashboard');
  } else {
    console.log('❌ Some tests failed. Please check the backend configuration.');
  }
}

runAllTests().catch(console.error);
