import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import TrackedPlayers from './pages/TrackedPlayers';
import Compare from './pages/Compare';
import PlayerDetail from './pages/PlayerDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        {/* Navigation */}
        <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 mb-8 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  🌍 Guessr Insight
                </Link>
              </div>
              <div className="flex items-center space-x-1">
                <NavLink 
                  to="/"
                  end
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink 
                  to="/tracked" 
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                    }`
                  }
                >
                  Tracked
                </NavLink>
                <NavLink 
                  to="/compare" 
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                    }`
                  }
                >
                  Compare
                </NavLink>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tracked" element={<TrackedPlayers />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/player/:id" element={<PlayerDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
