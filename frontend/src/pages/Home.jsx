import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const POPULAR_PLAYERS = [
  { username: 'zi8gzag', description: 'World Champion' },
  { username: 'blinky', description: 'Top Competitor' },
  { username: 'Rainbolt', description: 'Geography Legend' },
  { username: 'GeoPeter', description: 'Elite Player' },
  { username: 'GeoStique', description: 'Pro Streamer' },
  { username: 'Chicago Geographer', description: 'US Expert' },
];

function Home() {
  const [searchUsername, setSearchUsername] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [addingPlayer, setAddingPlayer] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/players`, {
        username: searchUsername.trim()
      });

      navigate(`/player/${response.data.player.id}`);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Player "${searchUsername}" not found on GeoGuessr`);
      } else if (err.response?.data?.error?.includes('already being tracked')) {
        setError('This player is already being tracked');
      } else {
        setError('Failed to add player. Please try again.');
      }
    } finally {
      setSearching(false);
    }
  };

  const addPopularPlayer = async (username) => {
    setAddingPlayer(username);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/players`, { username });
      navigate(`/player/${response.data.player.id}`);
    } catch (err) {
      if (err.response?.data?.error?.includes('already being tracked')) {
        // Find and navigate to existing player
        try {
          const playersResponse = await axios.get(`${API_URL}/players`);
          const player = playersResponse.data.players.find(
            p => p.username.toLowerCase() === username.toLowerCase()
          );
          if (player) {
            navigate(`/player/${player.id}`);
          }
        } catch {
          setError(`${username} is already tracked`);
        }
      } else {
        setError(`Failed to add ${username}`);
      }
    } finally {
      setAddingPlayer(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          GeoGuessr Insight
        </h1>
        <p className="text-xl text-gray-400 mb-2">Track competitive ratings and player progression</p>
        <p className="text-sm text-gray-500">Automatic hourly tracking • Detailed history • Player comparison</p>
      </div>

      {/* Search Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Start Tracking a Player
        </h2>
        
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Enter GeoGuessr username..."
              className="flex-1 px-6 py-4 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              disabled={searching}
            />
            <button
              type="submit"
              disabled={searching || !searchUsername.trim()}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-indigo-500/20"
            >
              {searching ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 max-w-2xl mx-auto bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Popular Players Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Popular Players
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_PLAYERS.map((player) => (
            <button
              key={player.username}
              onClick={() => addPopularPlayer(player.username)}
              disabled={addingPlayer === player.username}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 hover:border-indigo-500 p-6 text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {player.username}
                  </h3>
                  <p className="text-sm text-gray-400">{player.description}</p>
                </div>
                <div className="text-2xl">
                  {addingPlayer === player.username ? '⏳' : '➕'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700 p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-white mb-2">Auto Tracking</h3>
          <p className="text-sm text-gray-400">Ratings updated every hour automatically</p>
        </div>
        
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700 p-6 text-center">
          <div className="text-4xl mb-3">📈</div>
          <h3 className="text-lg font-semibold text-white mb-2">History Charts</h3>
          <p className="text-sm text-gray-400">Visualize rating progression over time</p>
        </div>
        
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700 p-6 text-center">
          <div className="text-4xl mb-3">⚔️</div>
          <h3 className="text-lg font-semibold text-white mb-2">Compare Players</h3>
          <p className="text-sm text-gray-400">Side-by-side player comparison</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
