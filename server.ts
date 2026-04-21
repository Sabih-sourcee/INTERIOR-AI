import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Validate API key is configured
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is not set!');
  console.error('Please set your Gemini API key before starting the server.');
  process.exit(1);
}

const API_KEY = process.env.GEMINI_API_KEY;
const IS_VERTEX_AI = API_KEY.startsWith('AQ.');

if (IS_VERTEX_AI) {
  console.log('Using Vertex AI / AI Platform API');
} else {
  console.log('Using Gemini API (AI Studio)');
}

// Initialize Gemini AI (server-side only - key never exposed to client)
const ai = IS_VERTEX_AI ? null : new GoogleGenAI({ apiKey: API_KEY });

// Helper function for Vertex AI API calls with OAuth
async function callVertexAI(model: string, contents: any, config?: any): Promise<any> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'able-brace-493911-d8';
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
  
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
  
  // Get OAuth access token from service account (works automatically in Cloud Run)
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken.token}`,
    },
    body: JSON.stringify({
      contents,
      generationConfig: config || {},
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vertex AI API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Room analysis endpoint
app.post('/api/analyze-room', async (req, res) => {
  try {
    const { base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ error: 'Missing base64Image in request body' });
    }

    const prompt = `
      TASK: Professional Interior Design Evolution & Spatial Optimization.
      
      1. Identify all core furniture (bed, wardrobe, desk, etc.).
      2. Analyze the room's current state, identifying clutter, poor flow, and aesthetic bottlenecks.
      3. PROPOSE A TRANSFORMATIVE REDESIGN: 
         - Mentally "clean" the room by removing transient clutter/mess.
         - Suggest a significant layout change that maximizes the "Aura" and "Vibe" of the space.
         - Focus on professional spatial principles: symmetry, light path optimization, and functional zoning.
      4. Maintain the soul of the original furniture while elevating the entire environment.
      
      REQUIRED RESPONSE FORMAT (JSON):
      {
        "analysis": "A high-level professional critique and vision for the spatial reconstruction.",
        "recommendations": [
          { 
            "item": "Specific Furniture Name", 
            "suggestedPosition": "Daring and precise new placement instruction", 
            "reason": "Professional design justification (e.g., 'Enhances natural light capture' or 'Creates a central focal point')" 
          }
        ]
      }
    `;

    let parsed: any;

    if (IS_VERTEX_AI) {
      // Use Vertex AI REST API
      const contents = [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: prompt }
          ]
        }
      ];

      const result = await callVertexAI("gemini-1.5-flash", contents, {
        responseMimeType: "application/json"
      });

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!text) {
        throw new Error("The AI returned an empty analysis.");
      }

      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanedText);
    } else {
      // Use Gemini SDK
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "";
      if (!text) {
        throw new Error("The AI returned an empty analysis.");
      }

      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanedText);
    }
    
    // Ensure recommendations is always an array
    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      parsed.recommendations = [];
    }
    
    res.json(parsed);
  } catch (error: any) {
    console.error("Room analysis failed:", error);
    
    if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      return res.status(429).json({ 
        error: "AI usage limit reached. Please wait a few seconds and try again." 
      });
    }
    
    res.status(500).json({ error: error.message || "Could not analyze the room. Please try again." });
  }
});

// Room redesign endpoint
app.post('/api/redesign-room', async (req, res) => {
  try {
    const { base64Original, analysis } = req.body;
    
    if (!base64Original || !analysis) {
      return res.status(400).json({ 
        error: 'Missing required fields: base64Original and analysis' 
      });
    }
    
    const prompt = `
      INSTRUCTIONS: High-Fidelity Furniture Repositioning & Room Reconstruction.
      
      Based on the original room image and this analysis: "${analysis}", generate a reconstructed visual.
      
      CORE COMMANDS:
      1. STRICT PROPERTY PRESERVATION: Each piece of furniture (Bed, Chair, Desk, Mirror, Wardrobe, Stands, etc.) MUST keep its original design, color, materials, and features. Do NOT replace them with different models.
      2. SPATIAL REARRANGEMENT: Move the identified furniture to the new optimized positions suggested in the analysis.
      3. CLEANING & CLARITY: Remove all transient clutter (mess, loose items, garbage) to ensure the image is high-definition, clear, and professional.
      4. BEDSHEET EXCEPTION: You are permitted to change the Bedding/Bedsheet to a more premium or organized style that complements the new room aura.
      5. FAITHFUL RECONSTRUCTION: The room should look like the same room, with the same floor, walls, and architectural anchors, just organized and optimized for its "Aura".
      
      OUTPUT: A crystal-clear, high-quality photograph of the redesigned room.
    `;

    let imageData: string | null = null;

    if (IS_VERTEX_AI) {
      // Use Vertex AI REST API
      const contents = [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Original } },
            { text: prompt }
          ]
        }
      ];

      const result = await callVertexAI("gemini-2.0-flash-exp-image-generation", contents, {
        responseModalities: ["TEXT", "IMAGE"]
      });

      const candidates = result.candidates || [];
      if (candidates.length === 0) {
        throw new Error("No response from AI model.");
      }

      const parts = candidates[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          imageData = part.inlineData.data;
          break;
        }
      }

      if (!imageData && result.candidates[0]?.finishReason === 'SAFETY') {
        return res.status(400).json({ 
          error: "The request was blocked by safety filters." 
        });
      }
    } else {
      // Use Gemini SDK
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            { inlineData: { data: base64Original, mimeType: "image/jpeg" } },
            { text: prompt }
          ]
        }
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("The AI model did not return any results.");
      }

      const candidate = response.candidates[0];
      if (!candidate.content || !candidate.content.parts) {
        throw new Error("The AI returned an empty response.");
      }

      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          imageData = part.inlineData.data;
          break;
        }
      }

      if (!imageData && candidate.finishReason === 'SAFETY') {
        return res.status(400).json({ 
          error: "The request was blocked by safety filters." 
        });
      }
    }

    if (!imageData) {
      throw new Error("The AI did not generate a redesigned image.");
    }

    return res.json({ 
      imageUrl: `data:image/png;base64,${imageData}` 
    });

  } catch (error: any) {
    console.error("Image generation failed:", error);
    
    if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      return res.status(429).json({ 
        error: "AI usage limit reached. Please wait a few seconds and try again." 
      });
    }

    res.status(500).json({ 
      error: error.message || "Failed to generate redesigned room image." 
    });
  }
});

// Serve index.html for all non-API routes (SPA support)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🔒 Gemini API Key: ${process.env.GEMINI_API_KEY ? 'Configured ✓' : 'MISSING ✗'}`);
});
