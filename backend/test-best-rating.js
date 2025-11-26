import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEOGUESSR_BASE_URL = 'https://www.geoguessr.com';
const cookie = process.env.GEOGUESSR_COOKIE;

async function testBestRating() {
  try {
    // Test with multiple players
    const testPlayers = [
      { name: 'subi', id: '5e22e470e9473f68e8fdbd33' },
      { name: 'blinky', id: '5b51062a4010740f7cd91dd5' }
    ];
    
    for (const player of testPlayers) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Testing player: ${player.name} (${player.id})`);
      console.log('='.repeat(80));
      
      // Try different endpoints
      const endpoints = [
        `/api/v4/ranked-system/best/${player.id}`,
        `/api/v4/ranked-system/progress/${player.id}`,
        `/api/v3/users/${player.id}`,
        `/api/v3/users/${player.id}/stats`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`\n📍 Trying: ${endpoint}`);
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
          
          // Look for rating-related fields
          const dataStr = JSON.stringify(response.data);
          if (dataStr.includes('rating') || dataStr.includes('Rating') || dataStr.includes('best') || dataStr.includes('Best')) {
            console.log('\n🎯 Found rating/best related fields!');
          }
          
        } catch (err) {
          console.log(`❌ Failed: ${err.response?.status || err.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBestRating();
