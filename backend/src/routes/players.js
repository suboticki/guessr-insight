import express from 'express';
import { supabase } from '../config/supabase.js';
import { searchPlayer, fetchPlayerRating, fetchPlayerProfile, fetchPlayerStats, fetchGameHistory, formatDivision } from '../services/geoguessr.js';
import { scrapeBestRating } from '../../scrape-best-rating.js';

const router = express.Router();

/**
 * GET /api/players
 * Returns all tracked players
 */
router.get('/', async (req, res) => {
  try {
    // Fetch ALL players - Supabase default limit is 1000, we need to override
    const { count } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total players in database: ${count}`);
    
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(count || 100000); // Set limit to total count
    
    if (error) throw error;
    
    console.log(`📊 Fetched ${data?.length || 0} players from database`);
    
    // Add formatted division to each player
    const playersWithFormatted = (data || []).map(player => ({
      ...player,
      formattedDivision: formatDivision(player.division)
    }));
    
    res.json({ success: true, players: playersWithFormatted });
  } catch (error) {
    console.error('❌ Error fetching players:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/players/search
 * Searches for players by username via GeoGuessr API
 * Body: { username: "string" }
 */
router.post('/search', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    
    console.log(`🔍 Searching GeoGuessr for: ${username}`);
    
    // Search for players on GeoGuessr API
    let searchResults;
    try {
      searchResults = await searchPlayer(username);
      console.log(`📊 GeoGuessr raw response:`, JSON.stringify(searchResults, null, 2));
    } catch (searchError) {
      console.error(`❌ Search API error:`, searchError.message);
      return res.status(404).json({ success: false, error: 'Player not found on GeoGuessr' });
    }
    
    // Handle different response structures
    let players = [];
    if (Array.isArray(searchResults)) {
      console.log('✅ Response is array');
      players = searchResults;
    } else if (searchResults && searchResults.items) {
      console.log('✅ Response has items property');
      players = searchResults.items;
    } else if (searchResults && searchResults.users) {
      console.log('✅ Response has users property');
      players = searchResults.users;
    } else if (searchResults && typeof searchResults === 'object') {
      console.log('⚠️ Response is object, checking all keys:', Object.keys(searchResults));
    }
    
    console.log(`📊 Extracted ${players?.length || 0} players from response`);
    
    if (!players || players.length === 0) {
      return res.status(404).json({ success: false, error: 'Player not found on GeoGuessr' });
    }
    
    // Filter to only exact matches (case-insensitive)
    const exactMatches = players.filter(p => {
      const playerName = (p.name || p.nick || '').toLowerCase();
      return playerName === username.toLowerCase();
    });
    
    console.log(`📊 Exact matches: ${exactMatches.length} out of ${players.length} results`);
    
    if (exactMatches.length === 0) {
      return res.status(404).json({ success: false, error: 'Player not found on GeoGuessr' });
    }
    
    // Check which players are already in database
    const playerIds = exactMatches.map(p => p.id).filter(Boolean);
    const { data: existingPlayers } = await supabase
      .from('players')
      .select('*')
      .in('geoguessr_user_id', playerIds);
    
    const existingMap = new Map(existingPlayers?.map(p => [p.geoguessr_user_id, p]) || []);
    
    // Enrich search results with tracking status and DB data
    let enrichedResults = exactMatches.filter(p => p.id && (p.name || p.nick)).map(player => {
      let avatarUrl = null;
      if (player.imageUrl) {
        // imageUrl is already in format "pin/hash.png" - use it directly
        avatarUrl = `https://www.geoguessr.com/images/resize:auto:192:192/gravity:ce/plain/${player.imageUrl}`;
      }
      
      const dbPlayer = existingMap.get(player.id);
      
      return {
        geoguessrId: player.id,
        username: player.name || player.nick,
        countryCode: player.countryCode || null,
        xp: player.xp || 0,
        accountCreated: player.created || player.createdAt || null,
        avatarUrl: avatarUrl,
        isTracked: existingMap.has(player.id),
        dbPlayer: dbPlayer ? {
          ...dbPlayer,
          formattedDivision: formatDivision(dbPlayer.division)
        } : null
      };
    });
    
    // Sort by rating (from dbPlayer) if tracked, otherwise by XP
    enrichedResults.sort((a, b) => {
      const aRating = a.dbPlayer?.current_rating || 0;
      const bRating = b.dbPlayer?.current_rating || 0;
      if (aRating !== bRating) return bRating - aRating; // Higher rating first
      return b.xp - a.xp; // Then by XP
    });
    
    console.log(`✅ Found ${enrichedResults.length} valid players with exact name match`);
    
    res.json({ 
      success: true, 
      players: enrichedResults,
      count: enrichedResults.length
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/players/add
 * Adds a specific player to tracking by their GeoGuessr ID
 * Body: { geoguessrId: "string", username: "string" }
 */
router.post('/add', async (req, res) => {
  try {
    const { geoguessrId, username } = req.body;
    
    if (!geoguessrId || !username) {
      return res.status(400).json({ success: false, error: 'GeoGuessr ID and username are required' });
    }
    
    // Check if player already tracked
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('geoguessr_user_id', geoguessrId)
      .single();
    
    if (existingPlayer) {
      return res.json({ 
        success: true, 
        player: {
          ...existingPlayer,
          formattedDivision: formatDivision(existingPlayer.division)
        },
        alreadyTracked: true 
      });
    }
    
    // Fetch rating data with fallback
    let rating = 0;
    let division = 'unranked';
    
    try {
      const ratingData = await fetchPlayerRating(geoguessrId);
      rating = ratingData.rating || ratingData.divisionNumber || 0;
      division = ratingData.divisionName || ratingData.tier || 'unranked';
    } catch (ratingError) {
      console.warn(`⚠️ Could not fetch rating for ${geoguessrId}, using defaults:`, ratingError.message);
      // Continue with default values
    }
    
    // Add player to database
    const { data: newPlayer, error } = await supabase
      .from('players')
      .insert({
        geoguessr_user_id: geoguessrId,
        username: username,
        is_tracked: true,
        current_rating: rating,
        division: division.toLowerCase()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Save first rating entry
    await supabase
      .from('rating_history')
      .insert({
        player_id: newPlayer.id,
        rating: rating,
        division: division.toLowerCase(),
        recorded_at: new Date().toISOString()
      });
    
    res.json({ 
      success: true, 
      player: {
        ...newPlayer,
        formattedDivision: formatDivision(newPlayer.division)
      }, 
      alreadyTracked: false 
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/players/:id
 * Returns a single player by database ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Special case: if route is /history, skip this handler
    if (id === 'history') {
      return next();
    }
    
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    res.json({ success: true, player });
  } catch (error) {
    console.error('❌ Error fetching player:', error);
    res.status(404).json({ success: false, error: 'Player not found' });
  }
});

/**
 * GET /api/players/:id/history
 * Returns rating history for a player
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get player data
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();
    
    if (playerError) throw playerError;
    
    // Get rating history
    const { data, error } = await supabase
      .from('rating_history')
      .select('*')
      .eq('player_id', id)
      .order('recorded_at', { ascending: true });
    
    if (error) throw error;
    
    // Calculate peak rating from our tracking history
    // Note: GeoGuessr doesn't expose this via API, so this is the highest rating we've tracked
    const peakRating = data.length > 0 
      ? Math.max(...data.map(h => h.rating))
      : player.current_rating;
    
    // Fetch profile data and stats
    let accountCreated = null;
    let avatarUrl = null;
    let isVerified = false;
    let competitiveStats = null;
    let totalXP = 0;
    let level = 0;
    let bestEverRating = null;
    
    try {
      const profileData = await fetchPlayerProfile(player.geoguessr_user_id);
      accountCreated = profileData?.created || profileData?.createdAt || null;
      avatarUrl = profileData?.avatarUrl || null;
      isVerified = profileData?.isVerified || false;
      totalXP = profileData?.progress?.xp || 0;
      level = profileData?.progress?.level || 0;
      
      // Get competitive/duel stats
      if (profileData?.competitive) {
        competitiveStats = {
          rating: profileData.competitive.rating || player.current_rating,
          division: profileData.competitive.division?.type || null,
          onLeaderboard: profileData.competitive.onLeaderboard || false
        };
      }
      
      console.log('📊 Profile stats fetched:', { isVerified, totalXP, level, competitiveStats });
    } catch (err) {
      console.warn('⚠️ Could not fetch profile data:', err.message);
    }
    
    // TODO: Scrape best ever rating from profile page
    // Disabled for now because it's slow (20-30s per request)
    // We can enable this as an optional feature later
    /*
    try {
      console.log('🏆 Scraping best ever rating...');
      bestEverRating = await scrapeBestRating(player.geoguessr_user_id);
      console.log('✅ Best ever rating:', bestEverRating);
    } catch (err) {
      console.warn('⚠️ Could not scrape best rating:', err.message);
    }
    */
    
    // Fetch game history and calculate comprehensive statistics
    let playerStats = null;
    let gameHistory = null;
    
    try {
      // Get game history (last 20 games)
      gameHistory = await fetchGameHistory(player.geoguessr_user_id);
      
      // Get progress data for additional stats
      const progressData = await fetchPlayerRating(player.geoguessr_user_id);
      
      if (gameHistory) {
        playerStats = {
          // Stats from last 20 games
          totalGames: gameHistory.totalGames,
          wins: gameHistory.wins,
          losses: gameHistory.losses,
          winRate: (gameHistory.winRate * 100).toFixed(1),
          maxRating: gameHistory.maxRating,
          
          // Additional stats from progress endpoint
          guessedFirstRate: progressData?.guessedFirstRate 
            ? (progressData.guessedFirstRate * 100).toFixed(1)
            : 0,
          winStreak: progressData?.winStreak || 0,
          
          // Game mode breakdown
          gamesByMode: gameHistory.gamesByMode,
          gameModeRatings: progressData?.gameModeRatings || {}
        };
        
        // Use 7-day change from game history if available
        if (gameHistory.sevenDayChange !== null) {
          sevenDayChange = gameHistory.sevenDayChange;
        }
      }
      
      console.log('🎮 Game stats fetched:', playerStats);
    } catch (err) {
      console.warn('⚠️ Could not fetch game history:', err.message);
    }
    
    // Calculate 7-day change from our tracking history as fallback
    let sevenDayChange = null;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const oldEntries = data.filter(h => new Date(h.recorded_at) <= sevenDaysAgo);
    const recentEntries = data.filter(h => new Date(h.recorded_at) > sevenDaysAgo);
    
    if (oldEntries.length > 0 && recentEntries.length > 0) {
      const ratingSevenDaysAgo = oldEntries[oldEntries.length - 1].rating;
      const currentRating = data[data.length - 1].rating;
      sevenDayChange = currentRating - ratingSevenDaysAgo;
    }
    
    res.json({ 
      success: true, 
      history: data,
      stats: {
        peakRating,
        bestEverRating,
        sevenDayChange,
        accountCreated,
        avatarUrl,
        isVerified,
        totalXP,
        level,
        competitiveStats,
        playerStats,
        formattedDivision: formatDivision(player.division)
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
