/**
 * Authentication System for Precious Meals & Bakes
 * Handles user registration, login, and session management
 * Integrated with Firebase Authentication
 */

// Import Firebase services
import { 
    auth, 
    db,
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where,
    doc,
    setDoc,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from './firebase-config.js';

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
    
    // Check if user is logged in
    checkLoginStatus: function() {
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is logged in
                const userData = {
                    id: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email
                };
                this.updateUIForLoggedInUser(userData);
                return true;
            } else {
                // User is not logged in
                this.updateUIForLoggedOutUser();
                return false;
            }
        });
    },
    
    // Login functionality
    login: async function() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validate inputs
        if (!email || !password) {
            this.showMessage('Please enter both email and password', 'error');
            return;
        }
        
        try {
            // Special case for admin user (for backward compatibility)
            if (email === 'admin@admin.com' && password === 'password123') {
                // Use Firebase sign in
                await signInWithEmailAndPassword(auth, email, password)
                    .catch(async (error) => {
                        // If admin doesn't exist in Firebase yet, create it
                        if (error.code === 'auth/user-not-found') {
                            await createUserWithEmailAndPassword(auth, email, password);
                            
                            // Create admin user document in Firestore
                            const userRef = doc(db, 'users', auth.currentUser.uid);
                            await setDoc(userRef, {
                                name: 'Administrator',
                                email: email,
                                role: 'admin',
                                createdAt: new Date().toISOString()
                            });
                        } else {
                            throw error;
                        }
                    });
                
                this.showMessage('Admin login successful!', 'success');
                
                // Close modal if exists
                const modalElement = document.getElementById('authModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
                
                return;
            }
            
            // Regular user login with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            this.showMessage('Login successful!', 'success');
            
            // Close modal if exists
            const modalElement = document.getElementById('authModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
            
            // Redirect to booking page if on login page
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'bookings.html';
            }
            
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Login failed. Please try again.';
            
            // Handle specific Firebase auth errors
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email. Please register first.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password. Please try again.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed login attempts. Please try again later.';
                    break;
            }
            
            this.showMessage(errorMessage, 'error');
        }
    },
    
    // Register functionality
    register: async function() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate inputs
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
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        try {
            // Create user with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Store additional user data in Firestore
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                name: name,
                email: email,
                phone: phone,
                createdAt: new Date().toISOString()
            });
            
            this.showMessage('Registration successful! You are now logged in.', 'success');
            
            // Close modal if exists
            const modalElement = document.getElementById('authModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
        } catch (error) {
            console.error('Registration error:', error);
            let errorMessage = 'Registration failed. Please try again.';
            
            // Handle specific Firebase auth errors
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Email is already registered. Please use a different email or login.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please use a stronger password.';
                    break;
            }
            
            this.showMessage(errorMessage, 'error');
        }
    },
    
    // Logout functionality
    logout: async function() {
        try {
            // Sign out from Firebase
            await signOut(auth);
            
            this.showMessage('Logged out successfully', 'success');
            this.updateUIForLoggedOutUser();
            
            // Redirect to home if on protected page
            const protectedPages = ['bookings.html', 'my-account.html'];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (protectedPages.includes(currentPage)) {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showMessage('Error logging out. Please try again.', 'error');
        }
    },
    
    // Update UI for logged in user
    updateUIForLoggedInUser: function(user) {
        // Store user data in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Update UI elements
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userDisplay = document.getElementById('userDisplay');
        
        if (loginBtn) loginBtn.classList.add('d-none');
        if (logoutBtn) logoutBtn.classList.remove('d-none');
        if (userDisplay) {
            userDisplay.classList.remove('d-none');
            userDisplay.textContent = user.name;
        }
        
        // Close the login modal if it's open
        const authModal = document.getElementById('authModal');
        if (authModal) {
            // Try to get the Bootstrap modal instance
            let modalInstance = bootstrap.Modal.getInstance(authModal);
            
            // If the instance exists, hide it
            if (modalInstance) {
                modalInstance.hide();
            } else {
                // If no instance exists, try creating one and then hiding it
                try {
                    modalInstance = new bootstrap.Modal(authModal);
                    modalInstance.hide();
                } catch (error) {
                    console.error('Error closing modal:', error);
                }
            }
            
            // Ensure the modal backdrop is removed
            setTimeout(() => {
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }, 300);
        }
        
        // Show booking interface if on booking page
        if (window.location.pathname.includes('bookings.html') && typeof window.showBookingInterfaceAfterLogin === 'function') {
            window.showBookingInterfaceAfterLogin();
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
        const loginFormContainer = document.getElementById('loginFormContainer');
        const registerFormContainer = document.getElementById('registerFormContainer');
        
        if (loginFormContainer && registerFormContainer) {
            loginFormContainer.classList.remove('d-none');
            registerFormContainer.classList.add('d-none');
            
            // Update modal title
            const modalTitle = document.getElementById('authModalLabel');
            if (modalTitle) modalTitle.textContent = 'Login to Your Account';
            
            // Clear any previous messages
            const authMessage = document.getElementById('authMessage');
            if (authMessage) authMessage.classList.add('d-none');
            
            // Reset login form
            const loginForm = document.getElementById('loginForm');
            if (loginForm) loginForm.reset();
        }
    },
    
    // Show register form
    showRegisterForm: function() {
        const loginFormContainer = document.getElementById('loginFormContainer');
        const registerFormContainer = document.getElementById('registerFormContainer');
        
        if (loginFormContainer && registerFormContainer) {
            loginFormContainer.classList.add('d-none');
            registerFormContainer.classList.remove('d-none');
            
            // Update modal title
            const modalTitle = document.getElementById('authModalLabel');
            if (modalTitle) modalTitle.textContent = 'Create an Account';
            
            // Clear any previous messages
            const authMessage = document.getElementById('authMessage');
            if (authMessage) authMessage.classList.add('d-none');
            
            // Reset registration form
            const registerForm = document.getElementById('registerForm');
            if (registerForm) registerForm.reset();
        }
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
