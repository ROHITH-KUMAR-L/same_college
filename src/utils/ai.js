const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function getAIResponse(messages, useOllama = false) {
    if (useOllama) {
        try {
            const response = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3',
                    messages: messages,
                    stream: false
                })
            });
            const data = await response.json();
            return data.message.content;
        } catch (error) {
            console.error("Ollama connection failed, falling back to Groq:", error);
            // Fallback to Groq if Ollama is not running
        }
    }

    // Default to Groq
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message);
        }
        return data.choices[0].message.content;
    } catch (error) {
        console.error("AI Assistant Error:", error);
        return "I'm having trouble connecting to my brain right now. Please check your internet connection or try again later.";
    }
}
