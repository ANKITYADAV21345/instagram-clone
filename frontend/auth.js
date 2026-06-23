// Auth Page JavaScript - API Integration
// DEPLOY STEP: Replace YOUR_RENDER_URL with your actual Render backend URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '' 
    : 'https://YOUR_RENDER_URL.onrender.com';

// Initialize Lucide icons
lucide.createIcons();

// =================== DOM ELEMENTS ===================
const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');
const switchToRegister = document.getElementById('switch-to-register');
const switchToLogin = document.getElementById('switch-to-login');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

const passwordStrength = document.getElementById('password-strength');
const strengthFill = document.getElementById('strength-fill');
const strengthText = document.getElementById('strength-text');

// =================== CHECK IF ALREADY LOGGED IN ===================
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            // User is already logged in, redirect to feed
            window.location.href = '/';
        }
    } catch (error) {
        // Not logged in, stay on auth page
    }
}

checkAuth();

// =================== TOGGLE FORMS ===================
showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginCard.classList.add('hidden');
    switchToRegister.classList.add('hidden');
    registerCard.classList.remove('hidden');
    switchToLogin.classList.remove('hidden');
    
    // Re-trigger animations
    registerCard.style.animation = 'none';
    registerCard.offsetHeight; // force reflow
    registerCard.style.animation = '';
});

showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerCard.classList.add('hidden');
    switchToLogin.classList.add('hidden');
    loginCard.classList.remove('hidden');
    switchToRegister.classList.remove('hidden');
    
    // Re-trigger animations
    loginCard.style.animation = 'none';
    loginCard.offsetHeight;
    loginCard.style.animation = '';
});

// =================== PASSWORD VISIBILITY TOGGLE ===================
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const eyeIcon = btn.querySelector('.eye-icon');
        const eyeOffIcon = btn.querySelector('.eye-off-icon');

        if (input.type === 'password') {
            input.type = 'text';
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
        } else {
            input.type = 'password';
            eyeIcon.classList.remove('hidden');
            eyeOffIcon.classList.add('hidden');
        }
    });
});

// =================== PASSWORD STRENGTH CHECKER ===================
const registerPassword = document.getElementById('register-password');
registerPassword.addEventListener('input', () => {
    const val = registerPassword.value;
    
    if (val.length === 0) {
        passwordStrength.classList.add('hidden');
        return;
    }
    
    passwordStrength.classList.remove('hidden');
    
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    
    strengthFill.className = 'strength-fill';
    
    if (score <= 2) {
        strengthFill.classList.add('weak');
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#ff3040';
    } else if (score <= 3) {
        strengthFill.classList.add('medium');
        strengthText.textContent = 'Medium';
        strengthText.style.color = '#fcb045';
    } else {
        strengthFill.classList.add('strong');
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#4caf50';
    }
});

// =================== LOGIN FORM SUBMIT ===================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    setButtonLoading(btnLogin, true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save user info in localStorage for frontend use
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            
            showToast('Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Unable to connect to server. Is it running?', 'error');
    } finally {
        setButtonLoading(btnLogin, false);
    }
});

// =================== REGISTER FORM SUBMIT ===================
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value.trim();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    
    if (!email || !username || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    setButtonLoading(btnRegister, true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save user info in localStorage for frontend use
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            
            showToast('Account created! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1200);
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast('Unable to connect to server. Is it running?', 'error');
    } finally {
        setButtonLoading(btnRegister, false);
    }
});

// =================== HELPERS ===================
function setButtonLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    
    if (loading) {
        text.classList.add('hidden');
        loader.classList.remove('hidden');
        btn.disabled = true;
    } else {
        text.classList.remove('hidden');
        loader.classList.add('hidden');
        btn.disabled = false;
    }
}

// =================== TOAST SYSTEM ===================
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${iconName}"></i>
        </div>
        <div class="toast-msg">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
