import { supabase } from './src/config/supabase.js';
import { fetchPlayerRating } from './src/services/geoguessr.js';
import dotenv from 'dotenv';

dotenv.config();

async function updateAllPlayers() {
  console.log('🔄 Updating all players with correct ratings...\n');
  
  try {
    // Get all players
    const { data: players, error } = await supabase
      .from('players')
      .select('*');
    
    if (error) throw error;
    
    console.log(`Found ${players.length} players to update\n`);
    
    for (const player of players) {
      try {
        console.log(`Updating ${player.username}...`);
        
        // Fetch current rating from GeoGuessr
        const ratingData = await fetchPlayerRating(player.geoguessr_user_id);
        
        const rating = ratingData.rating || ratingData.divisionNumber || 0;
        const division = (ratingData.divisionName || ratingData.tier || 'unranked').toLowerCase();
        
        console.log(`  Rating: ${rating}, Division: ${division}`);
        
        // Update player
        await supabase
          .from('players')
          .update({
            current_rating: rating,
            division: division,
            updated_at: new Date().toISOString()
          })
          .eq('id', player.id);
        
        // Add new rating history entry
        await supabase
          .from('rating_history')
          .insert({
            player_id: player.id,
            rating: rating,
            division: division,
            recorded_at: new Date().toISOString()
          });
        
        console.log(`  ✅ Updated!\n`);
        
        // Wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        console.error(`  ❌ Error updating ${player.username}:`, err.message, '\n');
      }
    }
    
    console.log('✅ All players updated!');
    
  } catch (error) {
    console.error('❌ Critical error:', error);
  }
  
  process.exit(0);
}

updateAllPlayers();
