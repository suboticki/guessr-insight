import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEOGUESSR_BASE_URL = 'https://www.geoguessr.com';
const cookie = process.env.GEOGUESSR_COOKIE;

async function testCountryStats() {
  const testUserId = '5b51062a4010740f7cd91dd5'; // Blinky
  
  try {
    console.log('Testing /api/v3/users/${userId}/stats endpoint...\n');
    
    const response = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v3/users/${testUserId}/stats`,
      {
        headers: {
          'Cookie': `_ncfa=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    console.log('✅ Full Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check for country-related data
    if (response.data.countries) {
      console.log('\n📍 Countries Data Found:');
      console.log(JSON.stringify(response.data.countries, null, 2));
    }
    
    if (response.data.countryStats) {
      console.log('\n📍 Country Stats Found:');
      console.log(JSON.stringify(response.data.countryStats, null, 2));
    }
    
  } catch (err) {
    console.log(`❌ Error: ${err.response?.status || err.message}`);
    if (err.response?.data) {
      console.log('Response data:', err.response.data);
    }
  }
}

testCountryStats();
