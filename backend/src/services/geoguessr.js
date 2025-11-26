import axios from 'axios';

const GEOGUESSR_BASE_URL = 'https://www.geoguessr.com';
const cookie = process.env.GEOGUESSR_COOKIE;

/**
 * Fetches current rating and rank progress for a player
 * @param {string} userId - GeoGuessr user ID
 * @returns {Promise<Object>} - Rating data
 */
export async function fetchPlayerRating(userId) {
  try {
    const response = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v4/ranked-system/progress/${userId}`,
      {
        headers: {
          'Cookie': `_ncfa=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching rating for ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Fetches player's best rating ever
 * @param {string} userId - GeoGuessr user ID
 * @returns {Promise<Object>} - Best rating data
 */
export async function fetchPlayerBestRating(userId) {
  try {
    const response = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v4/ranked-system/best/${userId}`,
      {
        headers: {
          'Cookie': `_ncfa=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching best rating for ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Fetches public statistics for a player
 * @param {string} userId - GeoGuessr user ID
 * @returns {Promise<Object>} - User stats
 */
export async function fetchPlayerStats(userId) {
  try {
    const response = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v3/users/${userId}/stats`,
      {
        headers: {
          'Cookie': `_ncfa=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching stats for ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Searches for a player by username
 * @param {string} username - GeoGuessr username
 * @returns {Promise<Object>} - Search results
 */
export async function searchPlayer(username) {
  try {
    const response = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v3/search/user?query=${encodeURIComponent(username)}`,
      {
        headers: {
          'Cookie': `_ncfa=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error searching for ${username}:`, error.message);
    throw error;
  }
}
