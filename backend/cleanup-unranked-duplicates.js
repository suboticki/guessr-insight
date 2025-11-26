import { supabase } from './src/config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupUnrankedDuplicates() {
  console.log('🔍 Starting cleanup of unranked duplicate entries...\n');
  
  try {
    // Get all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, username');
    
    if (playersError) throw playersError;
    
    console.log(`Found ${players.length} players to check\n`);
    
    let totalDeleted = 0;
    
    for (const player of players) {
      // Get all rating history for this player, ordered by date
      const { data: history, error: historyError } = await supabase
        .from('rating_history')
        .select('*')
        .eq('player_id', player.id)
        .order('recorded_at', { ascending: true });
      
      if (historyError) {
        console.error(`Error fetching history for ${player.username}:`, historyError);
        continue;
      }
      
      if (history.length === 0) continue;
      
      const toDelete = [];
      
      // Find unranked entries that have a later entry with same rating but with division
      for (let i = 0; i < history.length; i++) {
        const entry = history[i];
        
        // Check if this is an unranked entry
        if (!entry.division || entry.division.toLowerCase() === 'unranked') {
          // Look for a later entry with same rating but with a real division
          for (let j = i + 1; j < history.length; j++) {
            const laterEntry = history[j];
            
            if (laterEntry.rating === entry.rating && 
                laterEntry.division && 
                laterEntry.division.toLowerCase() !== 'unranked') {
              // Found a duplicate with proper division
              toDelete.push({
                id: entry.id,
                rating: entry.rating,
                division: entry.division || 'NULL',
                date: new Date(entry.recorded_at).toLocaleString(),
                replacedBy: {
                  division: laterEntry.division,
                  date: new Date(laterEntry.recorded_at).toLocaleString()
                }
              });
              break; // Don't need to check further
            }
          }
        }
      }
      
      if (toDelete.length > 0) {
        console.log(`\n📊 Player: ${player.username}`);
        console.log(`   Total entries: ${history.length}`);
        console.log(`   Unranked duplicates to delete: ${toDelete.length}`);
        
        // Delete the entries
        const idsToDelete = toDelete.map(entry => entry.id);
        const { error: deleteError } = await supabase
          .from('rating_history')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) {
          console.error(`   ❌ Error deleting entries:`, deleteError);
        } else {
          console.log(`   ✅ Deleted ${toDelete.length} unranked duplicate(s)`);
          
          // Show what was deleted
          toDelete.forEach((entry, idx) => {
            console.log(`   ${idx + 1}. Rating: ${entry.rating}, Division: ${entry.division}, Date: ${entry.date}`);
            console.log(`      → Replaced by: ${entry.replacedBy.division} on ${entry.replacedBy.date}`);
          });
          
          totalDeleted += toDelete.length;
        }
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✨ Cleanup complete!`);
    console.log(`Total unranked duplicates deleted: ${totalDeleted}`);
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupUnrankedDuplicates();
