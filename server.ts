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

// Helper function for Vertex AI API calls with OAuth Bearer token
async function callVertexAI(model: string, contents: any, config?: any, isImageGeneration: boolean = false): Promise<any> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'able-brace-493911-d8';
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
  
  // Use regional endpoint with Bearer token (proper Vertex AI format)
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
  
  // Get OAuth access token from service account
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  
  const requestBody: any = {
    contents,
    generationConfig: config || {},
  };
  
  // Add imageConfig for image generation tasks
  if (isImageGeneration) {
    requestBody.generationConfig.imageConfig = {
      aspectRatio: "16:9"
    };
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken.token}`,
    },
    body: JSON.stringify(requestBody),
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
      TASK: Professional Interior Design Transformation & Spatial Optimization

You are a professional interior designer with full creative authority over this space.

PHASE 1 — SPATIAL AUDIT
1. Catalog all existing furniture and decor elements (bed, wardrobe, desk, chairs, mirrors, lighting fixtures, decorative items, etc.).
2. Assess the room's current state across these dimensions:
   - Traffic flow and circulation paths
   - Natural and artificial light distribution
   - Clutter density and visual noise
   - Proportional balance and spatial harmony
   - Functional zoning effectiveness

PHASE 2 — DESIGN AUTHORITY & DECISION MAKING
You have full creative authority to:
   - Remove any furniture or decor elements that compromise the design vision
   - Reposition any item (bed, wardrobe, desk, chairs, mirrors, shelving, lighting)
   - Declutter and strip the space down to its essential, intentional elements
   - Reimagine the room from the ground up if necessary

PHASE 3 — TRANSFORMATIVE REDESIGN
Propose a complete redesign grounded in the following principles:
   - Minimalism: retain only what is functional or intentionally decorative
   - Symmetry & Visual Balance: create deliberate compositional harmony
   - Light Path Optimization: position furniture to maximize natural light and avoid blocking it
   - Functional Zoning: clearly define sleep, work, and relaxation zones
   - Negative Space: use empty space as a design element, not a gap to fill
   - Aesthetic Cohesion: ensure all retained elements speak the same visual language

PHASE 4 — OUTPUT
Generate a photorealistic render of the redesigned room that clearly reflects:
   - A clean, minimal, and breathable aesthetic
   - Deliberate furniture placement with intentional spacing
   - A visually elevated environment that feels curated, not decorated
   - Warm or neutral tones that enhance the sense of calm and order
   - A space that looks like it belongs in an architecture or lifestyle magazine.
      
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

      const result = await callVertexAI("gemini-2.5-flash-lite", contents, {
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
      INSTRUCTIONS: Professional Interior Space Optimization & Furniture Repositioning.
      
      Based on the original room image and this analysis: "${analysis}", create a redesigned room visualization.
      
      CRITICAL REQUIREMENTS:
      
      1. FURNITURE REPOSITIONING (MOST IMPORTANT):
         - Identify every piece of furniture in the room (bed, wardrobe, desk, chair, mirror, nightstands, shelves, etc.)
         - Physically MOVE each furniture item to a new, more optimal position
         - Create better flow and space utilization
         - Arrange furniture for maximum aesthetic appeal and functionality
         - DO NOT just enhance image quality - ACTUALLY REPOSITION the furniture
      
      2. INTELLIGENT FURNITURE CURATION & PLACEMENT:
         - Keep good furniture: Maintain the EXACT same design, color, material, size
         - DO NOT replace furniture with different models
         - For OLD or WORN-OUT furniture: Reposition it to a less prominent location where it blends better
         - For EXTRA or CLUTTERING furniture: Either reposition it optimally OR remove it entirely if it improves room aesthetics
         - Goal: Create the most visually appealing and spacious room layout - prioritize aesthetics over keeping everything
      
      3. ROOM CLEANING & ORGANIZATION:
         - Organize and tidy up loose items (books, clothes, papers)
         - Neatly arrange items on surfaces
         - Make the bed properly
         - Ensure cables/items are neatly placed
         - DO NOT remove items - just organize them beautifully
      
      4. AESTHETIC ENHANCEMENT:
         - Optimize lighting and shadows naturally
         - Ensure the room looks professionally designed
         - Maintain the same room structure (walls, floor, windows)
         - Create a cohesive, magazine-worthy interior design
      
      5. OUTPUT SPECIFICATIONS:
         - Generate a high-resolution, photorealistic image
         - Same camera angle/perspective as original
         - Show the room AFTER furniture has been repositioned
         - Professional real-estate photography quality
      
      THE RESULT SHOULD SHOW THE SAME FURNITURE IN NEW, BETTER POSITIONS WITH A CLEAN, ORGANIZED, AESTHETIC ROOM.
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

      const result = await callVertexAI("gemini-2.5-flash-image", contents, {
        responseModalities: ["TEXT", "IMAGE"]
      }, true);

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
