
class GeminiChatbot {
    constructor() {
        this.apiKey = 'AIzaSyCysdNGyIw2DO_Ck0r5Ub3ZydYVfjCzGg0';
        this.initUI();
    }

    initUI() {
        this.chatContainer = document.getElementById('chat-container');
        if (!this.chatContainer) return;

        this.chatContainer.innerHTML = `
            <div class="chat-messages"></div>
            <form class="chat-input-form">
                <input type="text" placeholder="Type your message here..." required>
                <button type="submit">Send</button>
            </form>
        `;

        // Form submit
        const form = this.chatContainer.querySelector('.chat-input-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = form.querySelector('input');
            const message = input.value.trim();
            if (message) {
                await this.handleUserMessage(message);
                input.value = '';
            }
        });

        this.addBotMessage("Hi! I'm here to support you. How are you feeling today?");
    }

    async handleUserMessage(message) {
        this.addUserMessage(message);
        this.addBotMessageWithDelay('...');
        try {
            const response = await this.fetchGeminiResponse(message);
            this.replaceLastBotMessage(response);
        } catch (e) {
            this.replaceLastBotMessage('Sorry, there was an error contacting Gemini.');
        }
    }

    async fetchGeminiResponse(message) {
        const prompt = `You are a supportive and empathetic mental health first-aid chatbot. Respond to the following message with compassion and helpful suggestions. Keep responses concise (max 3-4 sentences) and focused on support: ${message}`;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
            })
        });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
    }

    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.textContent = message;
        this.chatContainer.querySelector('.chat-messages').appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.textContent = message;
        this.chatContainer.querySelector('.chat-messages').appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessageWithDelay(message) {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing';
        typingDiv.textContent = message;
        this.chatContainer.querySelector('.chat-messages').appendChild(typingDiv);
        this.scrollToBottom();
    }

    replaceLastBotMessage(message) {
        const messages = this.chatContainer.querySelectorAll('.message.bot-message');
        if (messages.length) {
            messages[messages.length - 1].textContent = message;
        }
    }

    scrollToBottom() {
        const messages = this.chatContainer.querySelector('.chat-messages');
        messages.scrollTop = messages.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GeminiChatbot();
});
