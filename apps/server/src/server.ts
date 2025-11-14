// Load environment variables (for Node.js compatibility)
// Bun automatically loads .env files, but this ensures compatibility
import "dotenv/config";

import cors from "cors";
import express from "express";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import http from "http";
import OpenAI from "openai";
import os from "os";
import { WebSocket, WebSocketServer } from "ws";
import packageJson from "../package.json" assert { type: "json" };
import { getMessages, sendMessage } from "./chat/chat.js";
import {
  getPokemonBitmap,
  getPokemonSmallestSprite,
} from "./pokemon/pokemon.js";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Helper function to get Raspberry Pi information
const getRaspberryPiInfo = async () => {
  const info: Record<string, any> = {
    version: packageJson.version,
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
    },
    cpu: {
      model: os.cpus()[0]?.model || "Unknown",
      cores: os.cpus().length,
      speed: os.cpus()[0]?.speed || 0,
    },
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
    },
    network: os.networkInterfaces(),
  };

  // Try to get Raspberry Pi specific information
  try {
    // Read CPU info for Raspberry Pi model
    if (existsSync("/proc/cpuinfo")) {
      const cpuInfo = await readFile("/proc/cpuinfo", "utf-8");
      const modelMatch = cpuInfo.match(/Model\s*:\s*(.+)/i);
      const revisionMatch = cpuInfo.match(/Revision\s*:\s*(.+)/i);
      const serialMatch = cpuInfo.match(/Serial\s*:\s*(.+)/i);

      if (modelMatch) {
        info.raspberryPi = {
          ...info.raspberryPi,
          model: modelMatch[1].trim(),
        };
      }
      if (revisionMatch) {
        info.raspberryPi = {
          ...info.raspberryPi,
          revision: revisionMatch[1].trim(),
        };
      }
      if (serialMatch) {
        info.raspberryPi = {
          ...info.raspberryPi,
          serial: serialMatch[1].trim(),
        };
      }
    }

    // Try to read device tree model
    if (existsSync("/proc/device-tree/model")) {
      const model = await readFile("/proc/device-tree/model", "utf-8");
      info.raspberryPi = {
        ...info.raspberryPi,
        deviceModel: model.trim(),
      };
    }

    // Try to read CPU temperature
    if (existsSync("/sys/class/thermal/thermal_zone0/temp")) {
      const temp = await readFile(
        "/sys/class/thermal/thermal_zone0/temp",
        "utf-8"
      );
      const tempCelsius = parseInt(temp.trim(), 10) / 1000;
      info.raspberryPi = {
        ...info.raspberryPi,
        temperature: {
          celsius: tempCelsius,
          fahrenheit: (tempCelsius * 9) / 5 + 32,
        },
      };
    }
  } catch (error) {
    // If we can't read Raspberry Pi specific files, continue without them
    console.warn(
      "Could not read some Raspberry Pi specific information:",
      error
    );
  }

  return info;
};

// REST endpoints
app.get("/", (req, res) => {
  res.send("✅ Server running");
});

app.get("/info", async (req, res) => {
  try {
    const info = await getRaspberryPiInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve system information" });
  }
});

// Chat API endpoints
app.post("/api/chat/messages", async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Message is required and must be a string" });
    }

    const assistantMessage = await sendMessage(message, conversationId);
    res.json(assistantMessage);
  } catch (error: any) {
    console.error("Error sending chat message:", error);
    res.status(500).json({
      error: "Failed to send message",
      message: error.message || "Unknown error",
    });
  }
});

app.get("/api/chat/messages", (req, res) => {
  try {
    const conversationId = req.query.conversationId as string | undefined;
    const messages = getMessages(conversationId);
    res.json(messages);
  } catch (error: any) {
    console.error("Error getting chat messages:", error);
    res.status(500).json({
      error: "Failed to retrieve messages",
      message: error.message || "Unknown error",
    });
  }
});

// Initialize OpenAI client for ASCII art generation
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey
  ? new OpenAI({
      apiKey: openaiApiKey,
    })
  : null;

// Pokemon API endpoint
app.post("/api/pokemon/smallest-sprite", async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || typeof id !== "number") {
      return res.status(400).json({
        success: false,
        error: "Pokemon ID is required and must be a number",
      });
    }

    const result = await getPokemonSmallestSprite(id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error getting Pokemon smallest sprite:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get Pokemon smallest sprite",
      message: error.message || "Unknown error",
    });
  }
});

// Pokemon Bitmap API endpoint
app.post("/api/pokemon/bitmap", async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || typeof id !== "number") {
      return res.status(400).json({
        success: false,
        error: "Pokemon ID is required and must be a number",
      });
    }

    const result = await getPokemonBitmap(id);

    // Send bitmap data to all connected ESP32 clients via WebSocket
    const pokemonMessage = JSON.stringify({
      type: "pokemon_bitmap",
      data: {
        pokemonId: result.pokemonId,
        pokemonName: result.pokemonName,
        width: result.width,
        height: result.height,
        bitmapData: result.bitmapData,
      },
    });

    let sentToEsp32 = false;
    esp32Clients.forEach((esp32Client) => {
      if (esp32Client.readyState === WebSocket.OPEN) {
        esp32Client.send(pokemonMessage);
        sentToEsp32 = true;
      }
    });

    if (sentToEsp32) {
      console.log(
        `[Pokemon] Sent bitmap for Pokemon #${result.pokemonId} (${result.pokemonName}) to ESP32 clients`
      );
    }

    res.json({
      success: true,
      data: result,
      sentToEsp32,
    });
  } catch (error: any) {
    console.error("Error getting Pokemon bitmap:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get Pokemon bitmap",
      message: error.message || "Unknown error",
    });
  }
});

