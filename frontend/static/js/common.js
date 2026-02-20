// Common shared logic for Resume ATS Optimizer
const API_BASE = '/api';

// Logout function (used globally)
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('latestAnalysis');
    window.location.href = '/login';
}

// Toggle API key visibility (used globally)
function toggleKeyVisibility() {
    const input = document.getElementById('apiKey');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Check authentication status and display user email if element exists
document.addEventListener('DOMContentLoaded', () => {
    const userEmailEl = document.getElementById('userEmail');
    if (userEmailEl) {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user && user.email) {
                    userEmailEl.textContent = user.email;
                }
            }
        } catch (e) {
            console.error('Error parsing user data in common.js:', e);
        }
    }
});
