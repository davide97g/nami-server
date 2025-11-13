import OpenAI from "openai";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  conversationId: string;
}

const DEFAULT_CONVERSATION_ID = "default";

// Validate API key
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error(
    "❌ ERROR: OPENAI_API_KEY environment variable is not set!"
  );
  console.error(
    "   Please create a .env file in apps/server/ with: OPENAI_API_KEY=your_key_here"
  );
}

// Initialize OpenAI client
const openai = apiKey
  ? new OpenAI({
      apiKey: apiKey,
    })
  : null;

// In-memory message storage
const messagesStore = new Map<string, Message[]>();

// Generate unique ID for messages
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get messages for a conversation
export const getMessages = (conversationId?: string): Message[] => {
  const id = conversationId || DEFAULT_CONVERSATION_ID;
  return messagesStore.get(id) || [];
};

// Send a message and get LLM response
export const sendMessage = async (
  message: string,
  conversationId?: string
): Promise<Message> => {
  const id = conversationId || DEFAULT_CONVERSATION_ID;

  // Get existing messages for this conversation
  const existingMessages = messagesStore.get(id) || [];

  // Create user message
  const userMessage: Message = {
    id: generateId(),
    role: "user",
    content: message,
    timestamp: new Date(),
    conversationId: id,
  };

  // Add user message to store
  existingMessages.push(userMessage);
  messagesStore.set(id, existingMessages);

  // Check if OpenAI client is initialized
  if (!openai) {
    throw new Error(
      "OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable."
    );
  }

  // Prepare messages for OpenAI API (convert to OpenAI format)
  const openaiMessages = existingMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // Call OpenAI API
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: openaiMessages as any,
  });

  // Extract assistant response
  const assistantContent =
    completion.choices[0]?.message?.content || "No response generated";

  // Create assistant message
  const assistantMessage: Message = {
    id: generateId(),
    role: "assistant",
    content: assistantContent,
    timestamp: new Date(),
    conversationId: id,
  };

  // Add assistant message to store
  existingMessages.push(assistantMessage);
  messagesStore.set(id, existingMessages);

  return assistantMessage;
};
