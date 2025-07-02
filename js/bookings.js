// Show calendar and nav buttons after login
function showBookingInterfaceAfterLogin() {
    document.getElementById('bookingNavButtons').style.display = 'block';
    document.getElementById('bookingsCalendarContainer').classList.remove('d-none');
    document.getElementById('bookingFormCard').classList.add('d-none');
    document.getElementById('myBookingsContainer').classList.add('d-none');
    // Hide login prompt if present
    var loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) loginPrompt.classList.add('d-none');
}

// This function shows the correct UI elements for a logged-in user.
function showLoggedInView() {
    const bookingsNav = document.getElementById('bookingsNav');
    if (bookingsNav) bookingsNav.classList.remove('d-none');

    const loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) loginPrompt.classList.add('d-none');

    const bookingsCalendarContainer = document.getElementById('bookingsCalendarContainer');
    if (bookingsCalendarContainer) {
        bookingsCalendarContainer.classList.remove('d-none');
    }

    // Also hide the main landing page auth button if it exists
    updateLandingAuthButton();
}

window.addEventListener('DOMContentLoaded', function() {
    // On page load, check if the user is already logged in.
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.name) {
        // If logged in, show the appropriate interface.
        showLoggedInView();
    }

    // Listen for the custom loginSuccess event dispatched from script.js
    document.addEventListener('loginSuccess', function() {
        showLoggedInView();
    });

    // Section visibility logic
    const showBookingFormBtn = document.getElementById('showBookingFormBtn');
    const showMyBookingsBtn = document.getElementById('showMyBookingsBtn');
    const backToBookingBtn = document.getElementById('backToBookingBtn');
    
    const bookingSection = document.getElementById('booking');
    const bookingFormCard = document.getElementById('bookingFormCard');
    const myBookingsContainer = document.getElementById('myBookingsContainer');
    const bookingsCalendarContainer = document.getElementById('bookingsCalendarContainer');
    const landingAuthButtonContainer = document.getElementById('landingAuthButtonContainer');

    function showInitialView() {
        if (bookingsCalendarContainer) bookingsCalendarContainer.classList.remove('d-none');
        if (myBookingsContainer) myBookingsContainer.classList.add('d-none');
        if (bookingSection) bookingSection.classList.add('d-none');
        if (bookingFormCard) bookingFormCard.classList.add('d-none');
    }

    if (showBookingFormBtn) {
        showBookingFormBtn.addEventListener('click', function() {
            if (bookingSection) bookingSection.classList.remove('d-none');
            if (bookingFormCard) bookingFormCard.classList.remove('d-none');
            if (myBookingsContainer) myBookingsContainer.classList.add('d-none');
            if (bookingsCalendarContainer) bookingsCalendarContainer.classList.add('d-none');
            if (landingAuthButtonContainer) landingAuthButtonContainer.style.display = 'none';
            if (bookingFormCard) bookingFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    if (showMyBookingsBtn) {
        showMyBookingsBtn.addEventListener('click', function() {
            if (myBookingsContainer) myBookingsContainer.classList.remove('d-none');
            if (bookingSection) bookingSection.classList.add('d-none');
            if (bookingFormCard) bookingFormCard.classList.add('d-none');
            if (bookingsCalendarContainer) bookingsCalendarContainer.classList.add('d-none');
            if (landingAuthButtonContainer) landingAuthButtonContainer.style.display = 'none';
            if (myBookingsContainer) myBookingsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    if (backToBookingBtn) {
        backToBookingBtn.addEventListener('click', function() {
            showInitialView();
        });
    }

    // Multi-step form logic
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    const formSteps = document.querySelectorAll('.form-step');
    const stepperItems = document.querySelectorAll('.stepper-item');

    let currentStep = 0;

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentStep++;
            updateFormSteps();
            updateStepper();
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentStep--;
            updateFormSteps();
            updateStepper();
        });
    });

    function updateFormSteps() {
        formSteps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStep);
        });
    }

    function updateStepper() {
        stepperItems.forEach((item, index) => {
            if (index < currentStep) {
                item.classList.add('completed');
                item.classList.remove('active');
            } else if (index === currentStep) {
                item.classList.add('active');
                item.classList.remove('completed');
            } else {
                item.classList.remove('active', 'completed');
            }
        });
    }

    // Logic for booking summary
    const bookingSummary = document.getElementById('bookingSummary');
    const step2Button = document.querySelector('#step-2 .next-step');
    if(step2Button) {
        step2Button.addEventListener('click', () => {
            const eventDate = document.getElementById('eventDate').value;
            const eventType = document.getElementById('eventType').value;
            const timeSlot = document.getElementById('timeSlot').value;
            const guestCount = document.getElementById('guestCount').value;
            const specialRequests = document.getElementById('specialRequests').value;

            bookingSummary.innerHTML = `
                <p><strong>Event Date:</strong> ${eventDate}</p>
                <p><strong>Event Type:</strong> ${eventType}</p>
                <p><strong>Time Slot:</strong> ${timeSlot}</p>
                <p><strong>Number of Guests:</strong> ${guestCount}</p>
                <p><strong>Special Requests:</strong> ${specialRequests || 'None'}</p>
            `;
        });
    }

    // Calendar logic
    const calendarContainer = document.getElementById('bookingsCalendar');
    if (calendarContainer) {
        const today = new Date();
        let currentMonth = today.getMonth();
        let currentYear = today.getFullYear();

        function renderCalendar(month, year) {
            calendarContainer.innerHTML = ''; // Clear previous calendar

            const header = document.createElement('div');
            header.className = 'calendar-header';

            const prevButton = document.createElement('button');
            prevButton.id = 'prevMonthBtn';
            prevButton.className = 'calendar-nav-btn';
            prevButton.innerHTML = '<i class="bi bi-chevron-left"></i>';
            prevButton.onclick = () => {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                renderCalendar(currentMonth, currentYear);
            };

            const monthYearElement = document.createElement('h3');
            monthYearElement.id = 'calendarMonth';
            monthYearElement.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;

            const nextButton = document.createElement('button');
            nextButton.id = 'nextMonthBtn';
            nextButton.className = 'calendar-nav-btn';
            nextButton.innerHTML = '<i class="bi bi-chevron-right"></i>';
            nextButton.onclick = () => {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                renderCalendar(currentMonth, currentYear);
            };

            header.appendChild(prevButton);
            header.appendChild(monthYearElement);
            header.appendChild(nextButton);
            calendarContainer.appendChild(header);

            const daysHeader = document.createElement('div');
            daysHeader.className = 'calendar-grid';
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            days.forEach(day => {
                const dayHeaderEl = document.createElement('div');
                dayHeaderEl.className = 'calendar-day-header';
                dayHeaderEl.textContent = day;
                daysHeader.appendChild(dayHeaderEl);
            });
            calendarContainer.appendChild(daysHeader);

            const calendarGrid = document.createElement('div');
            calendarGrid.className = 'calendar-grid';
            calendarGrid.id = 'calendarDays';

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for (let i = 0; i < firstDay; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-day other-month';
                calendarGrid.appendChild(emptyCell);
            }

            for (let i = 1; i <= daysInMonth; i++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day';
                dayCell.textContent = i;
                
                const todayDate = new Date();
                if (year === todayDate.getFullYear() && month === todayDate.getMonth() && i === todayDate.getDate()) {
                    dayCell.classList.add('today');
                }

                dayCell.addEventListener('click', () => {
                    const selected = document.querySelector('.calendar-day.selected');
                    if (selected) {
                        selected.classList.remove('selected');
                    }
                    dayCell.classList.add('selected');
                    document.getElementById('eventDate').value = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                });
                calendarGrid.appendChild(dayCell);
            }
            
            calendarContainer.appendChild(calendarGrid);
        }

        renderCalendar(currentMonth, currentYear);
    }
});
// Show or hide landing auth button based on login status
function updateLandingAuthButton() {
    var landingAuthButtonContainer = document.getElementById('landingAuthButtonContainer');
    var currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        landingAuthButtonContainer.style.display = 'block';
    } else {
        landingAuthButtonContainer.style.display = 'none';
    }
}
window.addEventListener('DOMContentLoaded', updateLandingAuthButton);
// Also call after login/logout
if (window.AuthSystem) {
    var origUpdateUIForLoggedInUser = AuthSystem.updateUIForLoggedInUser;
    AuthSystem.updateUIForLoggedInUser = function(user) {
        if (origUpdateUIForLoggedInUser) origUpdateUIForLoggedInUser.call(AuthSystem, user);
        updateLandingAuthButton();
    };
    var origUpdateUIForLoggedOutUser = AuthSystem.updateUIForLoggedOutUser;
    AuthSystem.updateUIForLoggedOutUser = function() {
        if (origUpdateUIForLoggedOutUser) origUpdateUIForLoggedOutUser.call(AuthSystem);
        updateLandingAuthButton();
    };
}
