import { RequestHandler } from "express";

export const handleCutoffs: RequestHandler = async (req, res) => {
  try {
    // Fetch data from Google Drive
    const response = await fetch('https://drive.google.com/uc?export=download&id=1j2VzL9OBR8rVb5DD_4wgvIlE7bCzVI-n');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Drive: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching cutoffs data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cutoffs data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
