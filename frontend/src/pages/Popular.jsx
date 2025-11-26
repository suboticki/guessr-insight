import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// List of popular/pro GeoGuessr players
const POPULAR_PLAYERS = [
  { username: 'GeoPeter', description: 'Pro player and content creator' },
  { username: 'zi8gzag', description: 'Top competitive player' },
  { username: 'Rainbolt', description: 'Famous for instant guessing' },
  { username: 'GeoStique', description: 'High-ranked competitive player' },
  { username: 'subi', description: 'Competitive player' },
  { username: 'vukGG', description: 'Strong duels player' },
  { username: 'Chicago Geographer', description: 'Educational content' },
  { username: 'Consus', description: 'Top ranked player' },
];

function Popular() {
  const [addingPlayer, setAddingPlayer] = useState(null);
  const [addedPlayers, setAddedPlayers] = useState(new Set());
  const navigate = useNavigate();

  const addPlayer = async (username) => {
    try {
      setAddingPlayer(username);
      
      const response = await axios.post(`${API_URL}/players`, { username });
      
      setAddedPlayers(prev => new Set([...prev, username]));
      
      // Navigate to player detail after adding
      setTimeout(() => {
        navigate(`/player/${response.data.player.id}`);
      }, 500);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.error?.includes('already')) {
        alert('Player already tracked!');
        setAddedPlayers(prev => new Set([...prev, username]));
      } else {
        alert('Failed to add player: ' + (err.response?.data?.error || err.message));
      }
      console.error(err);
    } finally {
      setAddingPlayer(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Popular Players
        </h1>
        <p className="text-gray-400">
          Quick access to track well-known GeoGuessr players
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {POPULAR_PLAYERS.map((player) => {
          const isAdded = addedPlayers.has(player.username);
          const isAdding = addingPlayer === player.username;

          return (
            <div
              key={player.username}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:border-indigo-500/50 transition-all"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-1">{player.username}</h3>
                <p className="text-sm text-gray-400">{player.description}</p>
              </div>

              <button
                onClick={() => addPlayer(player.username)}
                disabled={isAdding || isAdded}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                  isAdded
                    ? 'bg-green-600/20 text-green-400 cursor-default'
                    : isAdding
                    ? 'bg-gray-700 text-gray-400 cursor-wait'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                }`}
              >
                {isAdded ? '✓ Already Tracked' : isAdding ? 'Adding...' : '+ Track Player'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom player option */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 mb-4">Don't see who you're looking for?</p>
        <button
          onClick={() => navigate('/search')}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
        >
          Search for Any Player
        </button>
      </div>
    </div>
  );
}

export default Popular;
