const { list, del } = require('@vercel/blob');
const { getPool } = require('../lib/db');

const pool = getPool();

module.exports = async function handler(req, res) {
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
      const { serialNumber, userId } = req.query;

      console.log('GET images for:', serialNumber, 'userId:', userId);

      if (!serialNumber) {
        return res.status(400).json({ error: 'Missing serialNumber parameter' });
      }

      // List all blobs with the prefix for this building
      const { blobs } = await list({
        prefix: `buildings/${serialNumber}/`,
      });

      console.log('Found blobs:', blobs.length);

      // Try to get image order from database if userId is provided
      let imageOrder = {};
      if (userId) {
        try {
          const settingsResult = await pool.query(
            `SELECT setting_value FROM user_settings
             WHERE user_id = $1 AND setting_key = 'imageOrders'`,
            [userId]
          );

          if (settingsResult.rows.length > 0) {
            imageOrder = JSON.parse(settingsResult.rows[0].setting_value);
            console.log('Loaded image order from database for user', userId);
          }
        } catch (e) {
          console.log('Failed to load image order from database:', e.message);
        }
      }

      // Fall back to query param (set from localStorage on client side)
      if (Object.keys(imageOrder).length === 0) {
        const orderParam = req.query.order;
        if (orderParam) {
          try {
            imageOrder = JSON.parse(decodeURIComponent(orderParam));
          } catch (e) {
            console.log('Failed to parse order param:', e);
          }
        }
      }

      // Sort by custom order if available, otherwise by upload time
      const urls = blobs
        .sort((a, b) => {
          // If we have custom order for this serial number, use it
          const orderArray = imageOrder[serialNumber];
          if (orderArray && Array.isArray(orderArray)) {
            const indexA = orderArray.indexOf(a.url);
            const indexB = orderArray.indexOf(b.url);

            // If both images are in the order array, sort by their position
            if (indexA !== -1 && indexB !== -1) {
              return indexA - indexB;
            }
            // If only A is in order array, it comes first
            if (indexA !== -1) return -1;
            // If only B is in order array, it comes first
            if (indexB !== -1) return 1;
          }

          // Default: sort by upload time (newest first)
          return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        })
        .map(blob => blob.url);

      return res.status(200).json({
        success: true,
        images: urls,
      });

    } else if (req.method === 'DELETE') {
      // Delete a specific image
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }

      const { url } = body;

      console.log('DELETE image:', url);

      if (!url) {
        return res.status(400).json({ error: 'Missing url in request body' });
      }

      await del(url);

      console.log('Delete successful');

      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('API error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
