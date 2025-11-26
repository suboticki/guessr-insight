import cron from 'node-cron';
import { supabase } from '../config/supabase.js';
import { fetchPlayerRating } from '../services/geoguessr.js';

/**
 * Starts a cron job that tracks players every 10 minutes
 */
export function startTrackerJob() {
  // Runs every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    console.log('⏰ Starting tracking job...');
    
    try {
      // Fetch all players from database that should be tracked
      const { data: players, error } = await supabase
        .from('players')
        .select('id, geoguessr_user_id, username')
        .eq('is_tracked', true);
      
      if (error) {
        console.error('❌ Error fetching players:', error);
        return;
      }
      
      if (!players || players.length === 0) {
        console.log('ℹ️  No players to track');
        return;
      }
      
      console.log(`📊 Tracking ${players.length} players...`);
      
      // For each player, fetch rating and save to database
      for (const player of players) {
        try {
          const ratingData = await fetchPlayerRating(player.geoguessr_user_id);
          
          // Extract relevant data
          const currentRating = ratingData.rating || 0;
          const division = ratingData.division || 'unranked';
          
          // Save to rating_history table
          const { error: insertError } = await supabase
            .from('rating_history')
            .insert({
              player_id: player.id,
              rating: currentRating,
              division: division,
              recorded_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error(`❌ Error saving rating for ${player.username}:`, insertError);
          } else {
            console.log(`✅ ${player.username}: ${currentRating} (${division})`);
          }
          
          // Pause between requests to avoid spamming the API
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Error processing ${player.username}:`, error.message);
        }
      }
      
      console.log('✅ Tracking job completed');
      
    } catch (error) {
      console.error('❌ Critical error in tracking job:', error);
    }
  });
  
  console.log('✅ Cron job configured (every 10 minutes)');
}
