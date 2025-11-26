import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Compare from './pages/Compare';
import PlayerDetail from './pages/PlayerDetail';
import { useTheme } from './context/ThemeContext';

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-[#001223]">
        {/* Navigation */}
        <nav className="bg-white dark:bg-[#001223] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-2">
                <svg className="w-8 h-8" viewBox="0 0 210 207" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 C11.816141 12.28707416 17.86908215 27.65195026 18.3125 44.625 C17.42988618 68.52618236 5.40604269 84.66520064 -8.10498047 103.22851562 C-11.70988798 108.18486597 -15.23241937 113.18817745 -18.6875 118.25 C-23.27700819 124.97241564 -27.97027099 131.61233026 -32.72216797 138.22070312 C-35.02984323 141.43398882 -37.32662355 144.65506024 -39.625 147.875 C-40.47131003 149.05992736 -41.3176599 150.24482626 -42.1640625 151.4296875 C-42.76992187 152.27789062 -43.37578125 153.12609375 -44 154 C-47.30924463 153.44061046 -48.65497097 152.66485971 -50.62890625 149.96484375 C-51.10070312 149.32877197 -51.5725 148.6927002 -52.05859375 148.03735352 C-52.55488281 147.34440186 -53.05117187 146.6514502 -53.5625 145.9375 C-54.0884375 145.21941162 -54.614375 144.50132324 -55.15625 143.76147461 C-59.63316263 137.61041675 -63.94695794 131.34781815 -68.2265625 125.05859375 C-71.06916876 120.88547022 -73.96326753 116.75011283 -76.875 112.625 C-77.36838867 111.9247168 -77.86177734 111.22443359 -78.37011719 110.50292969 C-81.00105767 106.78156714 -83.66273583 103.0862988 -86.3671875 99.41796875 C-100.97228202 79.57906698 -112.73596674 60.23914248 -109.57421875 34.5390625 C-106.54101665 17.97740688 -97.60607138 3.03299872 -84 -7 C-57.27151954 -25.15229177 -23.60212992 -21.94998082 0 0 Z" fill="#00A78F" transform="translate(151,30)"/>
                  <path d="M0 0 C3.98249601 3.24952128 6.96363464 6.90632121 9.6875 11.25 C10.10257812 11.89324219 10.51765625 12.53648438 10.9453125 13.19921875 C15.2275474 21.05996463 14.81557714 30.84991473 13.02734375 39.41015625 C9.32456522 50.80702003 2.14207777 57.74923561 -8.3125 63.25 C-16.39947411 66.75944159 -26.72083672 66.40742082 -35.0625 63.8125 C-44.97198469 59.67624017 -51.79664226 51.72477072 -56.2734375 42.20703125 C-59.93941221 32.9748289 -59.42877423 22.89929398 -55.625 13.8125 C-50.56269719 3.92895641 -43.10924422 -1.80046949 -33 -6.1875 C-20.90223759 -8.03292138 -10.21798575 -7.06953267 0 0 Z" fill="#021424" transform="translate(127.3125,45.75)"/>
                  <path d="M0 0 C6.12736781 3.21300631 10.15179142 6.91822257 12.69921875 13.46875 C14.40162455 22.44507148 13.27687927 28.79979723 8.19921875 36.34375 C3.25932641 41.17386695 -1.15653341 43.30468846 -8.11328125 43.59375 C-15.65361742 43.26047547 -20.34734206 40.72895305 -25.48828125 35.28125 C-29.75322606 29.9841496 -30.83858764 25.39648998 -30.55078125 18.65625 C-29.79651758 12.33604059 -27.63663069 7.75244107 -22.83203125 3.52734375 C-16.0902379 -1.48615088 -8.03966565 -2.78804549 0 0 Z" fill="#FBFBFB" transform="translate(113.61328125,53.90625)"/>
                </svg>
                <Link to="/" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Guessr <span className="text-teal-500">Insight</span>
                </Link>
              </div>
              <div className="flex items-center space-x-1">
                <NavLink 
                  to="/"
                  end
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink 
                  to="/compare" 
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  Compare
                </NavLink>
                <button
                  onClick={toggleTheme}
                  className="ml-2 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/player/:id" element={<PlayerDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
