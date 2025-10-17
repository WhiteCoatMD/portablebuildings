/**
 * Initiate Google Business Profile OAuth flow
 */

module.exports = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId parameter is required'
            });
        }

        const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
        const redirectUri = 'https://portablebuildings.vercel.app/api/auth/google-business/callback';

        if (!clientId) {
            return res.status(500).json({
                success: false,
                error: 'Google Business Profile API not configured'
            });
        }

        // Build OAuth URL with userId in state parameter
        const scopes = [
            'https://www.googleapis.com/auth/business.manage'
        ];

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: scopes.join(' '),
            access_type: 'offline',
            prompt: 'consent', // Force consent screen to get refresh token
            state: userId // Pass userId through OAuth flow
        })}`;

        console.log('[GBP OAuth Init] Generated auth URL:', authUrl);
        console.log('[GBP OAuth Init] Client ID:', clientId);
        console.log('[GBP OAuth Init] Redirect URI:', redirectUri);

        return res.status(200).json({
            success: true,
            authUrl: authUrl
        });

    } catch (error) {
        console.error('[Google Business OAuth Init] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to initiate OAuth'
        });
    }
};
