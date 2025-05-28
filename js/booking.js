/**
 * Booking System for Precious Meals & Bakes
 * Handles calendar, availability checking, and booking management
 */

const BookingSystem = {
    // System configuration
    config: {
        minDaysInAdvance: 2, // Minimum days required to book in advance
        maxDaysInFuture: 90, // Maximum days in future that can be booked
        workingHours: {
            start: 8, // 8 AM
            end: 18   // 6 PM
        },
        timeSlotDuration: 60, // in minutes
        // Preset booked dates for demonstration
        presetBookedDates: [
            { date: '2025-06-01', timeSlot: '10:00', type: 'Wedding' },
            { date: '2025-06-05', timeSlot: '14:00', type: 'Corporate Event' },
            { date: '2025-06-10', timeSlot: '12:00', type: 'Birthday Party' }
        ]
    },
    
    // Initialize the booking system
    init: function() {
        // Add preset bookings to localStorage for demonstration
        this.initializePresetBookings();
        
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize the date picker
            const dateInput = document.getElementById('eventDate');
            if (dateInput) {
                this.setupDatePicker(dateInput);
                dateInput.addEventListener('change', () => {
                    this.updateTimeSlots(dateInput.value);
                });
            }
            
            // Event type change
            const eventType = document.getElementById('eventType');
            if (eventType) {
                eventType.addEventListener('change', () => {
                    this.updateAvailabilityMessage();
                });
            }
            
            // Booking form submission
            const bookingForm = document.getElementById('bookingForm');
            if (bookingForm) {
                bookingForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleBookingSubmission();
                });
            }
            
            // Load user bookings if on my-bookings page
            const myBookingsContainer = document.getElementById('myBookingsContainer');
            if (myBookingsContainer) {
                this.loadUserBookings();
            }
            
            // Initialize the authentication check for booking page
            this.initBookingPageAuth();
        });
    },
    
    // Add preset bookings to localStorage for demonstration
    initializePresetBookings: function() {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        
        // Only add preset bookings if none exist
        if (bookings.length === 0) {
            // Create fake user for preset bookings
            const demoUser = {
                id: 'demo-user',
                name: 'Demo User',
                email: 'demo@example.com'
            };
            
            // Add preset bookings
            this.config.presetBookedDates.forEach(booking => {
                bookings.push({
                    id: 'preset-' + Date.now() + Math.random().toString(36).substr(2, 5),
                    userId: demoUser.id,
                    userName: demoUser.name,
                    userEmail: demoUser.email,
                    date: booking.date,
                    timeSlot: booking.timeSlot,
                    eventType: booking.type,
                    guestCount: Math.floor(Math.random() * 50) + 10,
                    specialRequests: 'Demo booking',
                    status: 'confirmed',
                    createdAt: new Date().toISOString()
                });
            });
            
            localStorage.setItem('bookings', JSON.stringify(bookings));
        }
    },
    
    // Check if user is authenticated before booking
    initBookingPageAuth: function() {
        // If this is the booking page
        if (window.location.pathname.includes('bookings.html')) {
            const currentUser = localStorage.getItem('currentUser');
            const bookingForm = document.getElementById('bookingForm');
            const loginPrompt = document.getElementById('loginPrompt');
            
            if (!currentUser && bookingForm && loginPrompt) {
                // User is not logged in, show login prompt and hide booking form
                bookingForm.classList.add('d-none');
                loginPrompt.classList.remove('d-none');
            } else if (currentUser && bookingForm && loginPrompt) {
                // User is logged in, show booking form and hide login prompt
                bookingForm.classList.remove('d-none');
                loginPrompt.classList.add('d-none');
                
                // Pre-fill user data
                const user = JSON.parse(currentUser);
                const nameInput = document.getElementById('fullName');
                const emailInput = document.getElementById('email');
                
                if (nameInput) nameInput.value = user.name;
                if (emailInput) emailInput.value = user.email;
            }
        }
    },
    
    // Setup date picker with disabled dates
    setupDatePicker: function(dateInput) {
        // Set min date (today + minDaysInAdvance)
        const today = new Date();
        const minDate = new Date(today);
        minDate.setDate(today.getDate() + this.config.minDaysInAdvance);
        
        // Set max date (today + maxDaysInFuture)
        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + this.config.maxDaysInFuture);
        
        // Format dates for input
        dateInput.min = this.formatDate(minDate);
        dateInput.max = this.formatDate(maxDate);
        
        // Set default value to minDate
        dateInput.value = this.formatDate(minDate);
        
        // Update time slots based on selected date
        this.updateTimeSlots(dateInput.value);
    },
    
    // Format date as YYYY-MM-DD
    formatDate: function(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    // Get available time slots for a given date
    getAvailableTimeSlots: function(date) {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const bookedSlots = bookings
            .filter(booking => booking.date === date)
            .map(booking => booking.timeSlot);
        
        // Generate all possible time slots
        const allSlots = [];
        for (
            let hour = this.config.workingHours.start; 
            hour < this.config.workingHours.end; 
            hour += this.config.timeSlotDuration / 60
        ) {
            const formattedHour = Math.floor(hour).toString().padStart(2, '0');
            const minutes = (hour % 1) * 60;
            const formattedMinutes = minutes.toString().padStart(2, '0');
            allSlots.push(`${formattedHour}:${formattedMinutes}`);
        }
        
        // Return available slots (all slots except booked ones)
        return allSlots.filter(slot => !bookedSlots.includes(slot));
    },
    
    // Update time slots dropdown based on selected date
    updateTimeSlots: function(date) {
        const timeSlotSelect = document.getElementById('timeSlot');
        if (!timeSlotSelect) return;
        
        // Clear existing options
        timeSlotSelect.innerHTML = '';
        
        // Get available time slots
        const availableSlots = this.getAvailableTimeSlots(date);
        
        // Add available slots to dropdown
        if (availableSlots.length > 0) {
            availableSlots.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = this.formatTimeSlot(slot);
                timeSlotSelect.appendChild(option);
            });
            
            // Update availability message
            this.updateAvailabilityMessage(true);
        } else {
            // No available slots
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No available slots';
            timeSlotSelect.appendChild(option);
            
            // Update availability message
            this.updateAvailabilityMessage(false);
        }
    },
    
    // Format time slot for display (24h to 12h conversion)
    formatTimeSlot: function(slot) {
        const [hours, minutes] = slot.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    },
    
    // Update availability message
    updateAvailabilityMessage: function(isAvailable = true) {
        const availabilityMessage = document.getElementById('availabilityMessage');
        if (!availabilityMessage) return;
        
        const dateInput = document.getElementById('eventDate');
        const timeSlotSelect = document.getElementById('timeSlot');
        const eventTypeSelect = document.getElementById('eventType');
        
        if (!dateInput || !timeSlotSelect || !eventTypeSelect) return;
        
        const date = dateInput.value;
        const timeSlot = timeSlotSelect.value;
        const eventType = eventTypeSelect.value;
        
        if (!date || !timeSlot || !eventType) {
            availabilityMessage.textContent = 'Please select all required fields';
            availabilityMessage.className = 'alert alert-warning';
            return;
        }
        
        if (isAvailable) {
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            availabilityMessage.textContent = `Great! ${formattedDate} at ${this.formatTimeSlot(timeSlot)} is available for your ${eventType}!`;
            availabilityMessage.className = 'alert alert-success';
        } else {
            availabilityMessage.textContent = 'Sorry, this date/time is not available. Please select another date or time.';
            availabilityMessage.className = 'alert alert-danger';
        }
    },
    
    // Handle booking form submission
    handleBookingSubmission: function() {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            // Show login modal
            const authModal = new bootstrap.Modal(document.getElementById('authModal'));
            authModal.show();
            return;
        }
        
        // Get form data
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const eventDate = document.getElementById('eventDate').value;
        const timeSlot = document.getElementById('timeSlot').value;
        const eventType = document.getElementById('eventType').value;
        const guestCount = document.getElementById('guestCount').value;
        const specialRequests = document.getElementById('specialRequests').value;
        
        // Validate form data
        if (!fullName || !email || !phone || !eventDate || !timeSlot || !eventType || !guestCount) {
            alert('Please fill all required fields');
            return;
        }
        
        // Check date availability again (in case someone booked while form was being filled)
        const availableSlots = this.getAvailableTimeSlots(eventDate);
        if (!availableSlots.includes(timeSlot)) {
            alert('Sorry, this time slot is no longer available. Please select another time.');
            this.updateTimeSlots(eventDate);
            return;
        }
        
        // Create booking object
        const user = JSON.parse(currentUser);
        const newBooking = {
            id: Date.now().toString(),
            userId: user.id,
            userName: fullName,
            userEmail: email,
            userPhone: phone,
            date: eventDate,
            timeSlot: timeSlot,
            eventType: eventType,
            guestCount: parseInt(guestCount),
            specialRequests: specialRequests,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        // Save booking to localStorage
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        bookings.push(newBooking);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        // Update user's bookings
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            if (!users[userIndex].bookings) {
                users[userIndex].bookings = [];
            }
            users[userIndex].bookings.push(newBooking.id);
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Show success message and reset form
        const successMessage = document.getElementById('bookingSuccessMessage');
        if (successMessage) {
            successMessage.classList.remove('d-none');
            window.scrollTo(0, 0);
            
            // Reset form
            document.getElementById('bookingForm').reset();
            
            // Pre-fill user data again
            document.getElementById('fullName').value = user.name;
            document.getElementById('email').value = user.email;
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.classList.add('d-none');
            }, 5000);
        } else {
            alert('Booking successful! We will contact you shortly to confirm your booking.');
        }
        
        // Immediately update the calendar view
        if (typeof window.initializeBookingsCalendar === 'function') {
            window.initializeBookingsCalendar();
        }
        
        // Immediately update the bookings table
        this.loadUserBookings();
        
        // Update admin view if admin is logged in
        if (user.email === 'admin@admin.com' && typeof window.loadAllBookingsForAdmin === 'function') {
            window.loadAllBookingsForAdmin();
        }
        
        // Update available time slots
        this.updateTimeSlots(eventDate);
    },
    
    // Load user bookings for my-bookings page
    loadUserBookings: function() {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) return;
        
        const user = JSON.parse(currentUser);
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        
        // Filter bookings for current user
        const userBookings = bookings.filter(booking => booking.userId === user.id);
        
        // Sort bookings by date (newest first)
        userBookings.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Display bookings
        const bookingsContainer = document.getElementById('userBookingsList');
        if (!bookingsContainer) return;
        
        if (userBookings.length === 0) {
            bookingsContainer.innerHTML = '<div class="alert alert-info">You have no bookings yet.</div>';
            return;
        }
        
        let bookingsHTML = '';
        userBookings.forEach(booking => {
            const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const statusClass = {
                'pending': 'bg-warning',
                'confirmed': 'bg-success',
                'cancelled': 'bg-danger'
            }[booking.status] || 'bg-secondary';
            
            bookingsHTML += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${booking.eventType}</h5>
                        <span class="badge ${statusClass}">${booking.status.toUpperCase()}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Date:</strong> ${formattedDate}</p>
                        <p><strong>Time:</strong> ${this.formatTimeSlot(booking.timeSlot)}</p>
                        <p><strong>Guests:</strong> ${booking.guestCount}</p>
                        ${booking.specialRequests ? `<p><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ''}
                        <p><strong>Booking ID:</strong> ${booking.id}</p>
                    </div>
                    <div class="card-footer text-muted">
                        Booked on: ${new Date(booking.createdAt).toLocaleDateString()}
                        ${booking.status === 'pending' ? `
                        <button class="btn btn-sm btn-danger float-end ms-2" onclick="BookingSystem.cancelBooking('${booking.id}')">
                            Cancel Booking
                        </button>` : ''}
                        <button class="btn btn-sm btn-secondary float-end" onclick="BookingSystem.viewBookingDetails('${booking.id}')">
                            View Details
                        </button>
                    </div>
                </div>
            `;
        });
        
        bookingsContainer.innerHTML = bookingsHTML;
    },
    
    // Cancel a booking
    cancelBooking: function(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        
        if (bookingIndex === -1) {
            alert('Booking not found');
            return;
        }
        
        // Update booking status
        bookings[bookingIndex].status = 'cancelled';
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        // Reload bookings
        this.loadUserBookings();
        
        alert('Booking cancelled successfully');
    },
    
    // View booking details
    viewBookingDetails: function(bookingId) {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const booking = bookings.find(b => b.id === bookingId);
        
        if (!booking) {
            alert('Booking not found');
            return;
        }
        
        // Display booking details in modal
        const modal = document.getElementById('bookingDetailsModal');
        if (!modal) return;
        
        // Format date
        const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Set modal content
        document.getElementById('modalBookingId').textContent = booking.id;
        document.getElementById('modalEventType').textContent = booking.eventType;
        document.getElementById('modalEventDate').textContent = formattedDate;
        document.getElementById('modalEventTime').textContent = this.formatTimeSlot(booking.timeSlot);
        document.getElementById('modalGuestCount').textContent = booking.guestCount;
        document.getElementById('modalSpecialRequests').textContent = booking.specialRequests || 'None';
        document.getElementById('modalStatus').textContent = booking.status.toUpperCase();
        
        // Set status color
        const statusBadge = document.getElementById('modalStatusBadge');
        statusBadge.className = 'badge';
        statusBadge.classList.add({
            'pending': 'bg-warning',
            'confirmed': 'bg-success',
            'cancelled': 'bg-danger'
        }[booking.status] || 'bg-secondary');
        
        // Show modal
        const bookingModal = new bootstrap.Modal(modal);
        bookingModal.show();
    }
};

// Initialize booking system
BookingSystem.init();
