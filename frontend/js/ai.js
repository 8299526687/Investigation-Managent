document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const submitBtn = document.getElementById('chat-submit');

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const message = chatInput.value.trim();
        if (!message) return;

        appendMessage(message, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        submitBtn.disabled = true;

        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = `message ai`;
        typingDiv.id = 'typing-indicator';
        typingDiv.textContent = 'Analyzing...';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            // Optional: send context if navigating from a specific case (could pass via URL params)
            const urlParams = new URLSearchParams(window.location.search);
            const caseId = urlParams.get('caseId');
            
            // In a full app, we might fetch the case details here and send them along. 
            // For now, we'll just send the message.

            const res = await apiFetch('/ai/chat', {
                method: 'POST',
                body: { message }
            });

            const data = await res.json();
            
            // Remove typing indicator
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.remove();

            if (res.ok) {
                appendMessage(data.reply, 'ai');
            } else {
                appendMessage(`[Debug Error]: ${data.message} - ${data.error || 'Unknown Error'}`, 'ai');
                showNotification(data.message || 'Error communicating with AI', 'error');
            }
        } catch (error) {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.remove();
            
            appendMessage('Network error. Could not reach AI service.', 'ai');
        } finally {
            chatInput.disabled = false;
            submitBtn.disabled = false;
            chatInput.focus();
        }
    });
});
