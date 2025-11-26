import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

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

function Search() {
  const [username, setUsername] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearchResults(null);
      
      const response = await axios.post(`${API_URL}/players`, { username: username.trim() });
      
      // Player was added successfully
      setSearchResults(response.data.player);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Player not found on GeoGuessr');
      } else if (err.response?.status === 400 && err.response?.data?.error?.includes('already added')) {
        setError('Player is already being tracked');
      } else {
        setError(err.response?.data?.error || 'Failed to search player');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Search Players
        </h1>
        <p className="text-gray-400">
          Find any GeoGuessr player and start tracking their rating
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              GeoGuessr Username
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Searching...' : 'Search & Track'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </form>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{searchResults.username}</h3>
              <p className="text-gray-400 text-sm">Player found and added to tracking!</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-400">{searchResults.current_rating}</div>
              <div className="text-sm text-gray-400">{formatDivision(searchResults.division)}</div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/player/${searchResults.id}`)}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
            >
              View History
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              Go to Tracked Players
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <h3 className="font-semibold text-blue-400 mb-2">💡 Tips</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Search by exact GeoGuessr username</li>
          <li>• Players must have public profiles to be tracked</li>
          <li>• Ratings are updated every hour automatically</li>
        </ul>
      </div>
    </div>
  );
}

export default Search;
