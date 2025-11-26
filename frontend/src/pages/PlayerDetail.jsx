import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function PlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlayerData();
  }, [id]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      
      // Fetch player info
      const playersResponse = await axios.get(`${API_URL}/players`);
      const playerData = playersResponse.data.players.find(p => p.id === id);
      
      if (!playerData) {
        setError('Player not found');
        return;
      }
      
      setPlayer(playerData);
      
      // Fetch rating history
      const historyResponse = await axios.get(`${API_URL}/players/${id}/history`);
      setHistory(historyResponse.data.history);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch player data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-400">Loading player data...</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
        <p className="text-red-400">{error || 'Player not found'}</p>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
          ← Back to tracked players
        </Link>
      </div>
    );
  }

  // Format data for chart
  const chartData = history.map(entry => ({
    date: new Date(entry.recorded_at).toLocaleDateString(),
    time: new Date(entry.recorded_at).toLocaleTimeString(),
    rating: entry.rating,
    division: entry.division
  }));

  const minRating = Math.min(...history.map(h => h.rating), 0);
  const maxRating = Math.max(...history.map(h => h.rating), 100);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back button */}
      <Link 
        to="/" 
        className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-6 transition-colors"
      >
        ← Back to tracked players
      </Link>

      {/* Player header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {player.username}
            </h1>
            <p className="text-gray-400">
              Tracked since {new Date(player.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {player.current_rating}
            </div>
            <div className="text-sm text-gray-400 capitalize mt-1">{player.division}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="text-sm text-gray-400 mb-1">First Rating</div>
            <div className="text-3xl font-bold text-gray-200">{history[0].rating}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="text-sm text-gray-400 mb-1">Current Rating</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {player.current_rating}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="text-sm text-gray-400 mb-1">Total Change</div>
            <div className={`text-3xl font-bold ${
              player.current_rating - history[0].rating >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {player.current_rating - history[0].rating >= 0 ? '+' : ''}
              {player.current_rating - history[0].rating}
            </div>
          </div>
        </div>
      )}

      {/* Rating history chart */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Rating History</h2>
        
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No rating history yet.</p>
            <p className="text-sm mt-2">The tracker will record ratings every hour.</p>
          </div>
        ) : history.length === 1 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Only one data point recorded so far.</p>
            <p className="text-sm mt-2">Check back in an hour to see the graph!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#9ca3af"
                domain={[Math.floor(minRating / 100) * 100, Math.ceil(maxRating / 100) * 100]}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-800 p-3 border border-slate-600 rounded-lg shadow-xl">
                        <p className="font-semibold text-white">{payload[0].payload.date}</p>
                        <p className="text-sm text-gray-400">{payload[0].payload.time}</p>
                        <p className="text-indigo-400 font-bold mt-1">
                          Rating: {payload[0].value}
                        </p>
                        <p className="text-sm capitalize text-gray-300">
                          Division: {payload[0].payload.division}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="rating" 
                stroke="#6366f1" 
                strokeWidth={3}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* History table */}
      {history.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">Detailed History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Division
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {history.slice().reverse().map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(entry.recorded_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-400">
                      {entry.rating}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 capitalize">
                      {entry.division}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerDetail;
