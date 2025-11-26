import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEOGUESSR_BASE_URL = 'https://www.geoguessr.com';
const cookie = process.env.GEOGUESSR_COOKIE;

async function testAvatarFormats() {
  try {
    // First search for a player
    const searchUsername = 'subi'; // You can change this
    
    console.log('🔍 Searching for player:', searchUsername);
    console.log('=====================================\n');
    
    const searchResponse = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v3/search/user?query=${encodeURIComponent(searchUsername)}`,
      {
        headers: {
          'Cookie': `_ncfa=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    console.log('🔎 Search results:');
    console.log(JSON.stringify(searchResponse.data, null, 2));
    console.log('\n=====================================\n');
    
    if (!searchResponse.data || searchResponse.data.length === 0) {
      console.log('❌ No players found');
      return;
    }
    
    const testUserId = searchResponse.data[0].id;
    console.log('✅ Using player:', searchResponse.data[0].username, '(', testUserId, ')');
    console.log('=====================================\n');
    
    // Fetch profile data
    const profileResponse = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v3/users/${testUserId}`,
      {
        headers: {
          'Cookie': `_ncfa=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    const profile = profileResponse.data;
    
    console.log('📦 Full Profile Response:');
    console.log(JSON.stringify(profile, null, 2));
    console.log('\n=====================================\n');
    
    // Extract all possible avatar-related fields
    console.log('🖼️ Avatar-related fields found:');
    console.log('--------------------------------');
    
    if (profile.pin) {
      console.log('pin:', profile.pin);
    }
    
    if (profile.imageUrl) {
      console.log('imageUrl:', profile.imageUrl);
    }
    
    if (profile.borderUrl) {
      console.log('borderUrl:', profile.borderUrl);
    }
    
    if (profile.flair) {
      console.log('flair:', JSON.stringify(profile.flair, null, 2));
    }
    
    console.log('\n=====================================\n');
    
    // Try different URL constructions
    console.log('🔗 Testing different URL formats:');
    console.log('--------------------------------\n');
    
    // Format 1: pin.url (from profile)
    if (profile.pin?.url) {
      const url1 = `https://www.geoguessr.com/images/resize:auto:192:192/gravity:ce/plain/${profile.pin.url}`;
      console.log('Format 1 (pin.url):', url1);
    }
    
    // Format 2: fullBodyPin
    if (profile.fullBodyPin) {
      const url2 = `https://www.geoguessr.com/images/resize:auto:192:192/gravity:ce/plain/${profile.fullBodyPin}`;
      console.log('Format 2 (fullBodyPin):', url2);
    }
    
    // Format 3: avatar.fullBodyPath
    if (profile.avatar?.fullBodyPath) {
      const url3 = `https://www.geoguessr.com/images/resize:auto:192:192/gravity:ce/plain/${profile.avatar.fullBodyPath}`;
      console.log('Format 3 (avatar.fullBodyPath):', url3);
    }
    
    // Format 4: imageUrl from search (if exists)
    if (searchResponse.data[0]?.imageUrl) {
      const imageUrl = searchResponse.data[0].imageUrl;
      const url4 = `https://www.geoguessr.com/images/resize:auto:192:192/gravity:ce/plain/${imageUrl}`;
      console.log('Format 4 (search imageUrl):', url4);
    }
    
    // Format 5: borderUrl (for comparison - this is the border/rank, not avatar)
    if (profile.borderUrl) {
      const url5 = `https://www.geoguessr.com/images/resize:auto:192:192/gravity:ce/plain/${profile.borderUrl}`;
      console.log('Format 5 (borderUrl - rank border):', url5);
    }
    
    console.log('\n=====================================\n');
    console.log('🏆 Looking for highest rating data...');
    console.log('Check the full profile response above for any "best", "highest", "peak" or "max" rating fields');
    
    // Try to fetch best rating endpoint
    console.log('\n🔍 Trying best rating endpoint...\n');
    try {
      const bestRatingResponse = await axios.get(
        `${GEOGUESSR_BASE_URL}/api/v4/ranked-system/best/${testUserId}`,
        {
          headers: {
            'Cookie': `_ncfa=${cookie}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );
      
      console.log('📊 Best Rating API Response:');
      console.log(JSON.stringify(bestRatingResponse.data, null, 2));
    } catch (err) {
      console.log('❌ Best rating endpoint failed:', err.message);
    }
    
    console.log('\n✅ Test complete! Check the data above.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAvatarFormats();
