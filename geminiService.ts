import { GoogleGenAI, Chat, GenerateContentResponse, LiveSession, Modality } from "@google/genai";
import { MinerStats } from "../types";

const BASE_SYSTEM_INSTRUCTION = `
You are a highly intelligent, general-purpose AI assistant integrated into "Bitaxe Sentry".

Your Core Capabilities:
1. **High IQ Reasoning**: You can think deeply to solve complex problems.
2. **General Knowledge**: You can answer ANY question on ANY topic (history, science, coding, cooking, current events, etc.) using your internal knowledge and Google Search.
3. **Mining Specialist**: You possess deep expert knowledge of Bitcoin mining and Bitaxe hardware (Gamma, Supra, Hex, GT 800).

Bitaxe Specifics:
- Hardware: ESP32-S3 + BM1366/BM1368 ASICs.
- OS: AxeOS.
- Tuning: Frequency (MHz) and Voltage (mV).
- Common Issues: Heat (>65C is warning), low efficiency (>35 J/TH is poor), Wifi drops.

Interaction Style:
- Be helpful, concise, and smart.
- If the user asks about mining, use your expert knowledge.
- If the user asks about anything else, answer it fully and accurately.
- Use Markdown for formatting.

SPECIAL CAPABILITY: FLEET ANALYSIS
You will receive real-time [FLEET_TELEMETRY] in the user's message context.
- **Top Performer**: The miner with the highest Hashrate is the King.
- **Efficiency**: Lower J/TH is better.
- **The Brutal Truth**: If the user asks "who is the best", "compare them", or "tell me the truth", switch to a "Brutal Truth" persona.
  - Lavishly praise the top performer (e.g., "absolute silicon lottery winner", "carrying this operation").
  - Ruthlessly roast the worst performer (e.g., "glorified space heater", "doing the bare minimum").
  - Compare their stats directly to justify your roast.
`;

let aiClient: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

// Audio Decoding Helpers for TTS
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const createBitaxeChat = (userName?: string, useDeepThink: boolean = false): Chat => {
  const client = getClient();
  const personalizedInstruction = userName 
    ? `${BASE_SYSTEM_INSTRUCTION}\nYou are talking to ${userName}. Address them by name occasionally.` 
    : BASE_SYSTEM_INSTRUCTION;

  if (useDeepThink) {
    // Deep Think Mode: Gemini 3 Pro Preview with Max Thinking Budget
    return client.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: personalizedInstruction,
        // Max thinking budget for deep reasoning. No maxOutputTokens set.
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
  }

  // Standard Mode: Gemini 2.5 Flash
  return client.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: personalizedInstruction,
      temperature: 0.7,
      // Enable Google Search to answer "ANY" question with up-to-date info
      tools: [{ googleSearch: {} }],
      // Enable Light Thinking for quick reasoning
      thinkingConfig: { thinkingBudget: 2048 }
    }
  });
};

export const sendMessageStream = async (chat: Chat, message: string) => {
  return await chat.sendMessageStream({ message });
};

export const generateSpeech = async (text: string): Promise<AudioBufferSourceNode> => {
    const client = getClient();
    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, authoritative voice
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated");

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
        return source;

    } catch (e) {
        console.error("TTS generation failed", e);
        throw e;
    }
};

export const analyzeMinerStats = async (stats: MinerStats): Promise<string> => {
  const client = getClient();
  const prompt = `You are the Bitaxe Sentry AI. Analyze this miner's telemetry:
  - Hashrate: ${stats.hashrate.toFixed(1)} GH/s
  - Temp: ${stats.temp.toFixed(1)} °C
  - Power: ${stats.power.toFixed(1)} W
  - Efficiency: ${stats.efficiency} J/TH
  - Rejects: ${stats.sharesRejected}
  
  Provide a professional, concise engineering assessment (max 3 sentences). 
  Focus on thermal efficiency and stability. 
  If temp > 65C, strictly advise cooling improvements.
  If Efficiency > 30 J/TH, suggest undervolting.
  Use a technical but helpful tone.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Analysis failed.";
  } catch (e) {
    console.error(e);
    return "Could not complete analysis.";
  }
};

export const analyzeProfitability = async (stats: MinerStats): Promise<string> => {
    const client = getClient();
    const prompt = `
    Context: Bitaxe Miner running at ${stats.hashrate.toFixed(0)} GH/s, consuming ${stats.power.toFixed(0)} Watts.
    
    Task: 
    1. Use Google Search to find the current Bitcoin Price (USD) and current Network Difficulty.
    2. Estimate daily revenue in USD.
    3. Calculate daily electricity cost assuming $0.12/kWh (average).
    4. Provide a very concise 2-sentence financial summary. Example: "At $95k BTC, you are generating $0.12/day. With power costs, you are running at a loss/profit of $X."
    `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text || "Unable to fetch market data.";
    } catch (e) {
        console.error(e);
        return "Market analysis unavailable.";
    }
}

export const editRigImage = async (base64Image: string, prompt: string): Promise<string> => {
  const client = getClient();
  try {
    // Strip data url prefix if present to get raw base64
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      }
    });
    
    // Extract image from response
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image returned from model");
  } catch (e) {
    console.error("Image edit failed", e);
    throw e;
  }
};

export const getLiveClient = (): GoogleGenAI => {
  return getClient();
};