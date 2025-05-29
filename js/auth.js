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
        console.log('Checking login status...');
        
        // First check local storage for cached user data
        const cachedUser = localStorage.getItem('currentUser');
        if (cachedUser) {
            try {
                const userData = JSON.parse(cachedUser);
                console.log('Found cached user:', userData);
                // Temporarily update UI while we verify with Firebase
                this.updateUIForLoggedInUser(userData);
            } catch (e) {
                console.error('Error parsing cached user:', e);
                localStorage.removeItem('currentUser');
            }
        }
        
        // Then verify with Firebase (this is async)
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is logged in with Firebase
                console.log('Firebase auth state: User is logged in', user);
                
                // Get additional user data from Firestore
                const userRef = doc(db, 'users', user.uid);
                getDoc(userRef).then(docSnap => {
                    let userData;
                    
                    if (docSnap.exists()) {
                        // User data exists in Firestore
                        const firestoreData = docSnap.data();
                        userData = {
                            id: user.uid,
                            name: firestoreData.name || user.displayName || user.email.split('@')[0],
                            email: user.email,
                            phone: firestoreData.phone || ''
                        };
                    } else {
                        // User exists in Auth but not in Firestore
                        userData = {
                            id: user.uid,
                            name: user.displayName || user.email.split('@')[0],
                            email: user.email
                        };
                        
                        // Create a user document in Firestore
                        setDoc(userRef, {
                            name: userData.name,
                            email: userData.email,
                            createdAt: new Date().toISOString()
                        });
                    }
                    
                    // Update UI with fresh data
                    this.updateUIForLoggedInUser(userData);
                }).catch(error => {
                    console.error('Error getting user document:', error);
                });
                
                return true;
            } else {
                // User is not logged in
                console.log('Firebase auth state: User is NOT logged in');
                this.updateUIForLoggedOutUser();
                return false;
            }
        });
    },
    
    // Login functionality
    login: async function() {
        console.log('Login attempt started');
        
        // Disable the login button to prevent multiple submissions
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Logging in...';
        }
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validate inputs
        if (!email || !password) {
            this.showMessage('Please enter both email and password', 'error');
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
            }
            return;
        }
        
        try {
            // Special case for admin user (for backward compatibility)
            if (email === 'admin@admin.com' && password === 'password123') {
                console.log('Admin login attempt');
                
                try {
                    // First try to sign in as admin
                    await signInWithEmailAndPassword(auth, email, password);
                    console.log('Admin login successful');
                } catch (error) {
                    // If admin doesn't exist in Firebase yet, create it
                    if (error.code === 'auth/user-not-found') {
                        console.log('Admin user not found, creating new admin account');
                        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                        
                        // Create admin user document in Firestore
                        const userRef = doc(db, 'users', userCredential.user.uid);
                        await setDoc(userRef, {
                            name: 'Administrator',
                            email: email,
                            role: 'admin',
                            createdAt: new Date().toISOString()
                        });
                        console.log('Admin account created successfully');
                    } else {
                        throw error;
                    }
                }
                
                // Get the admin user data
                const adminUser = {
                    id: auth.currentUser.uid,
                    name: 'Administrator',
                    email: email,
                    role: 'admin'
                };
                
                // Update UI for logged in admin
                this.updateUIForLoggedInUser(adminUser);
                this.showMessage('Admin login successful!', 'success');
                
                // Re-enable login button
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
                }
                
                return;
            }
            
            console.log('Regular user login attempt');
            
            // Regular user login with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Firebase login successful, user:', user);
            
            // Get additional user data from Firestore
            const userRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userRef);
            
            let userData;
            if (docSnap.exists()) {
                const firestoreData = docSnap.data();
                userData = {
                    id: user.uid,
                    name: firestoreData.name || user.displayName || user.email.split('@')[0],
                    email: user.email,
                    phone: firestoreData.phone || ''
                };
            } else {
                userData = {
                    id: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email
                };
                
                // Create a user document in Firestore if it doesn't exist
                await setDoc(userRef, {
                    name: userData.name,
                    email: userData.email,
                    createdAt: new Date().toISOString()
                });
            }
            
            // Update UI with user data
            this.updateUIForLoggedInUser(userData);
            this.showMessage('Login successful!', 'success');
            
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
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your internet connection.';
                    break;
            }
            
            this.showMessage(errorMessage, 'error');
        } finally {
            // Re-enable login button
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
            }
        }
    },
    
    // Register functionality
    register: async function() {
        console.log('Registration attempt started');
        
        // Disable the register button to prevent multiple submissions
        const registerBtn = document.querySelector('#registerForm button[type="submit"]');
        if (registerBtn) {
            registerBtn.disabled = true;
            registerBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Creating Account...';
        }
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsCheck = document.getElementById('termsCheck');
        
        // Validate inputs
        if (!name || !email || !phone || !password || !confirmPassword) {
            this.showMessage('Please fill all fields', 'error');
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.innerHTML = '<i class="bi bi-person-plus me-2"></i>Create Account';
            }
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.innerHTML = '<i class="bi bi-person-plus me-2"></i>Create Account';
            }
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters long', 'error');
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.innerHTML = '<i class="bi bi-person-plus me-2"></i>Create Account';
            }
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.innerHTML = '<i class="bi bi-person-plus me-2"></i>Create Account';
            }
            return;
        }
        
        // Check terms and conditions
        if (termsCheck && !termsCheck.checked) {
            this.showMessage('Please agree to the Terms and Conditions', 'error');
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.innerHTML = '<i class="bi bi-person-plus me-2"></i>Create Account';
            }
            return;
        }
        
        try {
            console.log('Creating user in Firebase Authentication');
            // Create user with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('User created in Firebase Authentication:', user);
            
            // Create user data object
            const userData = {
                id: user.uid,
                name: name,
                email: email,
                phone: phone
            };
            
            console.log('Storing additional user data in Firestore');
            // Store additional user data in Firestore
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                name: name,
                email: email,
                phone: phone,
                createdAt: new Date().toISOString()
            });
            
            console.log('User data stored in Firestore');
            this.showMessage('Registration successful! You are now logged in.', 'success');
            
            // Update UI for logged in user
            this.updateUIForLoggedInUser(userData);
            
            // Redirect to booking page after successful registration
            setTimeout(() => {
                if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                    window.location.href = 'bookings.html';
                }
            }, 1500);
            
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
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your internet connection.';
                    break;
            }
            
            this.showMessage(errorMessage, 'error');
        } finally {
            // Re-enable register button
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.innerHTML = '<i class="bi bi-person-plus me-2"></i>Create Account';
            }
        }
    },
    
    // Logout functionality
    logout: async function() {
        console.log("Logout attempt started");
        
        try {
            // Sign out from Firebase
            await signOut(auth);
            
            console.log("User signed out successfully");
            this.showMessage('Logged out successfully', 'success');
            
            // Clear user data from localStorage
            localStorage.removeItem('currentUser');
            
            // Update UI for logged out user
            this.updateUIForLoggedOutUser();
            
            // Redirect to home if on protected page
            const protectedPages = ['bookings.html', 'my-account.html'];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (protectedPages.includes(currentPage)) {
                console.log("Redirecting from protected page to home");
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showMessage('Error logging out. Please try again.', 'error');
        }
    },
    
    // Update UI for logged in user
    updateUIForLoggedInUser: function(user) {
        console.log('Updating UI for logged in user:', user);
        
        // Store user data in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Update UI elements
        const authButtons = document.querySelectorAll('.auth-buttons');
        const userMenus = document.querySelectorAll('.user-menu');
        const userDisplays = document.querySelectorAll('#userDisplay');
        const logoutBtns = document.querySelectorAll('#logoutBtn');
        
        // Hide auth buttons and show user menu
        authButtons.forEach(el => el.classList.add('d-none'));
        userMenus.forEach(el => el.classList.remove('d-none'));
        
        // Update all username displays
        userDisplays.forEach(el => {
            el.textContent = user.name;
        });
        
        // Add event listeners to all logout buttons
        logoutBtns.forEach(btn => {
            // Remove any existing event listeners to prevent duplicates
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Add new event listener
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
        
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
        console.log('Updating UI for logged out user');
        
        // Clear any stored user data
        localStorage.removeItem('currentUser');
        
        // Show auth buttons and hide user menu
        const authButtons = document.querySelectorAll('.auth-buttons');
        const userMenus = document.querySelectorAll('.user-menu');
        
        authButtons.forEach(el => el.classList.remove('d-none'));
        userMenus.forEach(el => el.classList.add('d-none'));
        
        // Redirect to login page if on protected page
        const protectedPages = ['my-bookings.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
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
