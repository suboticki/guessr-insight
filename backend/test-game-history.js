import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEOGUESSR_BASE_URL = 'https://www.geoguessr.com';
const cookie = process.env.GEOGUESSR_COOKIE;

async function testGameHistory() {
  const testUserId = '5b51062a4010740f7cd91dd5'; // Blinky
  
  try {
    console.log('🔍 Fetching game history...\n');
    
    const response = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v4/game-history/${testUserId}?gameMode=Duels`,
      {
        headers: {
          'Cookie': `_ncfa=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    console.log('✅ Response structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if we can calculate stats
    if (response.data && Array.isArray(response.data)) {
      console.log(`\n📊 Total games in response: ${response.data.length}`);
      
      // Sample first game
      if (response.data.length > 0) {
        console.log('\n🎮 Sample game structure:');
        console.log(JSON.stringify(response.data[0], null, 2));
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err.response?.status || err.message);
    if (err.response?.data) {
      console.error('Response:', err.response.data);
    }
  }
}

testGameHistory();
