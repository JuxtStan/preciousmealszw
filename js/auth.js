/**
 * Authentication System for Precious Meals & Bakes
 * Handles user registration, login, and dispatches 'loginSuccess' event.
 */

// --- CORE AUTHENTICATION FUNCTIONS ---

/**
 * Logs a user in by validating credentials and updating the session.
 */
function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showMessage('Please enter both email and password', 'error');
        return;
    }

    // Hardcoded admin user
    if (email === 'admin@admin.com' && password === 'password123') {
        const adminUser = { id: 'admin-001', name: 'Admin', email: 'admin@admin.com', role: 'admin' };
        finalizeLogin(adminUser, 'Admin login successful!');
        return;
    }

    // Regular user
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        finalizeLogin(user, 'Login successful!');
    } else {
        showMessage('Invalid email or password', 'error');
    }
}

/**
 * Registers a new user, validates input, and logs them in.
 */
function registerUser() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
        return showMessage('Please fill in all fields', 'error');
    }
    if (password !== confirmPassword) {
        return showMessage('Passwords do not match', 'error');
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.email === email)) {
        return showMessage('An account with this email already exists', 'error');
    }

    const newUser = {
        id: 'user-' + Date.now(),
        name: name,
        email: email,
        password: password, // In a real app, this should be hashed!
        role: 'customer'
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    finalizeLogin(newUser, 'Registration successful! You are now logged in.');
}

/**
 * Central function to finalize the login process.
 * @param {object} userObject - The user object to save to the session.
 * @param {string} successMessage - The message to show the user.
 */
function finalizeLogin(userObject, successMessage) {
    // 1. Save user to localStorage
    localStorage.setItem('loggedInUser', JSON.stringify(userObject));
    
    // 2. Show success message
    showMessage(successMessage, 'success');

    // 3. Dispatch the event that the rest of the app listens for
    // This is the most critical part.
    console.log('Dispatching loginSuccess event from auth.js');
    document.dispatchEvent(new CustomEvent('loginSuccess'));

    // 4. Close the modal after a short delay to allow the user to see the message
    closeAuthModal();
}


// --- UTILITY FUNCTIONS ---

/**
 * Displays a message in the authentication modal.
 * @param {string} message - The text to display.
 * @param {'success'|'error'} type - The type of message.
 */
function showMessage(message, type) {
    const messageElement = document.getElementById('authMessage');
    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.className = `mt-3 text-center alert alert-${type === 'error' ? 'danger' : 'success'}`;
}

/**
 * Closes the Bootstrap authentication modal.
 */
function closeAuthModal() {
    const authModalEl = document.getElementById('authModal');
    if (!authModalEl) return;

    // Hide the modal after a short delay
    setTimeout(() => {
        const modal = bootstrap.Modal.getInstance(authModalEl);
        if (modal) {
            modal.hide();
        }
        // Clear message after modal closes
        const messageElement = document.getElementById('authMessage');
        if(messageElement) messageElement.className = 'd-none';
    }, 1200);
}


// --- FORM SWITCHING & INITIALIZATION ---

/**
 * Shows the login form and hides the registration form.
 */
function showLoginForm() {
    document.getElementById('login-form-container').classList.remove('d-none');
    document.getElementById('register-form-container').classList.add('d-none');
    document.getElementById('authModalLabel').textContent = 'Login';
}

/**
 * Shows the registration form and hides the login form.
 */
function showRegisterForm() {
    document.getElementById('login-form-container').classList.add('d-none');
    document.getElementById('register-form-container').classList.remove('d-none');
    document.getElementById('authModalLabel').textContent = 'Register';
}

/**
 * Attaches all necessary event listeners for the authentication modal.
 * This function is called after the modal is loaded into the DOM.
 */
function initializeAuthSystem() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginUser();
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            registerUser();
        });
    }

    const showRegisterLink = document.getElementById('show-register-link');
    if(showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }

    const showLoginLink = document.getElementById('show-login-link');
    if(showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
}

// --- EVENT LISTENERS ---

// The initializeAuthSystem function is now called from script.js after the modal is loaded.

