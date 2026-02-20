// scripts/listModels.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        console.log('Fetching models...');
        // The SDK might not have a direct listModels, but we can try to fetch a common one or use the REST API logic
        // Actually, let's use the fetch API to hit the list endpoint directly to be safe
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', data.error);
            return;
        }

        console.log('Available Models:');
        data.models.forEach(m => {
            console.log(`- ${m.name} (Supports: ${m.supportedGenerationMethods.join(', ')})`);
        });
    } catch (err) {
        console.error('Search error:', err);
    }
}

run();
