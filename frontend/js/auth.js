document.addEventListener('DOMContentLoaded', () => {
    // Redirect to dashboard if already logged in
    if (localStorage.getItem('token')) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginCard = document.getElementById('login-card');
    const registerCard = document.getElementById('register-card');
    
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginCard.style.display = 'none';
        registerCard.style.display = 'block';
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerCard.style.display = 'none';
        loginCard.style.display = 'block';
    });

    // Login Form Submit
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pno = document.getElementById('pno').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('http://localhost:5001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pno, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                showNotification(data.message || 'Login failed', 'error');
            }
        } catch (err) {
            showNotification('Network error, please try again', 'error');
        }
    });

    // Register Form Submit
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('reg-name').value,
            pno: document.getElementById('reg-pno').value,
            role: "SI",
            district: "Lucknow",
            policeStation: "Hazratganj",
            password: document.getElementById('reg-password').value
        };

        try {
            const res = await fetch('http://localhost:5001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok) {
                showNotification('Registration successful! Please login.');
                registerCard.style.display = 'none';
                loginCard.style.display = 'block';
                document.getElementById('register-form').reset();
            } else {
                showNotification(data.message || 'Registration failed', 'error');
            }
        } catch (err) {
            showNotification('Network error, please try again', 'error');
        }
    });
});
