import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEOGUESSR_BASE_URL = 'https://www.geoguessr.com';
const testUserId = '5b51062a4010740f7cd91dd5'; // Blinky

async function testGameHistoryPagination() {
  try {
    console.log('\n=== Testing Game History with Different Parameters ===\n');

    // Test 1: Basic call
    console.log('Test 1: Basic call');
    const response1 = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v4/game-history/${testUserId}?gameMode=Duels`,
      {
        headers: {
          'Cookie': `_ncfa=${process.env.GEOGUESSR_COOKIE}`
        }
      }
    );
    const games1 = response1.data.entries || [];
    console.log(`Returned ${games1.length} games`);

    // Test 2: With count parameter
    console.log('\nTest 2: With count=50');
    const response2 = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v4/game-history/${testUserId}?gameMode=Duels&count=50`,
      {
        headers: {
          'Cookie': `_ncfa=${process.env.GEOGUESSR_COOKIE}`
        }
      }
    );
    const games2 = response2.data.entries || [];
    console.log(`Returned ${games2.length} games`);

    // Test 3: With page parameter
    console.log('\nTest 3: With page=2');
    const response3 = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v4/game-history/${testUserId}?gameMode=Duels&page=2`,
      {
        headers: {
          'Cookie': `_ncfa=${process.env.GEOGUESSR_COOKIE}`
        }
      }
    );
    const games3 = response3.data.entries || [];
    console.log(`Returned ${games3.length} games`);

    // Test 4: With limit parameter
    console.log('\nTest 4: With limit=100');
    const response4 = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v4/game-history/${testUserId}?gameMode=Duels&limit=100`,
      {
        headers: {
          'Cookie': `_ncfa=${process.env.GEOGUESSR_COOKIE}`
        }
      }
    );
    const games4 = response4.data.entries || [];
    console.log(`Returned ${games4.length} games`);

    // Test 5: With offset parameter
    console.log('\nTest 5: With offset=20');
    const response5 = await axios.get(
      `${GEOGUESSR_BASE_URL}/api/v4/game-history/${testUserId}?gameMode=Duels&offset=20`,
      {
        headers: {
          'Cookie': `_ncfa=${process.env.GEOGUESSR_COOKIE}`
        }
      }
    );
    const games5 = response5.data.entries || [];
    console.log(`Returned ${games5.length} games`);
    if (games5.length > 0) {
      console.log(`First game ID: ${games5[0].gameId}`);
      console.log(`First game from original call: ${games1[games1.length - 1]?.gameId}`);
    }

    // Test 6: Check if games are in chronological order
    console.log('\n=== Game Order Analysis ===');
    const firstGameTime = new Date(games1[0].duel.rounds[0].startTime);
    const lastGameTime = new Date(games1[games1.length - 1].duel.rounds[0].startTime);
    console.log(`First game: ${firstGameTime.toISOString()}`);
    console.log(`Last game: ${lastGameTime.toISOString()}`);
    console.log(`Order: ${firstGameTime > lastGameTime ? 'Newest first' : 'Oldest first'}`);

    // Calculate stats from returned data
    console.log('\n=== Stats from 20 games ===');
    let wins = 0;
    let losses = 0;
    let maxRating = 0;

    games1.forEach(game => {
      const isWinner = game.duel.winnerId === testUserId;
      if (isWinner) wins++;
      else losses++;

      // Find player's rating in this game
      game.duel.teams.forEach(team => {
        team.players.forEach(player => {
          if (player.playerId === testUserId) {
            maxRating = Math.max(maxRating, player.rankedSystemRating);
          }
        });
      });
    });

    console.log(`Total games: ${games1.length}`);
    console.log(`Wins: ${wins}`);
    console.log(`Losses: ${losses}`);
    console.log(`Win Rate: ${((wins / (wins + losses)) * 100).toFixed(1)}%`);
    console.log(`Max Rating (from these games): ${maxRating}`);

  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.message);
  }
}

testGameHistoryPagination();