// ASCII Art API endpoint
app.post("/api/ascii-art", async (req, res) => {
  try {
    // Check if OpenAI is configured
    if (!openai) {
      return res.status(500).json({
        success: false,
        error: "OpenAI API key is not configured",
      });
    }

    // Fixed prompt for ASCII art generation
    const prompt =
      "Create a random, creative ASCII art. Make it interesting and visually appealing. Keep it reasonably sized (not too large). Only return the ASCII art itself, no explanations or additional text.";

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    const asciiArt =
      completion.choices[0]?.message?.content || "No ASCII art generated";

    // Send ASCII art to all connected ESP32 clients via WebSocket
    let sent = false;
    esp32Clients.forEach((esp32Client) => {
      if (esp32Client.readyState === WebSocket.OPEN) {
        esp32Client.send(asciiArt);
        sent = true;
      }
    });

    if (!sent) {
      return res.status(503).json({
        success: false,
        error: "No ESP32 clients connected",
      });
    }

    res.json({
      success: true,
      message: "ASCII art sent to device",
    });
  } catch (error: any) {
    console.error("Error generating ASCII art:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate ASCII art",
      message: error.message || "Unknown error",
    });
  }
});

// WebSocket server
const wss = new WebSocketServer({ server });

// Track connected clients
const webClients = new Set<WebSocket>();
const esp32Clients = new Set<WebSocket>();

wss.on("connection", (ws: WebSocket, req) => {
  console.log("🔌 WebSocket client connected");

  // Check user-agent or origin to identify client type
  const userAgent = req.headers["user-agent"] || "";
  const origin = req.headers["origin"] || "";

  // Default to web client, will be updated if ESP32 identifies itself
  let clientType: "web" | "esp32" | "unknown" = "unknown";

  // Check if it's an ESP32 client by user-agent or origin
  if (
    userAgent.includes("ESP32") ||
    userAgent.includes("arduino") ||
    origin.includes("esp32")
  ) {
    clientType = "esp32";
    esp32Clients.add(ws);
    console.log(
      "📱 ESP32 client connected. Total ESP32 clients:",
      esp32Clients.size
    );
  } else {
    // Assume web client for browser connections
    clientType = "web";
    webClients.add(ws);
    console.log("🌐 Web client connected. Total web clients:", webClients.size);
  }

  // Store client type on the WebSocket object for later reference
  (ws as any).clientType = clientType;

  ws.on("message", (message: Buffer) => {
    const messageStr = message.toString();
    console.log("📨 Received message:", messageStr);

    // Check if this is an identification message from ESP32
    try {
      const parsed = JSON.parse(messageStr);
      if (parsed.type === "identify" && parsed.client === "ESP32") {
        // Reclassify as ESP32 client
        webClients.delete(ws);
        esp32Clients.add(ws);
        (ws as any).clientType = "esp32";
        console.log(
          "📱 Client identified as ESP32. Total ESP32 clients:",
          esp32Clients.size
        );
        return;
      }
    } catch (e) {
      // Not JSON, continue with normal message handling
    }

    // If message is from a web client, forward to all ESP32 clients
    if (webClients.has(ws) || (ws as any).clientType === "web") {
      console.log("📤 Forwarding message to ESP32 clients...");
      let forwarded = false;
      esp32Clients.forEach((esp32Client) => {
        if (esp32Client.readyState === WebSocket.OPEN) {
          esp32Client.send(messageStr);
          forwarded = true;
        }
      });

      if (!forwarded) {
        console.log("⚠️  No ESP32 clients connected to forward message to");
        // Send acknowledgment back to web client
        ws.send(
          JSON.stringify({
            status: "error",
            message: "No ESP32 clients connected",
          })
        );
      } else {
        // Send success acknowledgment back to web client
        ws.send(
          JSON.stringify({
            status: "success",
            message: "Message forwarded to ESP32",
          })
        );
      }
    } else if (esp32Clients.has(ws) || (ws as any).clientType === "esp32") {
      // Message from ESP32 - could be used for bidirectional communication
      console.log("📱 Message from ESP32:", messageStr);
      // Optionally broadcast to web clients
      webClients.forEach((webClient) => {
        if (webClient.readyState === WebSocket.OPEN) {
          webClient.send(
            JSON.stringify({
              type: "esp32",
              message: messageStr,
            })
          );
        }
      });
    }
  });

  ws.on("close", () => {
    if (webClients.has(ws)) {
      webClients.delete(ws);
      console.log(
        "🌐 Web client disconnected. Remaining web clients:",
        webClients.size
      );
    } else if (esp32Clients.has(ws)) {
      esp32Clients.delete(ws);
      console.log(
        "📱 ESP32 client disconnected. Remaining ESP32 clients:",
        esp32Clients.size
      );
    }
  });

  ws.on("error", (error: Error) => {
    console.error("❌ WebSocket error:", error);
    // Clean up on error
    webClients.delete(ws);
    esp32Clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 HTTP server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
});
