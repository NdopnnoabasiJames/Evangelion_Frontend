// Debug utility to check and clear authentication state
export const authDebug = {
  checkState: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    let parsedUser = null;
    let userParseError = null;
    
    // Try to parse user data
    if (user) {
      try {
        parsedUser = JSON.parse(user);
      } catch (error) {
        userParseError = error.message;
        console.error('Error parsing user data from localStorage:', error);
      }
    }
    
    return {
      hasToken: !!token,
      hasUser: !!user,
      token,
      user: parsedUser,
      userParseError
    };
  },
  
  clearAll: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  
  setTestData: () => {
    const testUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const testToken = 'test-token-123';
    
    localStorage.setItem('authToken', testToken);
    localStorage.setItem('user', JSON.stringify(testUser));
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.authDebug = authDebug;
}

export default authDebug;
