// Quick script to test your Gemini API and check quota
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('Error: GEMINI_API_KEY environment variable not set');
    console.error('Set it with: export GEMINI_API_KEY=your_api_key_here');
    process.exit(1);
}
const MODEL = 'gemini-2.0-flash';

async function testGeminiAPI() {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'Hello! Just testing my API quota.'
                        }]
                    }]
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            console.log('✅ API is working!');
            console.log('Response:', data);
        } else {
            console.log('❌ API Error:');
            console.log('Status:', response.status);
            console.log('Error:', data);

            if (data.error?.message?.includes('quota') || data.error?.message?.includes('rate limit')) {
                console.log('\n⚠️  QUOTA ISSUE DETECTED');
                console.log('Your API key is on Tier 1 (Free tier)');
                console.log('You need to enable billing in Google Cloud Console to increase limits.');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testGeminiAPI();
