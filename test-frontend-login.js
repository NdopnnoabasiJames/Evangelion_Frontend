// Test frontend login specifically
// This will help us see what exact error the frontend is getting

async function testFrontendLogin() {
  try {
    console.log('Testing frontend API call...');
    
    // Simulate the exact same call the frontend makes
    const response = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Admin123!'
      })
    });

    console.log('Frontend API Response status:', response.status);
    console.log('Frontend API Response status text:', response.statusText);
    
    const data = await response.text();
    console.log('Frontend API Response body:', data);
    
  } catch (error) {
    console.error('Frontend API Error:', error.message);
  }
}

testFrontendLogin();
