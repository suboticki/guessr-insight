import { supabase } from './src/config/supabase.js';
import { fetchLeaderboard } from './src/services/geoguessr.js';

async function importTopPlayers() {
  console.log('🚀 Starting leaderboard import...');
  
  const totalPages = 30; // 30 pages * 100 = 3000 players
  let totalAdded = 0;
  let totalSkipped = 0;
  
  for (let page = 0; page < totalPages; page++) {
    try {
      console.log(`\n📄 Fetching page ${page + 1}/${totalPages}...`);
      
      const players = await fetchLeaderboard(page);
      
      if (!players || players.length === 0) {
        console.log('⚠️ No more players found, stopping...');
        break;
      }
      
      for (const player of players) {
        try {
          // Check if player already exists
          const { data: existing } = await supabase
            .from('players')
            .select('id')
            .eq('geoguessr_user_id', player.userId)
            .single();
          
          if (existing) {
            totalSkipped++;
            continue;
          }
          
          // Extract rating and division
          const rating = player.rating || player.divisionNumber || 0;
          const division = (player.divisionName || player.division || 'unranked').toLowerCase();
          
          // Add player to database
          const { data: newPlayer, error } = await supabase
            .from('players')
            .insert({
              geoguessr_user_id: player.userId,
              username: player.nick || player.username || 'Unknown',
              is_tracked: true,
              current_rating: rating,
              division: division
            })
            .select()
            .single();
          
          if (error) {
            console.error(`❌ Error adding ${player.nick}:`, error.message);
            continue;
          }
          
          // Add initial rating history entry
          await supabase
            .from('rating_history')
            .insert({
              player_id: newPlayer.id,
              rating: rating,
              division: division,
              recorded_at: new Date().toISOString()
            });
          
          totalAdded++;
          console.log(`✅ Added: ${player.nick} (${rating} - ${division})`);
          
        } catch (playerError) {
          console.error(`❌ Error processing player:`, playerError.message);
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (pageError) {
      console.error(`❌ Error fetching page ${page}:`, pageError.message);
    }
  }
  
  console.log('\n✨ Import complete!');
  console.log(`📊 Total added: ${totalAdded}`);
  console.log(`⏭️ Total skipped (already exists): ${totalSkipped}`);
}

importTopPlayers()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
