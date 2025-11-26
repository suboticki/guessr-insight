import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PlayerSelectionModal from '../components/PlayerSelectionModal';

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
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [allPlayers, setAllPlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllPlayers();
  }, []);

  const fetchAllPlayers = async () => {
    try {
      const response = await axios.get(`${API_URL}/players`);
      setAllPlayers(response.data.players);
    } catch (err) {
      console.error('Failed to fetch players:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    setSearching(true);
    setError(null);
    const query = searchUsername.trim();

    try {
      const response = await axios.post(`${API_URL}/players/search`, {
        username: query
      });

      if (response.data.count === 1) {
        // Only one player found
        const player = response.data.players[0];
        
        if (player.isTracked && player.dbPlayer) {
          // Already tracked, navigate directly
          navigate(`/player/${player.dbPlayer.id}`);
        } else {
          // Add to tracking
          const addResponse = await axios.post(`${API_URL}/players/add`, {
            geoguessrId: player.geoguessrId,
            username: player.username
          });
          navigate(`/player/${addResponse.data.player.id}`, {
            state: { newlyAdded: !addResponse.data.alreadyTracked }
          });
        }
      } else {
        // Multiple players found - show selection modal
        setSearchResults(response.data.players);
        setLastSearchQuery(query);
        setShowSelectionModal(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Player "${query}" not found on GeoGuessr`);
      } else {
        setError('Failed to search player. Please try again.');
      }
    } finally {
      setSearching(false);
      setSearchUsername('');
    }
  };

  const addPopularPlayer = async (playerInfo) => {
    setAddingPlayer(playerInfo.username);
    setError(null);

    try {
      // Search for player in database by username
      const response = await axios.post(`${API_URL}/players/search`, {
        username: playerInfo.username
      });

      if (response.data.count > 0) {
        const player = response.data.players[0]; // Take first result
        if (player.isTracked && player.dbPlayer) {
          navigate(`/player/${player.dbPlayer.id}`);
        } else {
          // Add to tracking if not already tracked
          const addResponse = await axios.post(`${API_URL}/players/add`, {
            geoguessrId: player.geoguessrId,
            username: player.username
          });
          navigate(`/player/${addResponse.data.player.id}`, {
            state: { newlyAdded: !addResponse.data.alreadyTracked }
          });
        }
      } else {
        setError(`${playerInfo.username} not found on GeoGuessr`);
      }
    } catch (err) {
      setError(`Failed to load ${playerInfo.username}`);
      console.error(err);
    } finally {
      setAddingPlayer(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fadeIn">
        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
          Track GeoGuessr Performance
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Monitor competitive ratings, analyze trends, and compare players
        </p>
        
        {/* Search Section */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Search any player..."
              className="w-full px-5 py-3.5 pr-32 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500 transition-all duration-200"
              disabled={searching}
            />
            <button
              type="submit"
              disabled={searching}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-lg font-medium hover:bg-teal-500/20 dark:hover:bg-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {searching ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
        </form>
      </div>

      {/* Popular Players Section */}
      <div className="mb-16 animate-fadeIn">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 text-center">
          Popular Players
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Quick access to well-known competitors
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_PLAYERS.map((player) => (
            <button
              key={player.username}
              onClick={() => addPopularPlayer(player)}
              disabled={addingPlayer === player.username}
              className="card card-hover p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {player.username}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{player.description}</p>
                </div>
                <svg className={`w-5 h-5 ${addingPlayer === player.username ? 'text-gray-400 animate-pulse' : 'text-teal-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Auto Tracking</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Hourly rating updates</p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">History Charts</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Visualize progression</p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Compare</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Side-by-side analysis</p>
        </div>
      </div>

      {/* Player Selection Modal */}
      {showSelectionModal && (
        <PlayerSelectionModal
          players={searchResults}
          searchQuery={lastSearchQuery}
          onClose={() => setShowSelectionModal(false)}
        />
      )}
    </div>
  );
}

export default Home;
