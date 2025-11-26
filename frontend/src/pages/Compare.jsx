import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

function Compare() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerHistories, setPlayerHistories] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${API_URL}/players`);
      setPlayers(response.data.players);
    } catch (err) {
      console.error('Failed to fetch players:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayer = async (player) => {
    const isSelected = selectedPlayers.find(p => p.id === player.id);
    
    if (isSelected) {
      // Remove player
      setSelectedPlayers(prev => prev.filter(p => p.id !== player.id));
      setPlayerHistories(prev => {
        const newHistories = { ...prev };
        delete newHistories[player.id];
        return newHistories;
      });
    } else {
      // Add player (max 4 players)
      if (selectedPlayers.length >= 4) {
        alert('Maximum 4 players can be compared at once');
        return;
      }

      setSelectedPlayers(prev => [...prev, player]);
      
      // Fetch history
      try {
        const response = await axios.get(`${API_URL}/players/${player.id}/history`);
        setPlayerHistories(prev => ({
          ...prev,
          [player.id]: response.data.history
        }));
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-400">Loading players...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8 animate-fadeIn">
        <h1 className="text-4xl font-bold mb-3 gradient-shimmer">
          Compare Players
        </h1>
        <p className="text-gray-400">
          Select up to 4 players to compare their rating progression
        </p>
      </div>

      {/* Player Selection */}
      <div className="glass rounded-xl p-6 mb-6 animate-fadeIn">
        <h2 className="text-lg font-semibold mb-4">Select Players ({selectedPlayers.length}/4)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {players.map((player) => {
            const isSelected = selectedPlayers.find(p => p.id === player.id);
            return (
              <button
                key={player.id}
                onClick={() => togglePlayer(player)}
                className={`p-4 rounded-lg border-2 transition-all text-left btn-press ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/20'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500 hover:shadow-md'
                }`}
              >
                <div className="font-semibold text-white">{player.username}</div>
                <div className="text-sm text-gray-400">{player.current_rating}</div>
              </button>
            );
          })}
        </div>

        {players.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            No players tracked yet. Add some players first!
          </p>
        )}
      </div>

      {/* Comparison */}
      {selectedPlayers.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {selectedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl border-2 p-4"
                style={{ borderColor: colors[idx] }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{player.username}</h3>
                  <button
                    onClick={() => togglePlayer(player)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-3xl font-bold" style={{ color: colors[idx] }}>
                  {player.current_rating}
                </div>
                <div className="text-sm text-gray-400">{formatDivision(player.division)}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="glass rounded-xl p-6 animate-fadeIn">
            <h2 className="text-xl font-bold mb-4">Rating History Comparison</h2>
            {getChartData().length < 2 ? (
              <div className="text-center py-12 text-gray-400">
                <p>Not enough data points to display chart.</p>
                <p className="text-sm mt-2">Wait for the tracker to collect more data.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px'
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
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No players selected</p>
          <p className="text-gray-500 text-sm">Select players above to start comparing</p>
        </div>
      )}
    </div>
  );
}

export default Compare;
