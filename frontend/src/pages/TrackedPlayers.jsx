import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://guessr-insight-backend.onrender.com/api';

// Format division for display - converts roman numerals to arabic
const formatDivision = (division) => {
  if (!division) return 'Unranked';
  
  const cleanDiv = division.toString().toLowerCase().trim();
  const parts = cleanDiv.split(/[_\s-]+/);
  
  const rank = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : '';
  
  const romanToArabic = {
    'i': '1',
    'ii': '2', 
    'iii': '3',
    'iv': '4',
    'v': '5'
  };
  
  const tier = parts[1] ? (romanToArabic[parts[1]] || parts[1]) : '';
  
  return tier ? `${rank} ${tier}` : rank;
};

function TrackedPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/players`);
      setPlayers(response.data.players);
      setError(null);
    } catch (err) {
      setError('Failed to fetch players');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removePlayer = async (id) => {
    if (!confirm('Are you sure you want to remove this player from tracking?')) return;
    
    try {
      await axios.delete(`${API_URL}/players/${id}`);
      fetchPlayers();
    } catch (err) {
      alert('Failed to remove player');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-400">Loading players...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8 animate-fadeIn">
        <h1 className="text-4xl font-bold mb-3 gradient-shimmer">
          Tracked Players
        </h1>
        <p className="text-gray-400">
          {players.length} player{players.length !== 1 ? 's' : ''} being tracked automatically every hour
        </p>
      </div>

      {players.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
          <p className="text-gray-400 mb-6 text-lg">No players being tracked yet.</p>
          <Link 
            to="/" 
            className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-semibold"
          >
            Start Tracking Players
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player, idx) => (
            <div 
              key={player.id} 
              className="glass rounded-xl hover:border-indigo-500 transition-all p-6 group card-hover animate-fadeIn"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{player.username}</h3>
                  <p className="text-sm text-gray-500">
                    Tracked since {new Date(player.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  title="Remove player"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Rating</span>
                  <span className="font-bold text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {player.current_rating}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Division</span>
                  <span className="font-semibold text-gray-200">{formatDivision(player.division)}</span>
                </div>
              </div>

              <Link
                to={`/player/${player.id}`}
                className="block w-full text-center bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-medium btn-press hover:shadow-lg hover:shadow-indigo-500/30"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TrackedPlayers;
