import { supabase } from './src/config/supabase.js';

async function listTrackedPlayers() {
  console.log('📋 Fetching tracked players...\n');
  
  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('username, current_rating, division')
      .eq('is_tracked', true)
      .order('current_rating', { ascending: false });
    
    if (error) throw error;
    
    console.log(`✅ Found ${players.length} tracked players:\n`);
    console.log('═'.repeat(70));
    console.log('Rank | Username                    | Rating | Division');
    console.log('═'.repeat(70));
    
    players.forEach((player, index) => {
      const rank = (index + 1).toString().padStart(4, ' ');
      const username = player.username.padEnd(27, ' ');
      const rating = player.current_rating.toString().padStart(6, ' ');
      const division = player.division || 'unranked';
      
      console.log(`${rank} | ${username} | ${rating} | ${division}`);
    });
    
    console.log('═'.repeat(70));
    console.log(`\nTotal: ${players.length} players tracked`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listTrackedPlayers();
