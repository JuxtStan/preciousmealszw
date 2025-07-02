/**
 * Authentication System for Precious Meals & Bakes
 * Handles user registration, login, and session management
 * Integrated with Firebase Authentication
 */

// User authentication management
const AuthSystem = {
    // Initialize the authentication system
    init: function() {
        this.checkLoginStatus();
        document.addEventListener('DOMContentLoaded', () => {
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.login();
                });
            }
            const registerForm = document.getElementById('registerForm');
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.register();
                });
            }
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
            const showRegisterBtn = document.getElementById('showRegisterBtn');
            if (showRegisterBtn) {
                showRegisterBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showRegisterForm();
                });
            }
            const showLoginBtn = document.getElementById('showLoginBtn');
            if (showLoginBtn) {
                showLoginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showLoginForm();
                });
            }
        });
    },
    checkLoginStatus: function() {
        const cachedUser = localStorage.getItem('currentUser');
        if (cachedUser) {
            try {
                const userData = JSON.parse(cachedUser);
                this.updateUIForLoggedInUser(userData);
            } catch (e) {
                localStorage.removeItem('currentUser');
            }
        } else {
            this.updateUIForLoggedOutUser();
        }
    },
    login: function() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        if (!email || !password) {
            this.showMessage('Please enter both email and password', 'error');
            return;
        }
        // Admin login (hardcoded)
        if (email === 'admin@admin.com' && password === 'password123') {
            const adminUser = {
                id: 'admin',
                name: 'Administrator',
                email: email,
                role: 'admin'
            };
            localStorage.setItem('currentUser', JSON.stringify(adminUser));
            this.updateUIForLoggedInUser(adminUser);
            if (typeof showBookingInterfaceAfterLogin === 'function') showBookingInterfaceAfterLogin();
            this.showMessage('Login successful! Welcome, Administrator.', 'success');
            return;
        }
        // User login
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.updateUIForLoggedInUser(user);
            if (typeof showBookingInterfaceAfterLogin === 'function') showBookingInterfaceAfterLogin();
            this.showMessage('Login successful!', 'success');
        } else {
            this.showMessage('Invalid email or password.', 'error');
        }
    },
    register: function() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (!name || !email || !phone || !password || !confirmPassword) {
            this.showMessage('Please fill all fields', 'error');
            return;
        }
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }
        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters long', 'error');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.email === email)) {
            this.showMessage('Email already registered', 'error');
            return;
        }
        const newUser = {
            id: 'user-' + Date.now(),
            name: name,
            email: email,
            phone: phone,
            password: password
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        this.updateUIForLoggedInUser(newUser);
        if (typeof showBookingInterfaceAfterLogin === 'function') showBookingInterfaceAfterLogin();
        this.showMessage('Registration successful! You are now logged in.', 'success');
    },
    logout: function() {
        localStorage.removeItem('currentUser');
        this.updateUIForLoggedOutUser();
        this.showMessage('Logged out successfully.', 'success');
    },
    updateUIForLoggedInUser: function(user) {
        const authButtons = document.querySelectorAll('.auth-buttons');
        const userMenus = document.querySelectorAll('.user-menu');
        const userDisplays = document.querySelectorAll('#userDisplay, .user-name');
        authButtons.forEach(el => el.classList.add('d-none'));
        userMenus.forEach(el => el.classList.remove('d-none'));
        userDisplays.forEach(el => { el.textContent = user.name; });
    },
    updateUIForLoggedOutUser: function() {
        const authButtons = document.querySelectorAll('.auth-buttons');
        const userMenus = document.querySelectorAll('.user-menu');
        authButtons.forEach(el => el.classList.remove('d-none'));
        userMenus.forEach(el => el.classList.add('d-none'));
    },
    showRegisterForm: function() {
        const loginFormContainer = document.getElementById('loginFormContainer');
        const registerFormContainer = document.getElementById('registerFormContainer');
        if (loginFormContainer && registerFormContainer) {
            loginFormContainer.classList.add('d-none');
            registerFormContainer.classList.remove('d-none');
            const modalTitle = document.getElementById('authModalLabel');
            if (modalTitle) modalTitle.textContent = 'Create an Account';
            const authMessage = document.getElementById('authMessage');
            if (authMessage) authMessage.classList.add('d-none');
            const registerForm = document.getElementById('registerForm');
            if (registerForm) registerForm.reset();
        }
    },
    showLoginForm: function() {
        const loginFormContainer = document.getElementById('loginFormContainer');
        const registerFormContainer = document.getElementById('registerFormContainer');
        if (loginFormContainer && registerFormContainer) {
            registerFormContainer.classList.add('d-none');
            loginFormContainer.classList.remove('d-none');
            const modalTitle = document.getElementById('authModalLabel');
            if (modalTitle) modalTitle.textContent = 'Login to Your Account';
            const authMessage = document.getElementById('authMessage');
            if (authMessage) authMessage.classList.add('d-none');
            const loginForm = document.getElementById('loginForm');
            if (loginForm) loginForm.reset();
        }
    },
    showMessage: function(message, type) {
        const messageElement = document.getElementById('authMessage');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
            messageElement.classList.remove('d-none');
            setTimeout(() => {
                messageElement.classList.add('d-none');
            }, 3000);
        } else {
            if (type === 'error') {
                alert(`Error: ${message}`);
            } else {
                alert(message);
            }
        }
    }
};

// Initialize authentication system
AuthSystem.init();
