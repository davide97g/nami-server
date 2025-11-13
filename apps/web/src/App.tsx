import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import Chat from './Chat';

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          <Link
            to="/"
            className={`${
              location.pathname === '/'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            } py-4 px-1 border-b-2 border-transparent font-medium text-sm transition-colors`}
          >
            Dashboard
          </Link>
          <Link
            to="/chat"
            className={`${
              location.pathname === '/chat'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            } py-4 px-1 border-b-2 border-transparent font-medium text-sm transition-colors`}
          >
            Chat
          </Link>
        </div>
      </div>
    </nav>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;

