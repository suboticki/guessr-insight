import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import PlayerSelectionModal from '../components/PlayerSelectionModal';

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

function Compare() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerHistories, setPlayerHistories] = useState({});
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/players/search`, {
        username: searchQuery.trim()
      });

      if (response.data.count === 1) {
        // Single player found - add directly
        await addPlayer(response.data.players[0]);
      } else if (response.data.count > 1) {
        // Multiple players - show selection modal
        setSearchResults(response.data.players);
        setShowSearchModal(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Player "${searchQuery}" not found`);
      } else {
        setError('Failed to search. Please try again.');
      }
    } finally {
      setSearching(false);
      setSearchQuery('');
    }
  };

  const addPlayer = async (searchPlayer) => {
    // Check if already selected
    if (selectedPlayers.find(p => p.geoguessrId === searchPlayer.geoguessrId)) {
      setError('Player already added to comparison');
      return;
    }

    // Max 4 players
    if (selectedPlayers.length >= 4) {
      setError('Maximum 4 players can be compared at once');
      return;
    }

    try {
      // If player is not tracked, add them first
      let player = searchPlayer.dbPlayer;
      
      if (!player) {
        const addResponse = await axios.post(`${API_URL}/players/add`, {
          geoguessrId: searchPlayer.geoguessrId,
          username: searchPlayer.username
        });
        player = addResponse.data.player;
      }

      // Fetch history
      const historyResponse = await axios.get(`${API_URL}/players/${player.id}/history`);
      
      setSelectedPlayers(prev => [...prev, { ...player, geoguessrId: searchPlayer.geoguessrId }]);
      setPlayerHistories(prev => ({
        ...prev,
        [player.id]: historyResponse.data.history
      }));

      setError(null);
      setShowSearchModal(false);
    } catch (err) {
      console.error('Failed to add player:', err);
      setError('Failed to add player. Please try again.');
    }
  };

  const removePlayer = (player) => {
    setSelectedPlayers(prev => prev.filter(p => p.id !== player.id));
    setPlayerHistories(prev => {
      const newHistories = { ...prev };
      delete newHistories[player.id];
      return newHistories;
    });
  };

  // Prepare chart data
  const getChartData = () => {
    if (selectedPlayers.length === 0) return [];

    const allDates = new Set();
    Object.values(playerHistories).forEach(history => {
      history.forEach(entry => {
        allDates.add(new Date(entry.recorded_at).toISOString());
      });
    });

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map(dateStr => {
      const dataPoint = {
        date: new Date(dateStr).toLocaleDateString(),
        fullDate: dateStr
      };

      selectedPlayers.forEach(player => {
        const history = playerHistories[player.id] || [];
        const entry = history.find(h => new Date(h.recorded_at).toISOString() === dateStr);
        dataPoint[player.username] = entry ? entry.rating : null;
      });

      return dataPoint;
    });
  };

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8 animate-fadeIn">
        <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">
          Compare Players
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search and compare up to 4 players' rating progression
        </p>
      </div>

      {/* Search Bar */}
      <div className="card p-6 mb-6 animate-fadeIn">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a player to add..."
              className="w-full px-5 py-3.5 pr-32 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500 transition-all duration-200"
              disabled={searching || selectedPlayers.length >= 4}
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim() || selectedPlayers.length >= 4}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-lg font-medium hover:bg-teal-500/20 dark:hover:bg-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {searching ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          {selectedPlayers.length >= 4 && (
            <div className="mt-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-blue-600 dark:text-blue-400 text-sm">Maximum 4 players reached. Remove a player to add another.</p>
            </div>
          )}
        </form>
      </div>

      {/* Selected Players */}
      {selectedPlayers.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {selectedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className="card p-5 border-2 animate-fadeIn"
                style={{ borderColor: colors[idx], animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{player.username}</h3>
                  <button
                    onClick={() => removePlayer(player)}
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Remove player"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="text-3xl font-bold mb-1" style={{ color: colors[idx] }}>
                  {player.current_rating}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{formatDivision(player.division)}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="card p-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Rating History Comparison</h2>
            {getChartData().length < 2 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Not enough data points to display chart.</p>
                <p className="text-sm mt-2">Wait for the tracker to collect more data.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="date" 
                    className="fill-gray-600 dark:fill-gray-400"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis className="fill-gray-600 dark:fill-gray-400" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgb(31 41 55)',
                      border: '1px solid rgb(75 85 99)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  {selectedPlayers.map((player, idx) => (
                    <Line
                      key={player.id}
                      type="monotone"
                      dataKey={player.username}
                      stroke={colors[idx]}
                      strokeWidth={2}
                      dot={{ fill: colors[idx], r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}

      {selectedPlayers.length === 0 && (
        <div className="card p-12 text-center">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No players to compare</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">Search for players above to start comparing their ratings</p>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <PlayerSelectionModal
          players={searchResults}
          searchQuery={searchQuery}
          onClose={() => setShowSearchModal(false)}
          onSelectPlayer={addPlayer}
        />
      )}
    </div>
  );
}

export default Compare;
