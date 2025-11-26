import axios from 'axios';

const GEOGUESSR_BASE_URL = 'https://www.geoguessr.com';
const cookie = process.env.GEOGUESSR_COOKIE;

/**
 * Formats division name to proper display format
 * @param {string} division - Division string (e.g., 'master_ii', 'gold_iii')
 * @returns {string} - Formatted division (e.g., 'Master 2', 'Gold 3')
 */
export function formatDivision(division) {
  if (!division) return 'Unranked';
  
  // Split by underscore and capitalize
  const parts = division.toLowerCase().split('_');
  
  // Capitalize first part
  const rank = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  
  // Convert roman numerals to arabic numbers
  const romanToArabic = {
    'i': '1',
    'ii': '2',
    'iii': '3',
    'iv': '4',
    'v': '5'
  };
  
  const tier = parts[1] ? romanToArabic[parts[1]] || parts[1] : '';
  
  return tier ? `${rank} ${tier}` : rank;
}

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
    
    console.log(`📊 Rating data for ${userId}:`, JSON.stringify(response.data, null, 2));
    
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
    
    console.log(`🏆 Best rating data for ${userId}:`, JSON.stringify(response.data, null, 2));
    
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
 * Fetches player's profile information including account creation date
 * @param {string} userId - GeoGuessr user ID
 * @returns {Promise<Object>} - User profile data
 */
export async function fetchPlayerProfile(userId) {
  try {
    const response = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v3/users/${userId}`,
      {
        headers: {
          'Cookie': `_ncfa=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    console.log(`👤 Profile data for ${userId}:`, JSON.stringify(response.data, null, 2));
    
    // Include avatar URL in the response
    const profileData = response.data;
    
    // Use pin.url - this is the actual avatar image
    if (profileData.pin?.url) {
      profileData.avatarUrl = `https://www.geoguessr.com/images/resize:auto:192:192/gravity:ce/plain/${profileData.pin.url}`;
    } else if (profileData.flair && profileData.flair.avatar) {
      profileData.avatarUrl = profileData.flair.avatar.background;
    }
    
    // Include country code if available
    if (profileData.countryCode) {
      profileData.countryCode = profileData.countryCode.toLowerCase();
    }
    
    return profileData;
  } catch (error) {
    console.error(`❌ Error fetching profile for ${userId}:`, error.message);
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

/**
 * Fetches player's game history for duels
 * @param {string} userId - GeoGuessr user ID
 * @returns {Promise<Object>} - Game history with calculated stats
 */
export async function fetchGameHistory(userId) {
  try {
    const response = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v4/game-history/${userId}?gameMode=Duels`,
      {
        headers: {
          'Cookie': `_ncfa=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    const games = response.data.entries || [];
    
    // Calculate statistics from last 20 games
    let wins = 0;
    let losses = 0;
    let maxRating = 0;
    let standardDuelsCount = 0;
    let noMoveDuelsCount = 0;
    let nmpzDuelsCount = 0;
    let currentRating = 0;
    let ratingSevenDaysAgo = null;
    
    // Get current time and 7 days ago
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    games.forEach(game => {
      const gameTime = new Date(game.duel.rounds[0].startTime);
      
      // Count wins/losses
      if (game.duel.winnerId === userId) {
        wins++;
      } else {
        losses++;
      }
      
      // Find player's rating in this game
      game.duel.teams.forEach(team => {
        team.players.forEach(player => {
          if (player.playerId === userId) {
            const rating = player.rankedSystemRating;
            maxRating = Math.max(maxRating, rating);
            
            // Track current rating (most recent game)
            if (!currentRating) currentRating = rating;
            
            // Find rating closest to 7 days ago
            if (gameTime <= sevenDaysAgo) {
              if (ratingSevenDaysAgo === null || gameTime > new Date(ratingSevenDaysAgo.time)) {
                ratingSevenDaysAgo = { rating, time: gameTime };
              }
            }
          }
        });
      });
      
      // Count games by mode
      const mode = game.duel.gameMode;
      if (mode === 'StandardDuels') standardDuelsCount++;
      else if (mode === 'NoMoveDuels') noMoveDuelsCount++;
      else if (mode === 'NmpzDuels') nmpzDuelsCount++;
    });
    
    // Calculate 7-day change if we have data
    const sevenDayChange = ratingSevenDaysAgo ? currentRating - ratingSevenDaysAgo.rating : null;
    
    return {
      totalGames: games.length,
      wins,
      losses,
      winRate: games.length > 0 ? (wins / games.length) : 0,
      maxRating,
      currentRating,
      sevenDayChange,
      gamesByMode: {
        standardDuels: standardDuelsCount,
        noMoveDuels: noMoveDuelsCount,
        nmpzDuels: nmpzDuelsCount
      },
      recentGames: games.slice(0, 10) // Most recent 10 for display
    };
  } catch (error) {
    console.error(`❌ Error fetching game history for ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Fetches global leaderboard
 * @param {number} page - Page number (0-indexed, each page has 25 players)
 * @returns {Promise<Array>} - Leaderboard data
 */
export async function fetchLeaderboard(page = 0) {
  try {
    // Try different possible endpoints
    const endpoints = [
      `/api/v3/leaderboard?page=${page}&count=25`,
      `/api/v4/leaderboards/competitive?page=${page}&count=25`,
      `/api/v3/leaderboards/competitive?page=${page}`,
      `/api/v4/ranked-system/leaderboard?page=${page}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(
          `${GEOGUESSR_BASE_URL}${endpoint}`,
          {
            headers: {
              'Cookie': `_ncfa=${cookie}`,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        );
        
        console.log(`✅ Found working endpoint: ${endpoint}`);
        console.log(`📊 Response structure:`, JSON.stringify(response.data, null, 2));
        
        // Return the data (structure varies by endpoint)
        return response.data.items || response.data.users || response.data;
      } catch (err) {
        console.log(`❌ Endpoint ${endpoint} failed: ${err.response?.status}`);
        continue;
      }
    }
    
    throw new Error('All leaderboard endpoints failed');
    
  } catch (error) {
    console.error(`❌ Error fetching leaderboard:`, error.message);
    throw error;
  }
}
