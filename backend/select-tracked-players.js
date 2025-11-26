import { supabase } from './src/config/supabase.js';

async function selectTrackedPlayers() {
  console.log('🎯 Selecting 500 players to track...\n');
  
  try {
    // Step 1: Untrack all players first
    console.log('1️⃣ Untracking all players...');
    await supabase
      .from('players')
      .update({ is_tracked: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ All players untracked\n');
    
    // Step 2: Track top 300 by rating
    console.log('2️⃣ Tracking top 300 players by rating...');
    const { data: topRated, error: topError } = await supabase
      .from('players')
      .select('id, username, current_rating')
      .order('current_rating', { ascending: false })
      .limit(300);
    
    if (topError) throw topError;
    
    const topRatedIds = topRated.map(p => p.id);
    await supabase
      .from('players')
      .update({ is_tracked: true })
      .in('id', topRatedIds);
    
    console.log(`✅ Tracked top 300 by rating (${topRated[0]?.current_rating} - ${topRated[299]?.current_rating})\n`);
    
    // Step 3: Track 200 most recently updated (excluding already tracked)
    console.log('3️⃣ Tracking 200 recently active players...');
    const { data: recentlyActive, error: recentError } = await supabase
      .from('players')
      .select('id, username, updated_at')
      .eq('is_tracked', false)
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(200);
    
    if (recentError) throw recentError;
    
    if (recentlyActive && recentlyActive.length > 0) {
      const activeIds = recentlyActive.map(p => p.id);
      await supabase
        .from('players')
        .update({ is_tracked: true })
        .in('id', activeIds);
      
      console.log(`✅ Tracked 200 recently active players\n`);
    } else {
      console.log('⚠️  No recently active players found, tracking 200 more top players instead...');
      
      const { data: extraTop } = await supabase
        .from('players')
        .select('id')
        .eq('is_tracked', false)
        .order('current_rating', { ascending: false })
        .limit(200);
      
      if (extraTop && extraTop.length > 0) {
        const extraIds = extraTop.map(p => p.id);
        await supabase
          .from('players')
          .update({ is_tracked: true })
          .in('id', extraIds);
        console.log(`✅ Tracked 200 additional top players\n`);
      }
    }
    
    // Verify final count
    const { count } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('is_tracked', true);
    
    console.log('═'.repeat(50));
    console.log(`✨ DONE! ${count} players are now tracked`);
    console.log(`⏱️  Update cycle time: ~${Math.ceil(count * 2 / 60)} minutes`);
    console.log('═'.repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

selectTrackedPlayers();
