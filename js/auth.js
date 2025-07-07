document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:5000/api';

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authMessage = document.getElementById('authMessage');
    const logoutBtn = document.getElementById('logoutBtn');

    // --- Event Listeners ---

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await handleLogin(email, password);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                showAuthMessage('Passwords do not match.', 'danger');
                return;
            }
            await handleRegister(username, email, password);
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    // --- API Functions ---

    async function handleLogin(email, password) {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('loggedInUser', JSON.stringify(result.user));
                updateAuthState(true, result.user.username);
                const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                if (authModal) {
                    authModal.hide();
                }
                if (window.location.pathname.includes('bookings.html')) {
                    document.getElementById('login-container').classList.add('d-none');
                    document.getElementById('booking-interface-container').classList.remove('d-none');
                    if (typeof initializeBookingInterface === 'function') {
                        initializeBookingInterface();
                    }
                }
            } else {
                showAuthMessage(result.message, 'danger');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAuthMessage('An error occurred during login. Please try again.', 'danger');
        }
    }

    async function handleRegister(username, email, password) {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const result = await response.json();

            if (response.ok) {
                showAuthMessage('Registration successful! Please log in.', 'success');
                const signinTab = new bootstrap.Tab(document.getElementById('signin-tab'));
                signinTab.show();
            } else {
                showAuthMessage(result.message, 'danger');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAuthMessage('An error occurred during registration. Please try again.', 'danger');
        }
    }

    function handleLogout() {
        localStorage.removeItem('loggedInUser');
        updateAuthState(false);

        if (typeof resetBookingInterface === 'function') {
            resetBookingInterface();
        }

        if (window.location.pathname.includes('bookings.html')) {
            document.getElementById('login-container').classList.remove('d-none');
            document.getElementById('booking-interface-container').classList.add('d-none');
        }
    }

    // --- UI Update Functions ---

    function showAuthMessage(message, type = 'danger') {
        if (authMessage) {
            authMessage.textContent = message;
            authMessage.className = `mt-3 text-center alert alert-${type}`;
            authMessage.classList.remove('d-none');
        }
    }

    function updateAuthState(isLoggedIn, username = '') {
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        const userDisplay = document.getElementById('userDisplay');

        if (isLoggedIn) {
            authButtons.classList.add('d-none');
            userMenu.classList.remove('d-none');
            userDisplay.textContent = username;

            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            if (loggedInUser && loggedInUser.role === 'admin') {
                document.getElementById('all-bookings-btn')?.classList.remove('d-none');
            } else {
                document.getElementById('all-bookings-btn')?.classList.add('d-none');
            }
        } else {
            authButtons.classList.remove('d-none');
            userMenu.classList.add('d-none');
            userDisplay.textContent = 'User';
        }
    }
    
    // --- Initial Check on Page Load ---

    function checkInitialAuthState() {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (loggedInUser && loggedInUser.username) {
            
            if (window.location.pathname.includes('bookings.html')) {
                document.getElementById('login-container').classList.add('d-none');
                document.getElementById('booking-interface-container').classList.remove('d-none');
                if (typeof initializeBookingInterface === 'function') {
                    initializeBookingInterface();
                }
            }
        } else {
            updateAuthState(false);
             if (window.location.pathname.includes('bookings.html')) {
                document.getElementById('login-container').classList.remove('d-none');
                document.getElementById('booking-interface-container').classList.add('d-none');
            }
        }
    }

    checkInitialAuthState();
});
