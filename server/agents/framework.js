const axios = require('axios');

// --- CONFIGURATION ---
const LLM_CONFIG = {
    url: process.env.LLM_API_URL || 'http://127.0.0.1:11434/api/chat',
    model: process.env.LLM_MODEL_NAME || 'llama3.2:3b', // Ensure this matches 'ollama list'
    timeout: 60000,
    maxRetries: 2
};

class Agent {
    constructor(name, description, tools = []) {
        this.name = name;
        this.description = description;
        this.tools = tools;
    }

    async run(input, context) {
        throw new Error("Method 'run' must be implemented");
    }

    async callLLM(messages, temperature = 0.7) {
        return this._executeWithRetry(async () => {
            const start = Date.now();
            const response = await axios.post(LLM_CONFIG.url, {
                model: LLM_CONFIG.model,
                messages: messages,
                stream: false,
                options: { temperature },
                stop: ["User:", "System:", "Swifty:", "Bot:", "||WIDGET", "<|eot_id|>"]
            }, { timeout: LLM_CONFIG.timeout });

            const output = response.data.message.content;

            // FIX: Replaced broken 'logEvent' with standard console log
            const duration = Date.now() - start;
            console.log(`[${this.name}] LLM Success (${duration}ms)`);

            return output;
        });
    }

    async _executeWithRetry(fn, attempts = LLM_CONFIG.maxRetries) {
        try {
            return await fn();
        } catch (error) {
            if (attempts <= 1) {
                console.error(`[${this.name}] LLM Critical Fail:`, error.message);
                return JSON.stringify({
                    response: "System is experiencing high traffic. Please try again.",
                    status: "ERROR",
                    data: {}
                });
            }
            console.warn(`[${this.name}] Retrying... (${attempts - 1} left) - Error: ${error.message}`);
            await new Promise(r => setTimeout(r, 1500));
            return this._executeWithRetry(fn, attempts - 1);
        }
    }
}

module.exports = { Agent };