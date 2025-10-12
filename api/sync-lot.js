const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Sync lot request received');

    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { dealerNumber, password } = body;

    if (!dealerNumber || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing dealer number or password'
      });
    }

    console.log('Fetching inventory for dealer:', dealerNumber);

    // Fetch from the API
    const apiUrl = `https://www.bscnow.com/GPWebAPI/Default.aspx?DealerNumber=${dealerNumber}&Password=${encodeURIComponent(password)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const text = await response.text();
    console.log('Received response, length:', text.length);

    // Return the raw data - let the client decode it
    return res.status(200).json({
      success: true,
      data: text
    });

  } catch (error) {
    console.error('Sync lot error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync lot',
      details: error.message
    });
  }
};
