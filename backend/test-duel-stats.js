import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEOGUESSR_BASE_URL = 'https://www.geoguessr.com';
const cookie = process.env.GEOGUESSR_COOKIE;

async function testStatsEndpoints() {
  const testUserId = '5b51062a4010740f7cd91dd5'; // Blinky
  
  const endpoints = [
    `/api/v3/users/${testUserId}/stats`,
    `/api/v4/ranked-system/progress/${testUserId}`,
    `/api/v3/profiles/duels/${testUserId}`,
    `/api/v4/duels/stats/${testUserId}`,
    `/api/v3/profiles/${testUserId}/competitive`,
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Testing: ${endpoint}`);
      console.log('='.repeat(80));
      
      const response = await axios.get(
        `${GEOGUESSR_BASE_URL}${endpoint}`,
        {
          headers: {
            'Cookie': `_ncfa=${cookie}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );
      
      console.log('✅ Response:');
      console.log(JSON.stringify(response.data, null, 2));
      
    } catch (err) {
      console.log(`❌ Failed: ${err.response?.status || err.message}`);
    }
  }
}

testStatsEndpoints();
