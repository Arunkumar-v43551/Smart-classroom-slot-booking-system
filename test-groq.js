const GROQ_API_KEY = process.env.GROQ_API_KEY; // Set this in your .env file

async function testGroq() {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: 'hello' }],
                temperature: 0.7,
                max_tokens: 800,
            })
        });

        if (!response.ok) {
            console.log("Error status:", response.status);
            console.log(await response.text());
        } else {
            const data = await response.json();
            console.log("Success:", data.choices[0].message.content);
        }
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

testGroq();
