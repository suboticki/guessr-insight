import express from 'express';
import { supabase } from '../config/supabase.js';
import { searchPlayer, fetchPlayerRating, fetchPlayerStats } from '../services/geoguessr.js';

const router = express.Router();

/**
 * GET /api/players
 * Returns all tracked players
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('is_tracked', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, players: data });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/players
 * Adds a new player to track
 * Body: { username: "string" }
 */
router.post('/', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    
    // Search for player on GeoGuessr
    const searchResults = await searchPlayer(username);
    
    if (!searchResults || searchResults.length === 0) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    const player = searchResults[0];
    
    // Check if player already exists in database
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('geoguessr_user_id', player.id)
      .single();
    
    if (existing) {
      return res.status(400).json({ success: false, error: 'Player already added' });
    }
    
    // Fetch current rating
    const ratingData = await fetchPlayerRating(player.id);
    
    // Save player
    const { data: newPlayer, error } = await supabase
      .from('players')
      .insert({
        geoguessr_user_id: player.id,
        username: player.nick || username,
        is_tracked: true,
        current_rating: ratingData.rating || 0,
        division: ratingData.division || 'unranked'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Save first rating entry
    await supabase
      .from('rating_history')
      .insert({
        player_id: newPlayer.id,
        rating: ratingData.rating || 0,
        division: ratingData.division || 'unranked',
        recorded_at: new Date().toISOString()
      });
    
    res.json({ success: true, player: newPlayer });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/players/:id/history
 * Returns rating history for a player
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('rating_history')
      .select('*')
      .eq('player_id', id)
      .order('recorded_at', { ascending: true });
    
    if (error) throw error;
    
    res.json({ success: true, history: data });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/players/:id
 * Removes player from tracking
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('players')
      .update({ is_tracked: false })
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Player removed from tracking' });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
