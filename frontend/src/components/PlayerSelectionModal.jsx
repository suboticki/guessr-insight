import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function PlayerSelectionModal({ players, onClose, searchQuery, onSelectPlayer }) {
  const [addingPlayerId, setAddingPlayerId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSelectPlayer = async (player) => {
    // If custom onSelectPlayer provided (e.g., from Compare page), use it
    if (onSelectPlayer) {
      setAddingPlayerId(player.geoguessrId);
      await onSelectPlayer(player);
      setAddingPlayerId(null);
      return;
    }

    // Default behavior: navigate to player detail
    if (player.isTracked && player.dbPlayer) {
      // Player already tracked, just navigate
      navigate(`/player/${player.dbPlayer.id}`);
      return;
    }

    // Add player to tracking
    setAddingPlayerId(player.geoguessrId);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/players/add`, {
        geoguessrId: player.geoguessrId,
        username: player.username
      });

      navigate(`/player/${response.data.player.id}`, {
        state: { newlyAdded: !response.data.alreadyTracked }
      });
    } catch (err) {
      setError('Failed to add player. Please try again.');
      console.error(err);
      setAddingPlayerId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 animate-slideUp">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Select Player
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Found {players.length} player{players.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Players List */}
        <div className="overflow-y-auto p-6 space-y-3" style={{ maxHeight: 'calc(80vh - 160px)' }}>
          {players.map((player) => (
            <button
              key={player.geoguessrId}
              onClick={() => handleSelectPlayer(player)}
              disabled={addingPlayerId === player.geoguessrId}
              className="w-full card card-hover p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {player.avatarUrl && (
                    <img 
                      src={player.avatarUrl}
                      alt={`${player.username}'s avatar`}
                      className="w-12 h-12 rounded-full border-2 border-teal-500/30 object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  {!player.avatarUrl && (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {player.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {player.username}
                      </h3>
                      {player.countryCode && (
                        <img 
                          src={`https://flagcdn.com/w40/${player.countryCode.toLowerCase()}.png`}
                          srcSet={`https://flagcdn.com/w80/${player.countryCode.toLowerCase()}.png 2x`}
                          alt={`${player.countryCode.toUpperCase()} flag`}
                          className="w-7 h-5 object-cover rounded shadow-sm"
                          title={player.countryCode.toUpperCase()}
                          style={{ imageRendering: 'crisp-edges' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      {player.isTracked && (
                        <span className="px-2 py-1 text-xs font-medium bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-md border border-teal-200 dark:border-teal-800">
                          Already Tracked
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                    {player.dbPlayer && (
                      <div className="flex items-center gap-3 text-sm">
                        <img 
                          src={`https://raw.githubusercontent.com/Matt-OP/geoleaderboard/main/division_icons/${player.dbPlayer.division}.png`}
                          alt={player.dbPlayer.division}
                          className="w-6 h-6"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <span className="font-semibold text-teal-600 dark:text-teal-400">
                          {player.dbPlayer.current_rating}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">{formatDivision(player.dbPlayer.division)}</span>
                      </div>
                    )}
                    {!player.dbPlayer && player.xp > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        XP: {player.xp.toLocaleString()}
                      </div>
                    )}
                    {player.accountCreated && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Account created: {new Date(player.accountCreated).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                    </div>
                  </div>
                </div>
                <div>
                  {addingPlayerId === player.geoguessrId ? (
                    <svg className="animate-spin h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerSelectionModal;
