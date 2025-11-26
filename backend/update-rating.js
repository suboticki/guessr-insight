import dotenv from 'dotenv';
import { supabase } from './src/config/supabase.js';
import { fetchPlayerRating, fetchPlayerProfile } from './src/services/geoguessr.js';

dotenv.config();

/**
 * Updates rating for a specific player by username
 * Usage: node update-rating.js <username>
 * Example: node update-rating.js subi
 */
async function updatePlayerRating(username) {
  try {
    console.log(`\n🔍 Looking for player: ${username}...\n`);

    // Find player in database
    const { data: player, error: findError } = await supabase
      .from('players')
      .select('*')
      .ilike('username', username)
      .single();

    if (findError || !player) {
      console.error(`❌ Player "${username}" not found in database`);
      console.log('💡 Make sure the player is being tracked first');
      return;
    }

    console.log(`✅ Found player: ${player.username} (ID: ${player.geoguessr_user_id})`);
    console.log(`📊 Current rating in DB: ${player.current_rating}`);
    console.log(`📊 Current division: ${player.division}\n`);

    // Fetch latest rating from GeoGuessr
    console.log('🌐 Fetching latest rating from GeoGuessr API...\n');
    
    const ratingData = await fetchPlayerRating(player.geoguessr_user_id);
    const newRating = ratingData.rating || ratingData.divisionNumber || player.current_rating;
    const newDivision = (ratingData.divisionName || ratingData.tier || player.division).toLowerCase();

    console.log(`📈 New rating from API: ${newRating}`);
    console.log(`🏆 New division: ${newDivision}\n`);

    // Check if rating actually changed
    if (newRating === player.current_rating) {
      console.log('ℹ️  Rating unchanged - no update needed');
      return;
    }

    const ratingChange = newRating - player.current_rating;
    console.log(`${ratingChange >= 0 ? '📈' : '📉'} Rating change: ${ratingChange >= 0 ? '+' : ''}${ratingChange}\n`);

    // Update player's current rating in database
    const { error: updateError } = await supabase
      .from('players')
      .update({
        current_rating: newRating,
        division: newDivision,
        updated_at: new Date().toISOString()
      })
      .eq('id', player.id);

    if (updateError) {
      console.error('❌ Error updating player:', updateError.message);
      return;
    }

    console.log('✅ Updated player record\n');

    // Add new entry to rating history
    const { error: historyError } = await supabase
      .from('rating_history')
      .insert({
        player_id: player.id,
        rating: newRating,
        division: newDivision,
        recorded_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('❌ Error adding to history:', historyError.message);
      return;
    }

    console.log('✅ Added entry to rating history\n');

    // Show summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 UPDATE SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Player: ${player.username}`);
    console.log(`Old Rating: ${player.current_rating} → New Rating: ${newRating}`);
    console.log(`Change: ${ratingChange >= 0 ? '+' : ''}${ratingChange}`);
    console.log(`Division: ${newDivision}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Rating update complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

// Get username from command line argument
const username = process.argv[2];

if (!username) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Update Player Rating');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nUsage: node update-rating.js <username>');
  console.log('\nExample:');
  console.log('  node update-rating.js subi');
  console.log('\nThis will:');
  console.log('  1. Fetch latest rating from GeoGuessr API');
  console.log('  2. Update player record in database');
  console.log('  3. Add new entry to rating history');
  console.log('  4. Build your rating graph over time\n');
  process.exit(1);
}

updatePlayerRating(username);
