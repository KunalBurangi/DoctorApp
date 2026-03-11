import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import DoctorDetails from './pages/DoctorDetails';
import ImageLibrary from './pages/ImageLibrary';
import { Image as ImageIcon, Users } from 'lucide-react';

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 font-inter selection:bg-indigo-500/30">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border-b border-gray-200 dark:border-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
              D
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              DoctorApp
            </h1>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Doctors
            </Link>
            <Link
              to="/images"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/images'
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Images
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctor/:id" element={<DoctorDetails />} />
          <Route path="/images" element={<ImageLibrary />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
