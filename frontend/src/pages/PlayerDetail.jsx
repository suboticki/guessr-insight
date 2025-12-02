import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const API_URL = 'https://guessr-insight-backend.onrender.com/api';

// Format division for display - converts roman numerals to arabic
const formatDivision = (division) => {
  if (!division) return 'Unranked';
  
  const cleanDiv = division.toString().toLowerCase().trim();
  
  // Split by underscore, space, or dash
  const parts = cleanDiv.split(/[_\s-]+/);
  
  // Capitalize rank name
  const rank = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : '';
  
  // Convert roman numerals to arabic
  const romanToArabic = {
    'i': '1',
    'ii': '2', 
    'iii': '3',
    'iv': '4',
    'v': '5'
  };
  
  // Get tier and convert if it's roman numeral
  const tier = parts[1] ? (romanToArabic[parts[1]] || parts[1]) : '';
  
  return tier ? `${rank} ${tier}` : rank;
};

function PlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const newlyAdded = location.state?.newlyAdded;
  const [player, setPlayer] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [justAddedToTracking, setJustAddedToTracking] = useState(false);

  useEffect(() => {
    fetchPlayerData();
  }, [id]);

  const [stats, setStats] = useState(null);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      
      // Fetch player info directly by ID
      const playerResponse = await axios.get(`${API_URL}/players/${id}`);
      setPlayer(playerResponse.data.player);
      
      // Fetch rating history
      const historyResponse = await axios.get(`${API_URL}/players/${id}/history`);
      setHistory(historyResponse.data.history);
      setStats(historyResponse.data.stats);
      setJustAddedToTracking(historyResponse.data.justAddedToTracking || false);
      
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
        <div className="text-lg text-gray-600">Loading player data...</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error || 'Player not found'}</p>
        <Link to="/" className="text-teal-600 hover:text-teal-700 mt-2 inline-block font-medium">
          ← Back home
        </Link>
      </div>
    );
  }

  // Format data for chart with smart date formatting based on data points
  const formatDateForChart = (dateString, dataPointCount) => {
    const date = new Date(dateString);
    
    if (dataPointCount > 60) {
      // For large datasets (2+ months), show only month and year
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else if (dataPointCount > 30) {
      // For medium datasets (1-2 months), show month and day
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // For small datasets, show full date
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    }
  };

  const chartData = history.map((entry, index) => ({
    id: entry.id || index,
    date: formatDateForChart(entry.recorded_at, history.length),
    fullDate: new Date(entry.recorded_at).toLocaleDateString(),
    time: new Date(entry.recorded_at).toLocaleTimeString(),
    rating: entry.rating,
    division: entry.division,
    timestamp: new Date(entry.recorded_at).getTime()
  }));

  console.log('Chart data sample:', chartData.slice(0, 3).map(d => ({ rating: d.rating, date: d.fullDate })));

  const minRating = Math.min(...history.map(h => h.rating));
  const maxRating = Math.max(...history.map(h => h.rating));
  
  // Calculate smart Y-axis domain based on rating range
  const ratingRange = maxRating - minRating;
  let yAxisMin, yAxisMax;
  
  if (ratingRange < 100) {
    // Very small changes (like 705-740): tight range with minimal padding
    // Add 30% of range as padding on each side, minimum 20 points
    const padding = Math.max(20, Math.ceil(ratingRange * 0.3));
    yAxisMin = Math.floor((minRating - padding) / 10) * 10;
    yAxisMax = Math.ceil((maxRating + padding) / 10) * 10;
  } else if (ratingRange < 300) {
    // Medium changes: moderate padding
    yAxisMin = Math.floor((minRating - 50) / 50) * 50;
    yAxisMax = Math.ceil((maxRating + 50) / 50) * 50;
  } else {
    // Large changes: standard padding
    yAxisMin = Math.max(0, Math.floor((minRating - 50) / 100) * 100);
    yAxisMax = Math.ceil((maxRating + 50) / 100) * 100;
  }

  return (
    <div className="max-w-7xl mx-auto">


      {/* New player or no history notification */}
      {(newlyAdded || justAddedToTracking) && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 animate-fadeIn">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-blue-800 dark:text-blue-300 font-medium">
                This player was just added to tracking
              </p>
              <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                Historical data will accumulate over time as ratings are tracked hourly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Player header */}
      <div className="card p-8 mb-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            {stats?.avatarUrl ? (
              <img 
                src={stats.avatarUrl} 
                alt={player.username}
                className="w-20 h-20 rounded-full border-2 border-teal-400/30 dark:border-teal-500/30 shadow-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 flex items-center justify-center text-white text-2xl font-bold border-2 border-teal-400/30 dark:border-teal-500/30 shadow-lg">
                {player.username.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  {player.username}
                </h1>
                {stats?.countryCode && (
                  <img 
                    src={`https://flagcdn.com/w40/${stats.countryCode}.png`}
                    srcSet={`https://flagcdn.com/w80/${stats.countryCode}.png 2x`}
                    alt={`${stats.countryCode.toUpperCase()} flag`}
                    className="w-8 h-6 object-cover rounded shadow-sm"
                    title={stats.countryCode.toUpperCase()}
                    style={{ imageRendering: 'crisp-edges' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                {stats?.isVerified && (
                  <svg 
                    className="w-8 h-8 text-blue-500" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    title="Verified Account"
                  >
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="text-gray-600 dark:text-gray-400 space-y-1">
                {stats?.level && (
                  <p className="text-sm">
                    Level {stats.level} • {stats.totalXP?.toLocaleString()} XP
                  </p>
                )}
                {stats?.accountCreated && (
                  <p className="text-sm">
                    Account created: {new Date(stats.accountCreated).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
                <p className="text-sm">
                  Tracked since {new Date(player.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="text-left md:text-right">
            <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {player.current_rating}
            </div>
            <div className="text-sm text-gray-400 mt-1">{formatDivision(player.division)}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {history.length > 0 && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="glass rounded-xl p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.05s' }}>
              <div className="text-sm text-gray-400 mb-1">Best Recent Rating</div>
              <div className="text-3xl font-bold text-yellow-400">
                {stats.playerStats?.maxRating || stats.peakRating}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.playerStats?.maxRating ? 'Last 20 games' : 'Tracked by us'}
              </div>
            </div>
            <div className="glass rounded-xl p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <div className="text-sm text-gray-400 mb-1">Current Rating</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {player.current_rating}
              </div>
            </div>
            <div className="glass rounded-xl p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <div className="text-sm text-gray-400 mb-1">7-Day Change</div>
              {stats.sevenDayChange !== null ? (
                <div className={`text-3xl font-bold ${
                  stats.sevenDayChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats.sevenDayChange >= 0 ? '+' : ''}
                  {stats.sevenDayChange}
                </div>
              ) : (
                <div className="text-sm text-gray-500 mt-2">
                  Not enough data yet
                </div>
              )}
              {stats.sevenDayChange !== null && (
                <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
              )}
            </div>
            <div className="glass rounded-xl p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.25s' }}>
              <div className="text-sm text-gray-400 mb-1">Account Age</div>
              {stats.accountCreated ? (
                <>
                  <div className="text-3xl font-bold text-blue-400">
                    {Math.floor((new Date() - new Date(stats.accountCreated)) / (1000 * 60 * 60 * 24 * 365.25))}y
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Since {new Date(stats.accountCreated).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric'
                    })}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 mt-2">Unknown</div>
              )}
            </div>
          </div>

          {/* Competitive/Duel Stats */}
          {stats.playerStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="glass rounded-xl p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                  <div className="text-sm text-gray-400 mb-1">Win Rate</div>
                  <div className="text-3xl font-bold text-green-400">
                    {stats.playerStats.winRate}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last {stats.playerStats.totalGames} games: {stats.playerStats.wins}W - {stats.playerStats.losses}L
                  </div>
                </div>
                <div className="glass rounded-xl p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.35s' }}>
                  <div className="text-sm text-gray-400 mb-1">Win Streak</div>
                  <div className="text-3xl font-bold text-purple-400">
                    {stats.playerStats.winStreak}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Current streak</div>
                </div>
                <div className="glass rounded-xl p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                  <div className="text-sm text-gray-400 mb-1">Guessed First</div>
                  <div className="text-3xl font-bold text-teal-400">
                    {stats.playerStats.guessedFirstRate}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    First guess rate
                  </div>
                </div>
              </div>

              {/* Game Mode Ratings */}
              {stats.playerStats.gameModeRatings && Object.keys(stats.playerStats.gameModeRatings).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {stats.playerStats.gameModeRatings.standardDuels && (
                    <div className="glass rounded-xl p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.45s' }}>
                      <div className="text-sm text-gray-400 mb-1">Standard Duels</div>
                      <div className="text-3xl font-bold text-blue-400">
                        {stats.playerStats.gameModeRatings.standardDuels}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {stats.playerStats.gamesByMode?.standardDuels || 0} games in last 20
                      </div>
                    </div>
                  )}
                  {stats.playerStats.gameModeRatings.noMoveDuels && (
                    <div className="glass rounded-xl p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                      <div className="text-sm text-gray-400 mb-1">No Move Duels</div>
                      <div className="text-3xl font-bold text-orange-400">
                        {stats.playerStats.gameModeRatings.noMoveDuels}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {stats.playerStats.gamesByMode?.noMoveDuels || 0} games in last 20
                      </div>
                    </div>
                  )}
                  {stats.playerStats.gameModeRatings.nmpzDuels && (
                    <div className="glass rounded-xl p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.55s' }}>
                      <div className="text-sm text-gray-400 mb-1">NMPZ Duels</div>
                      <div className="text-3xl font-bold text-pink-400">
                        {stats.playerStats.gameModeRatings.nmpzDuels}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {stats.playerStats.gamesByMode?.nmpzDuels || 0} games in last 20
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Rating history chart */}
      <div className="glass rounded-xl p-6 mb-6 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
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
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  if (history.length > 60) {
                    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  } else if (history.length > 30) {
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
                }}
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis 
                stroke="#9ca3af"
                domain={[Math.max(0, yAxisMin), yAxisMax]}
                tick={{ fontSize: 12 }}
                tickCount={8}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-800/95 backdrop-blur-sm p-4 border-2 border-indigo-500/50 rounded-xl shadow-2xl">
                        <p className="font-bold text-white text-base mb-1">{data.fullDate}</p>
                        <p className="text-xs text-gray-400 mb-2">{data.time}</p>
                        <div className="border-t border-slate-600 pt-2 mt-2">
                          <p className="text-xs text-gray-400 mb-1">Rating</p>
                          <p className="text-indigo-400 font-bold text-xl">
                            {data.rating}
                          </p>
                          <p className="text-xs text-gray-400 uppercase tracking-wide mt-2">
                            {formatDivision(data.division)}
                          </p>
                        </div>
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
                strokeWidth={history.length > 50 ? 2 : 3}
                dot={history.length > 30 ? false : { fill: '#6366f1', r: 4 }}
                activeDot={{ r: 8, fill: '#818cf8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* History table */}
      {history.length > 0 && (
        <div className="glass rounded-xl p-6 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDivision(entry.division)}
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
