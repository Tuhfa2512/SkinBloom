import fetch from 'node-fetch';

// Test the wishlist API endpoint
async function testWishlistAPI() {
  try {
    // First, let's test without authentication
    console.log('Testing wishlist endpoint without auth...');
    const response1 = await fetch('http://localhost:5000/api/wishlist');
    console.log('Status:', response1.status);
    const text1 = await response1.text();
    console.log('Response:', text1);
    
    console.log('\n=================\n');
    
    // Test with a dummy token
    console.log('Testing wishlist endpoint with dummy token...');
    const response2 = await fetch('http://localhost:5000/api/wishlist', {
      headers: {
        'Authorization': 'Bearer dummy-token'
      }
    });
    console.log('Status:', response2.status);
    const text2 = await response2.text();
    console.log('Response:', text2);
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testWishlistAPI();
