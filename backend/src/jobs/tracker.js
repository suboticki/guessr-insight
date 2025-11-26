import cron from 'node-cron';
import { supabase } from '../config/supabase.js';
import { fetchPlayerRating } from '../services/geoguessr.js';

/**
 * Starts a cron job that tracks players every hour
 */
export function startTrackerJob() {
  // Runs every hour at minute 0
  cron.schedule('0 * * * *', async () => {
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
      
      let updated = 0;
      let unchanged = 0;
      let errors = 0;
      
      // For each player, fetch rating and save to database ONLY if changed
      for (const player of players) {
        try {
          const ratingData = await fetchPlayerRating(player.geoguessr_user_id);
          
          // Extract relevant data from API response
          const currentRating = ratingData.rating || ratingData.divisionNumber || 0;
          const division = (ratingData.divisionName || ratingData.tier || 'unranked').toLowerCase();
          
          // Get player's current rating from database
          const { data: playerData } = await supabase
            .from('players')
            .select('current_rating, division')
            .eq('id', player.id)
            .single();
          
          // Check if rating or division has changed
          const ratingChanged = playerData.current_rating !== currentRating;
          const divisionChanged = playerData.division !== division;
          
          if (ratingChanged || divisionChanged) {
            // Update player's current rating
            await supabase
              .from('players')
              .update({
                current_rating: currentRating,
                division: division,
                updated_at: new Date().toISOString()
              })
              .eq('id', player.id);
            
            // Save to rating_history table ONLY when changed
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
              errors++;
            } else {
              updated++;
              const change = currentRating - playerData.current_rating;
              const changeStr = change > 0 ? `+${change}` : change;
              console.log(`✅ ${player.username}: ${playerData.current_rating} → ${currentRating} (${changeStr})`);
            }
          } else {
            unchanged++;
          }
          
          // Pause between requests to avoid spamming the API
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Error processing ${player.username}:`, error.message);
          errors++;
        }
      }
      
      console.log(`\n📊 Summary: ${updated} updated | ${unchanged} unchanged | ${errors} errors`);
      
      console.log('✅ Tracking job completed');
      
    } catch (error) {
      console.error('❌ Critical error in tracking job:', error);
    }
  });
  
  console.log('✅ Cron job configured (every hour)');
}
