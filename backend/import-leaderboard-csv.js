import Papa from 'papaparse';
import { supabase } from './src/config/supabase.js';
import { fetchPlayerRating } from './src/services/geoguessr.js';

const CSV_URL = 'https://media.githubusercontent.com/media/Matt-OP/geoleaderboard/refs/heads/main/leaderboard.csv';

async function importLeaderboardPlayers() {
  try {
    console.log('📥 Fetching leaderboard CSV...');
    
    // Fetch the CSV file
    const response = await fetch(CSV_URL);
    const csvText = await response.text();
    
    // Parse CSV
    const results = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    
    const players = results.data.filter(p => p.id && p.nick && p.rating); // Filter valid entries
    console.log(`📊 Found ${players.length} valid players in leaderboard`);
    
    // Get all existing player IDs in one query
    console.log('🔍 Checking existing players...');
    const { data: existingPlayers } = await supabase
      .from('players')
      .select('geoguessr_user_id');
    
    const existingIds = new Set(existingPlayers?.map(p => p.geoguessr_user_id) || []);
    console.log(`📋 Found ${existingIds.size} existing players in database`);
    
    // Filter out players that already exist
    const newPlayers = players.filter(p => !existingIds.has(p.id));
    console.log(`➕ ${newPlayers.length} new players to add`);
    
    if (newPlayers.length === 0) {
      console.log('✅ All players already in database!');
      return;
    }
    
    // Prepare bulk insert data
    const playersToInsert = newPlayers.map(player => ({
      geoguessr_user_id: player.id,
      username: player.nick,
      is_tracked: true,
      current_rating: player.rating || 0,
      division: player.divisionName ? player.divisionName.toLowerCase() : 'unranked'
    }));
    
    // Insert players in large batches (Supabase limit is ~1000 per request)
    const batchSize = 500;
    let totalAdded = 0;
    
    for (let i = 0; i < playersToInsert.length; i += batchSize) {
      const batch = playersToInsert.slice(i, i + batchSize);
      
      console.log(`\n📥 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(playersToInsert.length / batchSize)} (${batch.length} players)...`);
      
      const { data: insertedPlayers, error } = await supabase
        .from('players')
        .insert(batch)
        .select('id, geoguessr_user_id, current_rating, division');
      
      if (error) {
        console.error('❌ Error inserting batch:', error.message);
        continue;
      }
      
      // Create rating history entries for this batch
      const historyEntries = insertedPlayers.map(player => ({
        player_id: player.id,
        rating: player.current_rating,
        division: player.division,
        recorded_at: new Date().toISOString()
      }));
      
      const { error: historyError } = await supabase
        .from('rating_history')
        .insert(historyEntries);
      
      if (historyError) {
        console.error('⚠️ Error inserting rating history:', historyError.message);
      }
      
      totalAdded += insertedPlayers.length;
      console.log(`✅ Batch complete! Total added so far: ${totalAdded}/${newPlayers.length}`);
    }
    
    const added = totalAdded;
    const skipped = existingIds.size;
    const errors = 0;
    
    console.log('\n🎉 Import complete!');
    console.log(`   ✅ Total added: ${added}`);
    console.log(`   ⏭️ Total skipped: ${skipped}`);
    console.log(`   ❌ Total errors: ${errors}`);
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

// Run the import
importLeaderboardPlayers();
