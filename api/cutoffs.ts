export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch data from Google Drive
    const response = await fetch(
      "https://drive.google.com/uc?export=download&id=1j2VzL9OBR8rVb5DD_4wgvIlE7bCzVI-n",
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Drive: ${response.status}`);
    }

    const data = await response.json();

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching cutoffs data:", error);
    res.status(500).json({
      error: "Failed to fetch cutoffs data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
