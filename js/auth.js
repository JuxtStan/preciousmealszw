/**
 * Authentication System for Precious Meals & Bakes
 * Handles user registration, login, and session management
 */

// User authentication management
const AuthSystem = {
    // Initialize the authentication system
    init: function() {
        // Check if a user is already logged in
        this.checkLoginStatus();
        
        // Attach event listeners for login/register forms
        document.addEventListener('DOMContentLoaded', () => {
            // Login form submission
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.login();
                });
            }
            
            // Register form submission
            const registerForm = document.getElementById('registerForm');
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.register();
                });
            }
            
            // Logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
            
            // Switch between login and register forms
            const switchToRegister = document.getElementById('switchToRegister');
            if (switchToRegister) {
                switchToRegister.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showRegisterForm();
                });
            }
            
            const switchToLogin = document.getElementById('switchToLogin');
            if (switchToLogin) {
                switchToLogin.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showLoginForm();
                });
            }
        });
    },
    
    // Check if user is logged in
    checkLoginStatus: function() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            // User is logged in
            this.updateUIForLoggedInUser(JSON.parse(currentUser));
            return true;
        }
        return false;
    },
    
    // Login functionality
    login: function() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validate inputs
        if (!email || !password) {
            this.showMessage('Please enter both email and password', 'error');
            return;
        }
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Store current user in localStorage
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email
            }));
            
            this.showMessage('Login successful! Redirecting...', 'success');
            
            // Update UI
            this.updateUIForLoggedInUser(user);
            
            // Close modal if exists
            const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            if (authModal) {
                authModal.hide();
            }
            
            // Redirect to booking page if on login page
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'bookings.html';
            }
            
        } else {
            this.showMessage('Invalid email or password', 'error');
        }
    },
    
    // Register functionality
    register: function() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Validate inputs
        if (!name || !email || !password || !confirmPassword) {
            this.showMessage('Please fill all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if email already exists
        if (users.some(u => u.email === email)) {
            this.showMessage('Email already registered', 'error');
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            bookings: []
        };
        
        // Add to users array
        users.push(newUser);
        
        // Save updated users array
        localStorage.setItem('users', JSON.stringify(users));
        
        this.showMessage('Registration successful! You can now login.', 'success');
        
        // Switch to login form
        this.showLoginForm();
    },
    
    // Logout functionality
    logout: function() {
        localStorage.removeItem('currentUser');
        this.showMessage('Logged out successfully', 'success');
        this.updateUIForLoggedOutUser();
        
        // Redirect to home if on protected page
        const protectedPages = ['bookings.html', 'my-account.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
    },
    
    // Update UI for logged in user
    updateUIForLoggedInUser: function(user) {
        // Update navigation menu
        const authButtons = document.querySelectorAll('.auth-buttons');
        const userMenus = document.querySelectorAll('.user-menu');
        const userNameElements = document.querySelectorAll('.user-name');
        
        authButtons.forEach(el => el.classList.add('d-none'));
        userMenus.forEach(el => el.classList.remove('d-none'));
        userNameElements.forEach(el => el.textContent = user.name);
        
        // Update booking form if on booking page
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            const nameInput = document.getElementById('fullName');
            const emailInput = document.getElementById('email');
            
            if (nameInput && user.name) nameInput.value = user.name;
            if (emailInput && user.email) emailInput.value = user.email;
        }
    },
    
    // Update UI for logged out user
    updateUIForLoggedOutUser: function() {
        const authButtons = document.querySelectorAll('.auth-buttons');
        const userMenus = document.querySelectorAll('.user-menu');
        
        authButtons.forEach(el => el.classList.remove('d-none'));
        userMenus.forEach(el => el.classList.add('d-none'));
    },
    
    // Show login form
    showLoginForm: function() {
        document.getElementById('loginForm').classList.remove('d-none');
        document.getElementById('registerForm').classList.add('d-none');
    },
    
    // Show register form
    showRegisterForm: function() {
        document.getElementById('loginForm').classList.add('d-none');
        document.getElementById('registerForm').classList.remove('d-none');
    },
    
    // Show messages to user
    showMessage: function(message, type) {
        const messageElement = document.getElementById('authMessage');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
            messageElement.classList.remove('d-none');
            
            // Hide message after 3 seconds
            setTimeout(() => {
                messageElement.classList.add('d-none');
            }, 3000);
        } else {
            // Fallback to alert if message element not found
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
