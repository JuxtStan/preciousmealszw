/**
 * Booking System for Precious Meals & Bakes
 * Handles calendar, availability checking, and booking management
 * Using Local Storage Database
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
        // Database collections
        collections: {
            bookings: 'bookings',
            users: 'users'
        }
    },
    
    // Initialize the booking system
    init: function() {
        console.log('Initializing booking system...');
        // Add preset bookings for demonstration
        this.initializePresetBookings();
        
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, setting up booking system');
            // Initialize the date picker
            const dateInput = document.getElementById('eventDate');
            if (dateInput) {
                this.setupDatePicker(dateInput);
                // Update time slots when date changes
                dateInput.addEventListener('change', () => {
                    console.log('Date changed to:', dateInput.value);
                    this.updateTimeSlots(dateInput.value);
                    this.updateAvailabilityMessage(true);
                });
                
                // Initial update of time slots
                if (dateInput.value) {
                    console.log('Initial time slot update for date:', dateInput.value);
                    this.updateTimeSlots(dateInput.value);
                } else {
                    // If no date is selected, set today's date + minDaysInAdvance
                    const today = new Date();
                    const minDate = new Date(today);
                    minDate.setDate(today.getDate() + this.config.minDaysInAdvance);
                    dateInput.value = this.formatDate(minDate);
                    this.updateTimeSlots(dateInput.value);
                }
            } else {
                console.warn('Date input element not found');
            }
            
            // Event type change
            const eventType = document.getElementById('eventType');
            if (eventType) {
                eventType.addEventListener('change', () => {
                    this.updateAvailabilityMessage();
                });
            }
            
            // Time slot change
            const timeSlotSelect = document.getElementById('timeSlot');
            if (timeSlotSelect) {
                timeSlotSelect.addEventListener('change', () => {
                    // Update availability message based on selected time slot
                    const dateInput = document.getElementById('eventDate');
                    if (dateInput && dateInput.value && timeSlotSelect.value) {
                        this.updateAvailabilityMessage(true);
                    }
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
        try {
            // Check if we already have bookings in localStorage
            const bookings = JSON.parse(localStorage.getItem(this.config.collections.bookings)) || [];
            
            // Only add preset bookings if none exist
            if (bookings.length === 0) {
                console.log('Initializing preset bookings in localStorage...');
                
                // Create fake user for preset bookings
                const demoUser = {
                    id: 'demo-user',
                    name: 'Demo User',
                    email: 'demo@example.com'
                };
                
                // Preset booking data
                const presetBookings = [
                    { date: '2025-06-01', timeSlot: '10:00', type: 'Wedding' },
                    { date: '2025-06-05', timeSlot: '14:00', type: 'Corporate Event' },
                    { date: '2025-06-10', timeSlot: '12:00', type: 'Birthday Party' }
                ];
                
                // Add preset bookings to localStorage
                for (const booking of presetBookings) {
                    bookings.push({
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
                }
                
                localStorage.setItem(this.config.collections.bookings, JSON.stringify(bookings));
                
                console.log('Preset bookings added to localStorage');
            }
        } catch (error) {
            console.error('Error initializing preset bookings:', error.message || error);
        }
    },
    
    // Check if user is authenticated before booking
    initBookingPageAuth: function() {
        // If this is the booking page
        if (window.location.pathname.includes('bookings.html')) {
            const currentUser = localStorage.getItem('currentUser');
            const bookingFormCard = document.getElementById('bookingFormCard');
            const loginPrompt = document.getElementById('loginPrompt');
            if (!currentUser && bookingFormCard && loginPrompt) {
                // User is not logged in, show login prompt and hide booking form card
                bookingFormCard.classList.add('d-none');
                loginPrompt.classList.remove('d-none');
            } else if (currentUser && bookingFormCard && loginPrompt) {
                // User is logged in, show booking form card and hide login prompt
                bookingFormCard.classList.remove('d-none');
                loginPrompt.classList.add('d-none');
                // No need to pre-fill user data since those fields are removed
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
        try {
            console.log('Checking available slots for date:', date);
            
            // Get bookings for the specified date from localStorage
            const bookings = JSON.parse(localStorage.getItem(this.config.collections.bookings)) || [];
            
            // Extract booked time slots
            const bookedSlots = [];
            for (const booking of bookings) {
                if (booking.date === date) {
                    const timeSlot = booking.timeSlot;
                    console.log('Found existing booking:', booking);
                    
                    if (timeSlot && timeSlot !== 'Full Day') {
                        bookedSlots.push(timeSlot);
                    } else if (timeSlot === 'Full Day') {
                        // If it's a full day booking, block all slots
                        for (let hour = this.config.workingHours.start; hour < this.config.workingHours.end; hour += this.config.timeSlotDuration / 60) {
                            const formattedHour = Math.floor(hour).toString().padStart(2, '0');
                            const minutes = (hour % 1) * 60;
                            const formattedMinutes = minutes.toString().padStart(2, '0');
                            bookedSlots.push(`${formattedHour}:${formattedMinutes}`);
                        }
                    }
                }
            }
            
            console.log('Booked slots for this date:', bookedSlots);
            
            // Generate all possible time slots
            const allSlots = [];
            for (let hour = this.config.workingHours.start; hour < this.config.workingHours.end; hour += this.config.timeSlotDuration / 60) {
                const formattedHour = Math.floor(hour).toString().padStart(2, '0');
                const minutes = (hour % 1) * 60;
                const formattedMinutes = minutes.toString().padStart(2, '0');
                allSlots.push(`${formattedHour}:${formattedMinutes}`);
            }
            
            // Get available slots (all slots except booked ones)
            const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
            console.log('Available slots:', availableSlots);
            
            return availableSlots;
        } catch (error) {
            console.error('Error getting available time slots:', error);
            return [];
        }
    },
    
    // Update time slots dropdown based on selected date
    updateTimeSlots: function(date) {
        console.log('Updating time slots for date:', date);
        const timeSlotSelect = document.getElementById('timeSlot');
        if (!timeSlotSelect) {
            console.error('Time slot select element not found');
            return;
        }
        
        // Clear existing options
        timeSlotSelect.innerHTML = '';
        
        // Show loading option
        const loadingOption = document.createElement('option');
        loadingOption.value = '';
        loadingOption.textContent = 'Loading available slots...';
        loadingOption.disabled = true;
        loadingOption.selected = true;
        timeSlotSelect.appendChild(loadingOption);
        
        try {
            if (!date) {
                console.error('No date provided to updateTimeSlots');
                throw new Error('No date provided');
            }
            
            // Get available time slots
            console.log('Fetching available time slots for:', date);
            const availableSlots = this.getAvailableTimeSlots(date);
            console.log('Available slots received:', availableSlots);
            
            // Clear loading option
            timeSlotSelect.innerHTML = '';
            
            // Add default selection option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select a time slot';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            timeSlotSelect.appendChild(defaultOption);
            
            // Add available slots to dropdown
            if (availableSlots.length > 0) {
                // Check if the entire day is free (all slots are available)
                const totalPossibleSlots = Math.floor((this.config.workingHours.end - this.config.workingHours.start) / (this.config.timeSlotDuration / 60));
                const isDayFree = availableSlots.length === totalPossibleSlots;
                
                // If the day is completely free, add a 'Full Day' option
                if (isDayFree) {
                    const fullDayOption = document.createElement('option');
                    fullDayOption.value = 'Full Day';
                    fullDayOption.textContent = 'Full Day (All Day Event)';
                    timeSlotSelect.appendChild(fullDayOption);
                    
                    // Add a separator
                    const separator = document.createElement('option');
                    separator.disabled = true;
                    separator.textContent = '─────────────────';
                    timeSlotSelect.appendChild(separator);
                }
                
                // Add morning/afternoon/evening group options
                const morningSlots = availableSlots.filter(slot => {
                    const hour = parseInt(slot.split(':')[0]);
                    return hour >= this.config.workingHours.start && hour < 12;
                });
                
                const afternoonSlots = availableSlots.filter(slot => {
                    const hour = parseInt(slot.split(':')[0]);
                    return hour >= 12 && hour < 17;
                });
                
                const eveningSlots = availableSlots.filter(slot => {
                    const hour = parseInt(slot.split(':')[0]);
                    return hour >= 17 && hour < this.config.workingHours.end;
                });
                
                // Add morning slots with optgroup
                if (morningSlots.length > 0) {
                    const morningGroup = document.createElement('optgroup');
                    morningGroup.label = 'Morning';
                    
                    morningSlots.forEach(slot => {
                        const option = document.createElement('option');
                        option.value = slot;
                        option.textContent = this.formatTimeSlot(slot);
                        morningGroup.appendChild(option);
                    });
                    
                    timeSlotSelect.appendChild(morningGroup);
                }
                
                // Add afternoon slots with optgroup
                if (afternoonSlots.length > 0) {
                    const afternoonGroup = document.createElement('optgroup');
                    afternoonGroup.label = 'Afternoon';
                    
                    afternoonSlots.forEach(slot => {
                        const option = document.createElement('option');
                        option.value = slot;
                        option.textContent = this.formatTimeSlot(slot);
                        afternoonGroup.appendChild(option);
                    });
                    
                    timeSlotSelect.appendChild(afternoonGroup);
                }
                
                // Add evening slots with optgroup
                if (eveningSlots.length > 0) {
                    const eveningGroup = document.createElement('optgroup');
                    eveningGroup.label = 'Evening';
                    
                    eveningSlots.forEach(slot => {
                        const option = document.createElement('option');
                        option.value = slot;
                        option.textContent = this.formatTimeSlot(slot);
                        eveningGroup.appendChild(option);
                    });
                    
                    timeSlotSelect.appendChild(eveningGroup);
                }
                
                // Update availability message
                this.updateAvailabilityMessage(true, isDayFree);
            } else {
                // No available slots
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No available slots for this date';
                option.disabled = true;
                option.selected = true;
                timeSlotSelect.appendChild(option);
                
                // Update availability message
                this.updateAvailabilityMessage(false);
            }
        } catch (error) {
            console.error('Error updating time slots:', error);
            timeSlotSelect.innerHTML = '';
            const errorOption = document.createElement('option');
            errorOption.value = '';
            errorOption.textContent = 'Error loading slots. Please try again.';
            errorOption.disabled = true;
            errorOption.selected = true;
            timeSlotSelect.appendChild(errorOption);
        }
    },
    
    // Format time slot for display (24h to 12h conversion)
    formatTimeSlot: function(slot) {
        if (slot === 'Full Day') return 'Full Day (All Day Event)';
        
        const [hours, minutes] = slot.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    },
    
    // Update availability message
    updateAvailabilityMessage: function(isAvailable = true, isDayFree = false) {
        const message = document.getElementById('availabilityMessage');
        if (!message) return;
        
        // Clear previous message
        message.className = 'alert mb-4';
        
        // Check if date and time slot are selected
        const dateInput = document.getElementById('eventDate');
        const timeSlotSelect = document.getElementById('timeSlot');
        
        if (!dateInput || !dateInput.value) {
            // No date selected
            message.classList.add('alert-warning');
            message.innerHTML = `
                <i class="bi bi-calendar-date me-2"></i>
                <strong>Select a Date:</strong> Please choose an event date to see available time slots.
            `;
            message.classList.remove('d-none');
            return;
        }
        
        // Check if time slots dropdown has any options besides the default
        let hasTimeSlots = false;
        if (timeSlotSelect) {
            for (let i = 0; i < timeSlotSelect.options.length; i++) {
                const option = timeSlotSelect.options[i];
                if (!option.disabled && option.value) {
                    hasTimeSlots = true;
                    break;
                }
            }
        }
        
        if (!hasTimeSlots) {
            // No time slots available
            message.classList.add('alert-danger');
            message.innerHTML = `
                <i class="bi bi-calendar-x me-2"></i>
                <strong>Sorry!</strong> This date is fully booked. Please select another date.
            `;
        } else if (timeSlotSelect && timeSlotSelect.value) {
            // Time slot selected
            message.classList.add('alert-success');
            message.innerHTML = `
                <i class="bi bi-calendar-check-fill me-2"></i>
                <strong>Good choice!</strong> Your selected time slot is available.
            `;
        } else if (isDayFree) {
            // Entire day is free
            message.classList.add('alert-success');
            message.innerHTML = `
                <i class="bi bi-calendar-check-fill me-2"></i>
                <strong>Good news!</strong> The entire day is available for booking.
            `;
        } else {
            // Some slots available
            message.classList.add('alert-success');
            message.innerHTML = `
                <i class="bi bi-calendar-check me-2"></i>
                <strong>Available!</strong> This date has available time slots. Please select your preferred time.
            `;
        }
        
        // Show the message
        message.classList.remove('d-none');
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
        
        try {
            // Check date availability again (in case someone booked while form was being filled)
            const availableSlots = this.getAvailableTimeSlots(eventDate);
            if (!availableSlots.includes(timeSlot)) {
                alert('Sorry, this time slot is no longer available. Please select another time.');
                this.updateTimeSlots(eventDate);
                return;
            }
            
            // Show loading indicator
            const submitButton = document.querySelector('#bookingForm button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
            submitButton.disabled = true;
            
            // Create booking object
            const user = JSON.parse(currentUser);
            const newBooking = {
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
            const bookings = JSON.parse(localStorage.getItem(this.config.collections.bookings)) || [];
            bookings.push(newBooking);
            localStorage.setItem(this.config.collections.bookings, JSON.stringify(bookings));
            
            // Show success message and reset form
            const successMessage = document.getElementById('bookingSuccessMessage');
            if (successMessage) {
                successMessage.classList.remove('d-none');
                window.scrollTo(0, 0);
                
                // Reset form completely
                document.getElementById('bookingForm').reset();
                
                // Clear special requests field explicitly
                const specialRequestsField = document.getElementById('specialRequests');
                if (specialRequestsField) specialRequestsField.value = '';
                
                // Reset select fields explicitly
                const eventTypeField = document.getElementById('eventType');
                const timeSlotField = document.getElementById('timeSlot');
                if (eventTypeField) eventTypeField.selectedIndex = 0;
                if (timeSlotField) timeSlotField.selectedIndex = 0;
                
                // Reset number inputs explicitly
                const guestCountField = document.getElementById('guestCount');
                if (guestCountField) guestCountField.value = '';
                
                // Pre-fill only user data again
                document.getElementById('fullName').value = user.name;
                document.getElementById('email').value = user.email;
                
                // Reset the date picker to default (min date)
                const dateInput = document.getElementById('eventDate');
                if (dateInput) {
                    // Reset date picker
                    dateInput.value = '';
                } else {
                    alert('Booking successful! We will contact you shortly to confirm your booking.');
                }
            }
            
            // Immediately update the calendar view
            if (typeof window.initializeBookingsCalendar === 'function') {
                window.initializeBookingsCalendar();
            }
            
            // Immediately update the bookings table
            this.loadUserBookings();
            
            // Update available time slots
            this.updateTimeSlots(eventDate);
        } catch (error) {
            console.error('Error submitting booking:', error);
            alert('There was an error submitting your booking. Please try again.');
        } finally {
            // Reset submit button
            const submitButton = document.querySelector('#bookingForm button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<i class="bi bi-calendar-check me-2"></i>Submit Booking Request';
                submitButton.disabled = false;
            }
        }
    },
    
    // Load user bookings for my-bookings page
    loadUserBookings: function() {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            // Show login modal
            const authModal = new bootstrap.Modal(document.getElementById('authModal'));
            authModal.show();
            return;
        }
        
        const user = JSON.parse(currentUser);
        const bookingsList = document.getElementById('bookingsList');
        if (!bookingsList) return;
        
        // Show loading indicator
        bookingsList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading your bookings...</p>
                </td>
            </tr>
        `;
        
        try {
            // Get user bookings from localStorage
            const bookings = JSON.parse(localStorage.getItem(this.config.collections.bookings)) || [];
            let q;
            
            // If admin, show all bookings
            if (user.email === 'admin@admin.com') {
                q = bookings.sort((a, b) => new Date(b.date) - new Date(a.date));
            } else {
                // Otherwise, show only user's bookings
                q = bookings.filter(booking => booking.userId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));
            }
            
            // Clear loading indicator
            bookingsList.innerHTML = '';
            
            // If no bookings found
            if (q.length === 0) {
                bookingsList.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            <p class="my-3">You don't have any bookings yet.</p>
                            <button id="createBookingBtn" class="btn btn-primary">
                                <i class="bi bi-plus-circle me-2"></i>Create a Booking
                            </button>
                        </td>
                    </tr>
                `;
                
                // Add event listener to create booking button
                const createBookingBtn = document.getElementById('createBookingBtn');
                if (createBookingBtn) {
                    createBookingBtn.addEventListener('click', () => {
                        document.getElementById('myBookingsContainer').classList.add('d-none');
                        document.getElementById('booking').classList.remove('d-none');
                    });
                }
                
                return;
            }
            
            // Add bookings to table
            q.forEach((booking) => {
                const bookingId = booking.id;
                
                // Format date for display
                const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                // Create booking row
                const row = document.createElement('tr');
                
                // Status badge color
                let statusBadgeClass = 'bg-warning';
                if (booking.status === 'confirmed') statusBadgeClass = 'bg-success';
                if (booking.status === 'cancelled') statusBadgeClass = 'bg-danger';
                
                // Add booking data to row
                row.innerHTML = `
                    <td>${booking.eventType}</td>
                    <td>${formattedDate}</td>
                    <td>${booking.timeSlot === 'Full Day' ? 'Full Day' : this.formatTimeSlot(booking.timeSlot)}</td>
                    <td>${booking.guestCount}</td>
                    <td><span class="badge ${statusBadgeClass}">${booking.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary view-booking" data-booking-id="${bookingId}">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${booking.status === 'pending' ? `
                            <button class="btn btn-sm btn-danger cancel-booking" data-booking-id="${bookingId}">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        ` : ''}
                    </td>
                `;
                
                bookingsList.appendChild(row);
            });
            
            // Add event listeners to view and cancel buttons
            document.querySelectorAll('.view-booking').forEach(button => {
                button.addEventListener('click', (e) => {
                    const bookingId = e.currentTarget.getAttribute('data-booking-id');
                    this.viewBookingDetails(bookingId);
                });
            });
            
            document.querySelectorAll('.cancel-booking').forEach(button => {
                button.addEventListener('click', (e) => {
                    const bookingId = e.currentTarget.getAttribute('data-booking-id');
                    this.cancelBooking(bookingId);
                });
            });
        } catch (error) {
            console.error('Error loading user bookings:', error);
            bookingsList.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error loading bookings. Please try again later.
                    </td>
                </tr>
            `;
        }
    },
    
    // View booking details
    viewBookingDetails: function(bookingId) {
        try {
            // Get booking from localStorage
            const bookings = JSON.parse(localStorage.getItem(this.config.collections.bookings)) || [];
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
            
            // Add appropriate status class
            switch (booking.status) {
                case 'confirmed':
                    statusBadge.classList.add('bg-success');
                    break;
                case 'pending':
                    statusBadge.classList.add('bg-warning', 'text-dark');
                    break;
                case 'cancelled':
                    statusBadge.classList.add('bg-danger');
                    break;
                default:
                    statusBadge.classList.add('bg-secondary');
            }
            
            // Show modal
            const bookingModal = new bootstrap.Modal(modal);
            bookingModal.show();
        } catch (error) {
            console.error('Error viewing booking details:', error);
            alert('An error occurred while loading booking details. Please try again.');
        }
    },
    
    // Cancel booking
    cancelBooking: function(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
            return;
        }
        
        try {
            // Get bookings from localStorage
            const bookings = JSON.parse(localStorage.getItem(this.config.collections.bookings)) || [];
            const updatedBookings = bookings.filter(b => b.id !== bookingId);
            localStorage.setItem(this.config.collections.bookings, JSON.stringify(updatedBookings));
            
            alert('Booking cancelled successfully.');
            
            // Reload bookings
            this.loadUserBookings();
            
            // Update calendar if available
            if (typeof window.initializeBookingsCalendar === 'function') {
                window.initializeBookingsCalendar();
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Error cancelling booking. Please try again later.');
        }
    },
    
    // Submit booking form
    submitBookingForm: function() {
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
        
        try {
            // Check date availability again (in case someone booked while form was being filled)
            const availableSlots = this.getAvailableTimeSlots(eventDate);
            if (!availableSlots.includes(timeSlot)) {
                alert('Sorry, this time slot is no longer available. Please select another time.');
                this.updateTimeSlots(eventDate);
                return;
            }
            
            // Show loading indicator
            const submitButton = document.querySelector('#bookingForm button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
            submitButton.disabled = true;
            
            // Create booking object
            const user = JSON.parse(currentUser);
            const newBooking = {
                userId: user.id,
                userName: fullName,
                userEmail: email,
                userPhone: phone,
                date: eventDate,
                timeSlot: timeSlot,
                eventType: eventType,
                guestCount: parseInt(guestCount),
                specialRequests: specialRequests || '',
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save booking to localStorage
            const bookings = JSON.parse(localStorage.getItem(this.config.collections.bookings)) || [];
            bookings.push(newBooking);
            localStorage.setItem(this.config.collections.bookings, JSON.stringify(bookings));
            
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
            
            // Update available time slots
            this.updateTimeSlots(eventDate);
        } catch (error) {
            console.error('Error submitting booking:', error);
            alert('There was an error submitting your booking. Please try again.');
        } finally {
            // Reset submit button
            const submitButton = document.querySelector('#bookingForm button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<i class="bi bi-calendar-check me-2"></i>Submit Booking Request';
                submitButton.disabled = false;
            }
        }
    },

    // Add or update the function that renders the calendar
    renderCalendar: function(selectedDate) {
        const calendarDays = document.getElementById('calendarDays');
        if (!calendarDays) return;
        calendarDays.innerHTML = '';

        const today = new Date();
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        // Get all bookings for this month
        const bookings = JSON.parse(localStorage.getItem(this.config.collections.bookings)) || [];
        const bookedDates = new Set(bookings.filter(b => {
            const d = new Date(b.date);
            return d.getFullYear() === year && d.getMonth() === month;
        }).map(b => b.date));

        // Fill in blank days before the first of the month
        for (let i = 0; i < startDayOfWeek; i++) {
            const blank = document.createElement('div');
            blank.className = 'calendar-day empty';
            calendarDays.appendChild(blank);
        }

        // Fill in all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = day;
            if (bookedDates.has(dateStr)) {
                dayDiv.classList.add('booked-date');
                dayDiv.title = 'Booked';
            }
            calendarDays.appendChild(dayDiv);
        }
    },

    // In the calendar initialization, call renderCalendar with the current month
    initializeBookingsCalendar: function() {
        const today = new Date();
        this.renderCalendar(today);
    }
};

// Initialize booking system
BookingSystem.init();
