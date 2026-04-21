export interface RoomAnalysis {
  analysis: string;
  recommendations: {
    item: string;
    suggestedPosition: string;
    reason: string;
  }[];
}

const API_BASE = '/api';

export async function analyzeRoom(base64Image: string): Promise<RoomAnalysis> {
  try {
    const response = await fetch(`${API_BASE}/analyze-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    
    // Ensure recommendations is always an array
    if (!data.recommendations || !Array.isArray(data.recommendations)) {
      data.recommendations = [];
    }
    
    return data;
  } catch (error: any) {
    console.error("Room analysis failed:", error);
    throw new Error(error.message || "Could not analyze the room. Please try again.");
  }
}

export async function generateRedesignedRoom(base64Original: string, analysis: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/redesign-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Original, analysis }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.imageUrl) {
      throw new Error("Server did not return an image URL");
    }
    
    return data.imageUrl;
  } catch (error: any) {
    console.error("Image generation failed:", error);
    throw new Error(error.message || "Failed to generate redesigned room image. Please try again.");
  }
}
