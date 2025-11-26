import { supabase } from './src/config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Removes consecutive duplicate rating entries (keeps only one when rating is repeated)
 * Shows detailed log of what was deleted
 */
async function cleanupConsecutiveDuplicates() {
  console.log('🧹 Cleaning up consecutive duplicate ratings...\n');
  
  try {
    // Get all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, username');
    
    if (playersError) throw playersError;
    
    console.log(`📊 Checking ${players.length} players\n`);
    
    let totalRemoved = 0;
    
    for (const player of players) {
      // Get all rating history for this player, ordered by date
      const { data: history, error: historyError } = await supabase
        .from('rating_history')
        .select('*')
        .eq('player_id', player.id)
        .order('recorded_at', { ascending: true });
      
      if (historyError || !history || history.length === 0) continue;
      
      const toDelete = [];
      const deletedDetails = [];
      
      // Find consecutive duplicates
      for (let i = 1; i < history.length; i++) {
        const current = history[i];
        const previous = history[i - 1];
        
        // If same rating and division as previous entry, mark for deletion
        if (current.rating === previous.rating && current.division === previous.division) {
          toDelete.push(current.id);
          deletedDetails.push({
            rating: current.rating,
            division: current.division,
            date: new Date(current.recorded_at).toLocaleString('sr-RS')
          });
        }
      }
      
      if (toDelete.length > 0) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Player: ${player.username}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Total entries: ${history.length}`);
        console.log(`Duplicates found: ${toDelete.length}\n`);
        
        console.log('Deleting:');
        deletedDetails.forEach((entry, idx) => {
          console.log(`  ${idx + 1}. Rating: ${entry.rating} | Division: ${entry.division} | Date: ${entry.date}`);
        });
        
        // Delete consecutive duplicates
        const { error: deleteError } = await supabase
          .from('rating_history')
          .delete()
          .in('id', toDelete);
        
        if (!deleteError) {
          console.log(`\n✅ Deleted ${toDelete.length} consecutive duplicates`);
          console.log(`📊 Remaining entries: ${history.length - toDelete.length}`);
          totalRemoved += toDelete.length;
        } else {
          console.log(`\n❌ Error deleting: ${deleteError.message}`);
        }
      }
    }
    
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FINAL SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Total removed: ${totalRemoved} consecutive duplicates`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

cleanupConsecutiveDuplicates();
