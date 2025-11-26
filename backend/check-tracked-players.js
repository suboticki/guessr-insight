import { supabase } from './src/config/supabase.js';

async function checkTrackedPlayers() {
  console.log('🔍 Checking tracked players...\n');
  
  // Total players
  const { count: totalCount } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true });
  
  // Tracked players
  const { count: trackedCount } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('is_tracked', true);
  
  // Not tracked players
  const { count: notTrackedCount } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('is_tracked', false);
  
  console.log(`📊 Total players in database: ${totalCount.toLocaleString()}`);
  console.log(`✅ Tracked players (auto-update every hour): ${trackedCount.toLocaleString()}`);
  console.log(`❌ Not tracked players: ${notTrackedCount.toLocaleString()}`);
  
  if (trackedCount > 0) {
    console.log(`\n⏱️  Time to update all tracked players (with 2s delay):`);
    const secondsNeeded = trackedCount * 2;
    const minutesNeeded = Math.ceil(secondsNeeded / 60);
    console.log(`   ${minutesNeeded} minutes per update cycle`);
    
    if (minutesNeeded > 60) {
      console.log(`   ⚠️  WARNING: Update takes longer than 1 hour!`);
    }
  }
}

checkTrackedPlayers();
