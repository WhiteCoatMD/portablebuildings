import { list, del } from '@vercel/blob';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get images for a specific building
      const { serialNumber } = req.query;

      if (!serialNumber) {
        return res.status(400).json({ error: 'Missing serialNumber parameter' });
      }

      // List all blobs with the prefix for this building
      const { blobs } = await list({
        prefix: `buildings/${serialNumber}/`,
      });

      // Return URLs sorted by upload time (newest first)
      const urls = blobs
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .map(blob => blob.url);

      return res.status(200).json({
        success: true,
        images: urls,
      });

    } else if (req.method === 'DELETE') {
      // Delete a specific image
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'Missing url in request body' });
      }

      await del(url);

      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
}
