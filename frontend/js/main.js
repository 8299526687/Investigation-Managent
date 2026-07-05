// Helper for showing notifications
function showNotification(message, type = 'success') {
    const el = document.getElementById('notification');
    if(el) {
        el.textContent = message;
        el.className = `notification show ${type}`;
        setTimeout(() => {
            el.className = 'notification';
        }, 3000);
    } else {
        alert(message);
    }
}

// Utility to check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.href.endsWith('index.html') && !window.location.href.endsWith('/')) {
        window.location.href = 'index.html';
    }
    return token;
}

// Fetch helper with auth header
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && options.method && options.method !== 'GET') {
        headers['Content-Type'] = 'application/json';
        if(typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
        }
    }

    try {
        const API_BASE_URL = 'http://localhost:5001/api';
        const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        }
        return response;
    } catch (err) {
        console.error("Backend Error:", err);
        throw err;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Update UI with user info
document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        const nameEl = document.getElementById('user-name-display');
        const roleEl = document.getElementById('user-role-display');
        if(nameEl) nameEl.textContent = user.name;
        if(roleEl) roleEl.textContent = `${user.role} | ${user.policeStation}, ${user.district}`;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});
