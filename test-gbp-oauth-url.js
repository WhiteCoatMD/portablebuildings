/**
 * Test script to verify GBP OAuth URL generation
 */

const clientId = '72228454003-5blt9l21sagkrleqt4at05cu245fsvmq.apps.googleusercontent.com';
const redirectUri = 'https://portablebuildings.vercel.app/api/auth/google-business/callback';
const userId = '1';

const scopes = ['https://www.googleapis.com/auth/business.manage'];

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: userId
})}`;

console.log('Generated OAuth URL:');
console.log(authUrl);
console.log('\n');
console.log('Breakdown:');
console.log('- Client ID:', clientId);
console.log('- Redirect URI:', redirectUri);
console.log('- Scope:', scopes.join(' '));
console.log('- State:', userId);
