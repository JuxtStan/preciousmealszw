/**
 * Main JavaScript file for Precious Meals & Bakes
 */

// All authentication, login, registration, and user UI update functions and event listeners have been removed from this file. Only non-auth related UI logic remains. Authentication and UI updates are now handled exclusively by js/auth.js.

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Update UI based on login status
    if (currentUser && currentUser.name) {
        updateUIForLoggedInUser(currentUser);
    } else {
        updateUIForLoggedOutUser();
    }
    
    // Add event handlers for the booking page login prompt buttons
    const promptLoginBtn = document.getElementById('promptLoginBtn');
    const promptRegisterBtn = document.getElementById('promptRegisterBtn');
    
    if (promptLoginBtn) {
        promptLoginBtn.addEventListener('click', function() {
            showLoginForm();
        });
    }
    
    if (promptRegisterBtn) {
        promptRegisterBtn.addEventListener('click', function() {
            showRegisterForm();
        });
    }
    
    // Handle logout
    const logoutBtns = document.querySelectorAll('#logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    });
    
    // Show login form when login button is clicked
    const loginBtns = document.querySelectorAll('[data-bs-target="#authModal"]:not(#navRegisterBtn)');
    loginBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            showLoginForm();
        });
    });
    
    // Show register form when register button is clicked
    const registerBtns = document.querySelectorAll('#navRegisterBtn');
    registerBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            showRegisterForm();
        });
    });
    
    // Switch between login and register forms
    const showRegisterBtns = document.querySelectorAll('#showRegisterBtn');
    showRegisterBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            showRegisterForm();
        });
    });
    
    const showLoginBtns = document.querySelectorAll('#showLoginBtn');
    showLoginBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginForm();
        });
    });
    
    // Handle login form submission
    const loginForms = document.querySelectorAll('#loginForm');
    loginForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            loginUser();
        });
    });
    
    // Handle register form submission
    const registerForms = document.querySelectorAll('#registerForm');
    registerForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            registerUser();
        });
    });
});

// Show login form
function showLoginForm() {
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const authModalLabel = document.getElementById('authModalLabel');
    
    if (loginFormContainer && registerFormContainer) {
        loginFormContainer.classList.remove('d-none');
        registerFormContainer.classList.add('d-none');
        
        if (authModalLabel) {
            authModalLabel.textContent = 'Login to Your Account';
        }
    }
}

// Show register form
function showRegisterForm() {
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const authModalLabel = document.getElementById('authModalLabel');
    
    if (loginFormContainer && registerFormContainer) {
        loginFormContainer.classList.add('d-none');
        registerFormContainer.classList.remove('d-none');
        
        if (authModalLabel) {
            authModalLabel.textContent = 'Create an Account';
        }
    }
}

// Login user
function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const authMessage = document.getElementById('authMessage');
    
    if (!email || !password) {
        showMessage('Please enter both email and password', 'error');
        return;
    }
    
    // Admin user for testing
    if (email === 'admin@admin.com' && password === 'password123') {
        const adminUser = {
            id: 'admin-' + Date.now(),
            name: 'Administrator',
            email: 'admin@admin.com',
            role: 'admin'
        };
        
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        document.dispatchEvent(new CustomEvent('loginSuccess'));
        showMessage('Login successful! Welcome, Administrator.', 'success');
        updateUIForLoggedInUser(adminUser);
        
        // Close modal after login
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            if (modal) modal.hide();
            
            // Redirect to bookings page if on homepage
            if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html')) {
                window.location.href = 'bookings.html';
            } else {
                // Reload current page to update UI
                window.location.reload();
            }
        }, 1000);
    } else {
        showMessage('Invalid email or password. Try admin@admin.com / password123', 'error');
    }
}

// Register user
function registerUser() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!name || !email || !phone || !password || !confirmPassword) {
        showMessage('Please fill all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: 'user-' + Date.now(),
        name: name,
        email: email,
        phone: phone,
        role: 'user'
    };
    
    // Store user in localStorage
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    document.dispatchEvent(new CustomEvent('loginSuccess'));
    
    showMessage('Registration successful! You are now logged in.', 'success');
    updateUIForLoggedInUser(newUser);
    
    // Close modal after registration
    setTimeout(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        if (modal) modal.hide();
        
        // Redirect to bookings page if on homepage
        if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html')) {
            window.location.href = 'bookings.html';
        } else {
            // Reload current page to update UI
            window.location.reload();
        }
    }, 1000);
}

// Logout user
function logoutUser() {
    localStorage.removeItem('currentUser');
    updateUIForLoggedOutUser();
    showMessage('Logged out successfully', 'success');
    
    // Redirect to homepage if on protected page
    const protectedPages = ['bookings.html#myBookings'];
    const currentPage = window.location.pathname.split('/').pop() + window.location.hash;
    
    if (protectedPages.includes(currentPage)) {
        window.location.href = 'index.html';
    } else {
        // Reload current page to update UI
        window.location.reload();
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    // Update username displays
    const userDisplays = document.querySelectorAll('.user-name');
    userDisplays.forEach(display => {
        display.textContent = user.name;
    });
    
    // Hide auth buttons and show user menu
    const authButtons = document.querySelectorAll('.auth-buttons');
    const userMenus = document.querySelectorAll('.user-menu');
    
    authButtons.forEach(button => button.classList.add('d-none'));
    userMenus.forEach(menu => menu.classList.remove('d-none'));
    
    // Page-specific logic for showing elements after login (like on the bookings page)
    // is now handled within the page's own script (e.g., bookings.js) to avoid conflicts.
}

// Fallback function to show booking elements directly if the main function is not available
function showBookingElementsDirectly() {
    // Hide login prompt and show booking form
    const loginPrompt = document.getElementById('loginPrompt');
    const bookingFormCard = document.getElementById('bookingFormCard');
    
    if (loginPrompt) {
        loginPrompt.classList.add('d-none');
    }
    
    if (bookingFormCard) {
        bookingFormCard.classList.remove('d-none');
    }
    
    // Show bookings calendar
    const calendarContainer = document.getElementById('bookingsCalendarContainer');
    if (calendarContainer) calendarContainer.classList.remove('d-none');
    
    // Show previous bookings
    const bookingsContainer = document.getElementById('myBookingsContainer');
    if (bookingsContainer) bookingsContainer.classList.remove('d-none');
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    // Show auth buttons and hide user menu
    const authButtons = document.querySelectorAll('.auth-buttons');
    const userMenus = document.querySelectorAll('.user-menu');
    
    authButtons.forEach(button => button.classList.remove('d-none'));
    userMenus.forEach(menu => menu.classList.add('d-none'));
}

// Show message
function showMessage(message, type) {
    const authMessage = document.getElementById('authMessage');
    
    if (authMessage) {
        authMessage.textContent = message;
        authMessage.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
        authMessage.classList.remove('d-none');
        
        // Hide message after 3 seconds
        setTimeout(() => {
            authMessage.classList.add('d-none');
        }, 3000);
    } else {
        // Fallback if auth message element not found
        alert(message);
    }
}
