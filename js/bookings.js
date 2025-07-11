// This file handles all client-side logic for the bookings page,
// including form handling, loading dynamic content, and admin functions.

// --- Event Listeners and Initialization ---

let isBookingInterfaceInitialized = false;

function resetBookingInterface() {
    isBookingInterfaceInitialized = false;
    console.log('Booking interface state has been reset.');
}

/**
 * Initializes the entire booking interface: calendar and button listeners.
 * This function is idempotent and can be safely called multiple times.
 */
function initializeBookingInterface() {
    // Prevents re-attaching event listeners
    if (isBookingInterfaceInitialized) {
        return;
    }
    console.log('Initializing booking interface for the first time...');

    // Add event listeners to the main navigation buttons
    document.getElementById('new-booking-btn')?.addEventListener('click', () => {
        loadContentFromTemplate('template-new-booking', initializeBookingForm);
    });

    document.getElementById('my-bookings-btn')?.addEventListener('click', () => {
        loadContentFromTemplate('template-my-bookings', loadMyBookings);
    });

    document.getElementById('all-bookings-btn')?.addEventListener('click', () => {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        if (loggedInUser.role === 'admin') {
            loadContentFromTemplate('template-admin-panel', loadAllBookings);
        }
    });

    // Initialize the calendar view
    initializeCalendar();

    isBookingInterfaceInitialized = true;
    console.log('Booking interface initialized.');
}

// --- Dynamic Content Loading ---
function loadContentFromTemplate(templateId, callback) {
    const dynamicContentContainer = document.getElementById('dynamic-content-container');
    if (!dynamicContentContainer) return;

    const template = document.getElementById(templateId);
    if (!template) {
        console.error(`Template with ID ${templateId} not found.`);
        return;
    }

    dynamicContentContainer.innerHTML = '';
    const content = template.content.cloneNode(true);
    dynamicContentContainer.appendChild(content);
    dynamicContentContainer.classList.remove('d-none');

    // Add event listener for the close button within the loaded template
    const closeBtn = dynamicContentContainer.querySelector('#close-dynamic-content');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            dynamicContentContainer.innerHTML = '';
            dynamicContentContainer.classList.add('d-none');
        });
    }

    // Execute a callback function if one is provided (e.g., to initialize a form)
    if (callback && typeof callback === 'function') {
        callback();
    }
}

