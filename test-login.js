// Test admin login

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await fetch('http://localhost:3031/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Admin123!'
      })
    });    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const data = await response.text();
    console.log('Response body:', data);
    
    if (response.ok) {
      console.log('✅ Admin login successful!');
      const jsonData = JSON.parse(data);
      console.log('User info:', jsonData.user);
    } else {
      console.log('❌ Admin login failed');
      console.log('Error details:', data);
    }
    
  } catch (error) {
    console.error('Error testing login:', error.message);
  }
}

testAdminLogin();
