/**
 * Fetches and loads an HTML component into a specified container.
 * @param {string} containerId - The ID of the element to load the component into.
 * @param {string} componentUrl - The URL of the HTML component to load.
 */
function loadComponent(containerId, componentUrl) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }

    fetch(componentUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentUrl}`);
            }
            return response.text();
        })
        .then(html => {
            container.innerHTML = html;
            // Re-run any scripts that need to execute after content is loaded
            if (componentUrl.includes('nav-component.html')) {
                // Re-attach listeners for nav and auth buttons
                updateUIForLoginState(); 
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        logout();
                    });
                }
            } else if (componentUrl.includes('auth-modal.html')) {
                // Re-attach listeners for auth forms and links
                initializeAuthSystem();
            }
        })
        .catch(error => console.error(error));
}

/**
 * Main script for Precious Meals & Bakes.
 * Handles global UI updates based on authentication state and initializes other scripts.
 */

/**
 * Updates all UI elements based on the current login state, using the correct selectors
 * from bookings.html. This is the master function for controlling page visibility.
 */
function updateUIForLoginState() {
    console.log('SCRIPT.JS: Running updateUIForLoginState...');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    // Get UI elements
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const userDisplay = document.getElementById('userDisplay');
    const loginContainer = document.getElementById('login-container');
    const bookingInterfaceContainer = document.getElementById('booking-interface-container');
    const allBookingsBtn = document.getElementById('all-bookings-btn');

    console.log('SCRIPT.JS: Checking for UI elements:', {
        authButtons,
        userMenu,
        userDisplay,
        loginContainer,
        bookingInterfaceContainer
    });

    if (loggedInUser) {
        console.log(`SCRIPT.JS: User '${loggedInUser.name}' is logged in. Showing logged-in UI.`);
        if (authButtons) authButtons.classList.add('d-none');
        if (userMenu) userMenu.classList.remove('d-none');
        if (userDisplay) userDisplay.textContent = loggedInUser.name;
        
        if (loginContainer) {
            console.log('SCRIPT.JS: Hiding login prompt.');
            loginContainer.classList.add('d-none');
        }
        if (bookingInterfaceContainer) {
            console.log('SCRIPT.JS: Showing booking interface.');
            bookingInterfaceContainer.classList.remove('d-none');
        }

        if (allBookingsBtn) {
            allBookingsBtn.classList.toggle('d-none', loggedInUser.role !== 'admin');
        }

        if (typeof initializeBookingInterface === 'function') {
            console.log('SCRIPT.JS: Initializing booking interface.');
            initializeBookingInterface();
        }

    } else {
        console.log('SCRIPT.JS: No user logged in. Showing logged-out UI.');
        if (authButtons) authButtons.classList.remove('d-none');
        if (userMenu) userMenu.classList.add('d-none');

        if (loginContainer) {
            console.log('SCRIPT.JS: Showing login prompt.');
            loginContainer.classList.remove('d-none');
        }
        if (bookingInterfaceContainer) {
            console.log('SCRIPT.JS: Hiding booking interface.');
            bookingInterfaceContainer.classList.add('d-none');
        }
    }
    console.log('SCRIPT.JS: updateUIForLoginState finished.');
}

/**
 * Handles user logout by clearing session data and reloading the page.
 */
function logout() {
    console.log('SCRIPT.JS: Logging out user.');
    localStorage.removeItem('loggedInUser');
    window.location.reload(); // Reload for a clean state
}

// --- Main execution block ---
// The script is at the end of the body, so we can initialize directly.
console.log('SCRIPT.JS: Initializing scripts.');

if (typeof AOS !== 'undefined') {
    AOS.init();
}

// Listen for the 'loginSuccess' event from auth.js
document.addEventListener('loginSuccess', () => {
    console.log('SCRIPT.JS: `loginSuccess` event detected. Triggering UI update.');
    updateUIForLoginState();
});

// Set up the logout button listener using the correct ID from the HTML
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

// Perform an initial UI check on page load
updateUIForLoginState();