// --- Booking Form Logic ---
function initializeBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    if (!bookingForm) return;

    const nextButtons = bookingForm.querySelectorAll('.next-step');
    const prevButtons = bookingForm.querySelectorAll('.prev-step');
    const formSteps = bookingForm.querySelectorAll('.form-step');
    let currentStep = 0;

    const updateFormSteps = () => {
        formSteps.forEach((step, index) => step.classList.toggle('active', index === currentStep));
        const stepper = document.querySelector('.stepper-wrapper');
        if (stepper) {
            const items = stepper.querySelectorAll('.stepper-item');
            items.forEach((step, index) => {
                step.classList.toggle('active', index === currentStep);
                if (index < currentStep) step.classList.add('completed');
            });
        }
        if (currentStep === 2) updateBookingSummary();
    };

    const validateStep = (step) => {
        const inputs = formSteps[step].querySelectorAll('input[required], select[required]');
        let isValid = true;
        inputs.forEach(input => {
            if (!input.value) {
                isValid = false;
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
            }
        });
        return isValid;
    };

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                updateFormSteps();
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentStep--;
            updateFormSteps();
        });
    });

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!document.getElementById('termsCheck').checked) {
            alert('You must agree to the terms and conditions.');
            return;
        }

        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!loggedInUser || !loggedInUser.userId) {
            alert('You must be logged in to make a booking.');
            return;
        }

        const bookingData = {
            userId: loggedInUser.userId,
            eventDate: document.getElementById('eventDate').value,
            eventType: document.getElementById('eventType').value,
            timeSlot: document.getElementById('timeSlot').value,
            guestCount: document.getElementById('guestCount').value,
            contactNumber: document.getElementById('contactNumber').value,
            eventLocation: document.getElementById('eventLocation').value,
            specialRequests: document.getElementById('specialRequests').value,
        };

        fetch('http://127.0.0.1:5000/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.bookingId) {
                alert('Booking submitted successfully! Your booking is pending confirmation.');
                document.getElementById('dynamic-content-container').classList.add('d-none');
                document.getElementById('my-bookings-btn')?.click();
            } else {
                alert(`Booking failed: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Booking submission error:', error);
            alert('An error occurred while submitting your booking.');
        });
    });

    updateFormSteps();
}

function updateBookingSummary() {
    const eventDate = document.getElementById('eventDate').value;
    const eventType = document.getElementById('eventType').value;
    const timeSlot = document.getElementById('timeSlot').value;
    const guestCount = document.getElementById('guestCount').value;
    const contactNumber = document.getElementById('contactNumber').value;
    const eventLocation = document.getElementById('eventLocation').value;
    const specialRequests = document.getElementById('specialRequests').value;

    const summary = `
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Time:</strong> ${timeSlot}</p>
        <p><strong>Event Type:</strong> ${eventType}</p>
        <p><strong>Guests:</strong> ${guestCount}</p>
        <p><strong>Contact:</strong> ${contactNumber}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
        <p><strong>Special Requests:</strong> ${specialRequests || 'None'}</p>
    `;
    document.getElementById('bookingSummary').innerHTML = summary;
}

// --- User-Facing Bookings ---
function loadMyBookings() {
    const myBookingsList = document.getElementById('myBookingsList');
    if (!myBookingsList) return;

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser || !loggedInUser.userId) {
        myBookingsList.innerHTML = '<p class="text-center">Please log in to see your bookings.</p>';
        return;
    }

    fetch(`http://127.0.0.1:5000/api/bookings?userId=${loggedInUser.userId}`)
        .then(response => response.json())
        .then(userBookings => {
            if (userBookings.length === 0) {
                myBookingsList.innerHTML = '<p class="text-center">You have no bookings yet.</p>';
                return;
            }

            myBookingsList.innerHTML = '';
            userBookings.forEach(booking => {
                const bookingItem = document.createElement('a');
                bookingItem.href = '#';
                bookingItem.className = 'list-group-item list-group-item-action flex-column align-items-start';

                let statusClass = 'secondary';
                if (booking.status === 'Confirmed') statusClass = 'success';
                else if (booking.status === 'Rejected') statusClass = 'danger';
                else if (booking.status === 'Pending') statusClass = 'warning';

                bookingItem.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">${booking.event_type}</h5>
                        <small>${new Date(booking.event_date).toDateString()}</small>
                    </div>
                    <p class="mb-1">Guests: ${booking.guest_count} | Status: <span class="badge bg-${statusClass}">${booking.status}</span></p>
                    <small class="text-muted">Click to view details</small>
                `;

                bookingItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    showBookingDetails(booking);
                });

                myBookingsList.appendChild(bookingItem);
            });
        })
        .catch(error => {
            console.error('Error fetching bookings:', error);
            myBookingsList.innerHTML = '<p class="text-center text-danger">Could not load bookings. Please try again later.</p>';
        });
}

function showBookingDetails(booking) {
    const detailsContent = document.getElementById('bookingDetailsContent');
    if (!detailsContent) return;

    let statusClass = 'secondary';
    if (booking.status === 'Confirmed') statusClass = 'success';
    else if (booking.status === 'Rejected') statusClass = 'danger';
    else if (booking.status === 'Pending') statusClass = 'warning';

    detailsContent.innerHTML = `
        <h4>${booking.event_type}</h4>
        <hr>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p><strong>Date:</strong> ${new Date(booking.event_date).toDateString()}</p>
        <p><strong>Time:</strong> ${booking.time_slot}</p>
        <p><strong>Contact Number:</strong> ${booking.contact_number}</p>
        <p><strong>Event Location:</strong> ${booking.event_location}</p>
        <p><strong>Number of Guests:</strong> ${booking.guest_count}</p>
        <p><strong>Special Requests:</strong> ${booking.special_requests || 'None'}</p>
        <p><strong>Status:</strong> <span class="badge bg-${statusClass}">${booking.status}</span></p>
    `;

    const bookingDetailsModal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
    bookingDetailsModal.show();
}

// --- Admin Functions ---
function loadAllBookings() {
    const allBookingsList = document.getElementById('allBookingsList');
    if (!allBookingsList) return;

    fetch('http://127.0.0.1:5000/api/admin/bookings')
        .then(response => response.json())
        .then(allBookings => {
            if (allBookings.length === 0) {
                allBookingsList.innerHTML = '<p class="text-center">There are no bookings yet.</p>';
                return;
            }

            const tableHTML = `
                <table class="table table-hover table-sm">
                    <thead class="table-light">
                        <tr>
                            <th>Customer</th>
                            <th>Event Date</th>
                            <th>Event Type</th>
                            <th>Guests</th>
                            <th>Contact</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allBookings.map(booking => {
                            let statusClass = 'secondary';
                            if (booking.status === 'Confirmed') statusClass = 'success';
                            else if (booking.status === 'Rejected') statusClass = 'danger';
                            else if (booking.status === 'Pending') statusClass = 'warning';
                            return `
                                <tr>
                                    <td>${booking.username}<br><small class="text-muted">${booking.email}</small></td>
                                    <td>${new Date(booking.event_date).toLocaleDateString()}</td>
                                    <td>${booking.event_type}</td>
                                    <td>${booking.guest_count}</td>
                                    <td>${booking.contact_number}</td>
                                    <td>${booking.event_location}</td>
                                    <td><span class="badge bg-${statusClass}">${booking.status}</span></td>
                                    <td>
                                        ${booking.status === 'pending' ? `
                                            <button class="btn btn-success btn-sm approve-btn" data-id="${booking.id}">Approve</button>
                                            <button class="btn btn-danger btn-sm reject-btn" data-id="${booking.id}">Reject</button>
                                        ` : `
                                            <button class="btn btn-secondary btn-sm" disabled>Handled</button>
                                        `}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;

            allBookingsList.innerHTML = tableHTML;

            // Add event listeners for the admin action buttons
            allBookingsList.querySelectorAll('.approve-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const bookingId = e.currentTarget.getAttribute('data-id');
                    updateBookingStatus(bookingId, 'Confirmed');
                });
            });

            allBookingsList.querySelectorAll('.reject-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const bookingId = e.currentTarget.getAttribute('data-id');
                    updateBookingStatus(bookingId, 'Rejected');
                });
            });
        })
        .catch(error => {
            console.error('Error fetching all bookings:', error);
            allBookingsList.innerHTML = '<p class="text-center text-danger">Could not load bookings. Please try again later.</p>';
        });
}

function updateBookingStatus(bookingId, newStatus) {
    fetch(`http://127.0.0.1:5000/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update booking status');
        }
        return response.json();
    })
    .then(data => {
        console.log(data.message);
        // Refresh both admin and user views
        if (document.getElementById('allBookingsList')) {
            loadAllBookings();
        }
        if (document.getElementById('myBookingsList')) {
            loadMyBookings();
        }
    })
    .catch(error => {
        console.error('Error updating booking status:', error);
        alert('Could not update booking status. Please try again.');
    });
}

// --- Calendar Logic ---
function initializeCalendar() {
    const calendarContainer = document.getElementById('bookingsCalendar');
    if (!calendarContainer) return;

    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    function renderCalendar(month, year) {
        calendarContainer.innerHTML = '';

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
                if (selected) selected.classList.remove('selected');
                dayCell.classList.add('selected');
                const eventDateInput = document.getElementById('eventDate');
                if(eventDateInput) eventDateInput.value = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            });
            calendarGrid.appendChild(dayCell);
        }

        calendarContainer.appendChild(calendarGrid);
    }

    renderCalendar(currentMonth, currentYear);
}
