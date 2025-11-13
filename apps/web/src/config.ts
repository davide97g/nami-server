/**
 * Server configuration based on environment
 * In dev mode: uses localhost:3000
 * In production: uses VITE_SERVER_URL or defaults to https://nami.davideghiotto.it
 */
export const getServerUrl = (): string => {
  if (import.meta.env.DEV) {
    return "http://localhost:3000";
  }

  return import.meta.env.VITE_SERVER_URL || "https://nami.davideghiotto.it";
};

export const getWebSocketUrl = (): string => {
  const serverUrl = getServerUrl();
  // Convert http:// to ws:// and https:// to wss://
  return serverUrl.replace(/^http/, "ws");
};
