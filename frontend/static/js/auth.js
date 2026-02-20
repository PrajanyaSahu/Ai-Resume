// Authentication JavaScript

// API_BASE is now defined in common.js

// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        // If on login/register page, redirect to dashboard
        if (window.location.pathname === '/login' || window.location.pathname === '/register') {
            window.location.href = '/dashboard';
        }
    }
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoading = loginBtn.querySelector('.btn-loading');
        const errorDiv = document.getElementById('errorMessage');

        // Get form data
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Show loading
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        loginBtn.disabled = true;
        errorDiv.style.display = 'none';

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save token
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                // Show error
                errorDiv.textContent = data.detail || 'Login failed';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.textContent = 'Network error. Please try again.';
            errorDiv.style.display = 'block';
        } finally {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            loginBtn.disabled = false;
        }
    });
}

// Register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const registerBtn = document.getElementById('registerBtn');
        const btnText = registerBtn.querySelector('.btn-text');
        const btnLoading = registerBtn.querySelector('.btn-loading');
        const errorDiv = document.getElementById('errorMessage');

        // Get form data
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Validate
        if (password.length < 8) {
            errorDiv.textContent = 'Password must be at least 8 characters';
            errorDiv.style.display = 'block';
            return;
        }

        // Show loading
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        registerBtn.disabled = true;
        errorDiv.style.display = 'none';

        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save token
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                // Show error
                errorDiv.textContent = data.detail || 'Registration failed';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.textContent = 'Network error. Please try again.';
            errorDiv.style.display = 'block';
        } finally {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            registerBtn.disabled = false;
        }
    });
}

// Logout function (used globally)
// logout() is now defined in common.js

// Run on page load
checkAuth();