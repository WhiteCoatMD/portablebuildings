const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse body if needed (Vercel should do this automatically for JSON)
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { serialNumber, imageData, filename } = body;

    console.log('Upload request:', { serialNumber, filename, hasImageData: !!imageData });

    if (!serialNumber || !imageData || !filename) {
      console.error('Missing fields:', { serialNumber: !!serialNumber, imageData: !!imageData, filename: !!filename });
      return res.status(400).json({
        error: 'Missing required fields',
        received: { serialNumber: !!serialNumber, imageData: !!imageData, filename: !!filename }
      });
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    console.log('Buffer size:', buffer.length);

    // Upload to Vercel Blob with a unique path
    const blobPath = `buildings/${serialNumber}/${Date.now()}-${filename}`;

    console.log('Uploading to:', blobPath);

    const blob = await put(blobPath, buffer, {
      access: 'public',
      contentType: imageData.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg',
    });

    console.log('Upload successful:', blob.url);

    return res.status(200).json({
      success: true,
      url: blob.url,
      filename: filename,
    });

  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to upload image',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
