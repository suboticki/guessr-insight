import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEOGUESSR_BASE_URL = 'https://www.geoguessr.com';
const cookie = process.env.GEOGUESSR_COOKIE;

async function testCountryStrengths() {
  const testUserId = '5b51062a4010740f7cd91dd5'; // Blinky
  
  const endpoints = [
    `/api/v3/profiles/${testUserId}`,
    `/api/v3/users/${testUserId}`,
    `/api/v4/ranked-system/progress/${testUserId}`,
    `/api/v3/social/profiles/${testUserId}`,
    `/api/v3/profiles/${testUserId}/competitive-statistics`,
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
      const data = response.data;
      
      // Check for country-related fields
      if (data.countryStrengths) {
        console.log('\n🌍 FOUND countryStrengths:');
        console.log(JSON.stringify(data.countryStrengths, null, 2));
      }
      
      if (data.strongestCountries) {
        console.log('\n💪 FOUND strongestCountries:');
        console.log(JSON.stringify(data.strongestCountries, null, 2));
      }
      
      if (data.weakestCountries) {
        console.log('\n😰 FOUND weakestCountries:');
        console.log(JSON.stringify(data.weakestCountries, null, 2));
      }
      
      if (data.competitive) {
        console.log('\n🏆 Competitive data:');
        console.log(JSON.stringify(data.competitive, null, 2));
      }
      
      // Show all keys to see what's available
      console.log('\n📋 Available keys:', Object.keys(data).join(', '));
      
    } catch (err) {
      console.log(`❌ Failed: ${err.response?.status || err.message}`);
    }
  }
}

testCountryStrengths();
