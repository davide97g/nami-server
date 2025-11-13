import { useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Chat from "./Chat";
import { getServerUrl } from "./config";
import Dashboard from "./Dashboard";
import Pokemon from "./Pokemon";

const Navigation = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRandomAsciiArt = async () => {
    setIsLoading(true);
    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/ascii-art`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate ASCII art");
      }

      const data = await response.json();
      if (data.success) {
        console.log("ASCII art sent to device");
      } else {
        throw new Error(data.error || "Failed to send ASCII art");
      }
    } catch (error) {
      console.error("Error generating ASCII art:", error);
      alert("Failed to generate ASCII art. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`${
                location.pathname === "/"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              } py-4 px-1 border-b-2 border-transparent font-medium text-sm transition-colors`}
            >
              Dashboard
            </Link>
            <Link
              to="/chat"
              className={`${
                location.pathname === "/chat"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              } py-4 px-1 border-b-2 border-transparent font-medium text-sm transition-colors`}
            >
              Chat
            </Link>
            <Link
              to="/pokemon"
              className={`${
                location.pathname === "/pokemon"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              } py-4 px-1 border-b-2 border-transparent font-medium text-sm transition-colors`}
            >
              Pokemon
            </Link>
          </div>
          <button
            onClick={handleRandomAsciiArt}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm font-medium"
            aria-label="Generate random ASCII art"
          >
            {isLoading ? "Generating..." : "Random ASCII Art"}
          </button>
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
          <Route path="/pokemon" element={<Pokemon />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
