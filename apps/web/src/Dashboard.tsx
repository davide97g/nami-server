import { useState, useEffect, useRef } from 'react';
import { getServerUrl, getWebSocketUrl } from './config';

const Dashboard = () => {
  const [status, setStatus] = useState<string>('Loading...');
  const [info, setInfo] = useState<any>(null);
  const [message, setMessage] = useState<string>('');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [lastSentMessage, setLastSentMessage] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const serverUrl = getServerUrl();
    const wsUrl = getWebSocketUrl();

    const fetchStatus = async () => {
      try {
        const response = await fetch(`${serverUrl}/`);
        const text = await response.text();
        setStatus(text);
      } catch (error) {
        setStatus('Server not available');
      }
    };

    const fetchInfo = async () => {
      try {
        const response = await fetch(`${serverUrl}/info`);
        const data = await response.json();
        setInfo(data);
      } catch (error) {
        console.error('Failed to fetch info:', error);
      }
    };

    fetchStatus();
    fetchInfo();

    // Connect to WebSocket
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSendMessage = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('WebSocket is not connected');
      return;
    }

    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    wsRef.current.send(message);
    setLastSentMessage(message);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Nami Server Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Server Status</h2>
          <p className="text-gray-600 mb-2">{status}</p>
          {info?.version && (
            <p className="text-sm text-gray-500">
              <span className="font-medium">Version:</span> {info.version}
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Send Message to ESP32</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter message to send..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Message input"
            />
            <button
              onClick={handleSendMessage}
              disabled={!wsConnected}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Send message"
            >
              Send
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600">
              WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {lastSentMessage && (
            <p className="mt-2 text-sm text-gray-500">
              Last sent: <span className="font-medium">{lastSentMessage}</span>
            </p>
          )}
        </div>

        {info && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">System Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">System</h3>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  <p><span className="font-medium">Hostname:</span> {info.system?.hostname}</p>
                  <p><span className="font-medium">Platform:</span> {info.system?.platform}</p>
                  <p><span className="font-medium">Architecture:</span> {info.system?.arch}</p>
                  <p><span className="font-medium">Uptime:</span> {Math.floor((info.system?.uptime || 0) / 60)} minutes</p>
                </div>
              </div>

              {info.cpu && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">CPU</h3>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <p><span className="font-medium">Model:</span> {info.cpu.model}</p>
                    <p><span className="font-medium">Cores:</span> {info.cpu.cores}</p>
                    <p><span className="font-medium">Speed:</span> {info.cpu.speed} MHz</p>
                  </div>
                </div>
              )}

              {info.memory && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Memory</h3>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <p><span className="font-medium">Total:</span> {(info.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB</p>
                    <p><span className="font-medium">Used:</span> {(info.memory.used / 1024 / 1024 / 1024).toFixed(2)} GB</p>
                    <p><span className="font-medium">Free:</span> {(info.memory.free / 1024 / 1024 / 1024).toFixed(2)} GB</p>
                  </div>
                </div>
              )}

              {info.raspberryPi && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Raspberry Pi</h3>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    {info.raspberryPi.model && <p><span className="font-medium">Model:</span> {info.raspberryPi.model}</p>}
                    {info.raspberryPi.deviceModel && <p><span className="font-medium">Device Model:</span> {info.raspberryPi.deviceModel}</p>}
                    {info.raspberryPi.temperature && (
                      <p><span className="font-medium">Temperature:</span> {info.raspberryPi.temperature.celsius.toFixed(1)}°C</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

