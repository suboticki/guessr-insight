import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEOGUESSR_BASE_URL = 'https://www.geoguessr.com';
const cookie = process.env.GEOGUESSR_COOKIE;

async function testProgress() {
  const testUserId = '5b51062a4010740f7cd91dd5'; // Blinky
  
  try {
    const response = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v4/ranked-system/progress/${testUserId}`,
      {
        headers: {
          'Cookie': `_ncfa=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    console.log('Full response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (err) {
    console.log(`❌ Error: ${err.response?.status || err.message}`);
  }
}

testProgress();
