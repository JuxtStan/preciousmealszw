/**
 * Booking System for Precious Meals & Bakes
 * Handles calendar, availability checking, and booking management
 * Using Local Storage Database
 */

// Import Local Database services
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    deleteDoc, 
    updateDoc, 
    orderBy,
    getDoc
} from '../database/database.js';

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
    
    // Add preset bookings to database for demonstration
    initializePresetBookings: async function() {
        try {
            // Check if we already have bookings in local database
            const bookingsRef = collection(this.config.collections.bookings);
            const querySnapshot = await getDocs(bookingsRef);
            
            // Only add preset bookings if none exist
            if (querySnapshot.empty) {
                console.log('Initializing preset bookings in local database...');
                
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
                
                // Add preset bookings to local database
                for (const booking of presetBookings) {
                    await addDoc(bookingsRef, {
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
                
                console.log('Preset bookings added to local database');
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
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    // Get available time slots for a given date
    getAvailableTimeSlots: async function(date) {
        try {
            console.log('Checking available slots for date:', date);
            
            // Get bookings for the specified date from local database
            const bookingsRef = collection(this.config.collections.bookings);
            // Use the correct field name for the date in our database
            const q = query(bookingsRef, where("date", "==", date));
            const querySnapshot = await getDocs(q);
            
            // Extract booked time slots
            const bookedSlots = [];
            querySnapshot.forEach((doc) => {
                const bookingData = doc.data();
                console.log('Found existing booking:', bookingData);
                
                // Extract the time slot
                const timeSlot = bookingData.timeSlot;
                console.log('Time slot from booking:', timeSlot);
                
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
            });
            
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
    updateTimeSlots: async function(date) {
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
            const availableSlots = await this.getAvailableTimeSlots(date);
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
                const noSlotsOption = document.createElement('option');
                noSlotsOption.value = '';
                noSlotsOption.textContent = 'No available slots';
                noSlotsOption.disabled = true;
                timeSlotSelect.appendChild(noSlotsOption);
                
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
                <strong>Date Required:</strong> Please select an event date.
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
    handleBookingSubmission: async function() {
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
            const availableSlots = await this.getAvailableTimeSlots(eventDate);
            if (!availableSlots.includes(timeSlot) && timeSlot !== 'Full Day') {
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
            
            // Save booking to database
            const bookingsRef = collection(this.config.collections.bookings);
            const docRef = await addDoc(bookingsRef, newBooking);
            console.log('Booking added with ID:', docRef.id);
            
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
                    const today = new Date();
                    const minDate = new Date(today);
                    minDate.setDate(today.getDate() + this.config.minDaysInAdvance);
                    dateInput.value = this.formatDate(minDate);
                    this.updateTimeSlots(dateInput.value);
                }
            } else {
                alert('Booking successful! We will contact you shortly to confirm your booking.');
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            alert('An error occurred while submitting your booking. Please try again.');
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
    loadUserBookings: async function() {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) return;
        
        const user = JSON.parse(currentUser);
        const bookingsList = document.getElementById('bookingsList');
        const noBookingsMessage = document.getElementById('noBookingsMessage');
        
        if (!bookingsList || !noBookingsMessage) return;
        
        try {
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
            
            // Get user bookings from database
            const bookingsRef = collection(this.config.collections.bookings);
            const q = query(
                bookingsRef, 
                where("userEmail", "==", user.email),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            
            // Clear previous bookings
            bookingsList.innerHTML = '';
            
            // Show appropriate message or bookings
            if (querySnapshot.empty) {
                noBookingsMessage.classList.remove('d-none');
                document.querySelector('.bookings-table').classList.add('d-none');
            } else {
                noBookingsMessage.classList.add('d-none');
                document.querySelector('.bookings-table').classList.remove('d-none');
                
                // Add each booking to the table
                querySnapshot.forEach((doc) => {
                    const booking = doc.data();
                    booking.id = doc.id; // Add document ID to booking object
                    
                    const row = document.createElement('tr');
                    
                    // Format date for display
                    const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                    });
                    
                    // Status badge color
                    let statusBadgeClass = '';
                    switch (booking.status) {
                        case 'confirmed':
                            statusBadgeClass = 'bg-success';
                            break;
                        case 'pending':
                            statusBadgeClass = 'bg-warning text-dark';
                            break;
                        case 'cancelled':
                            statusBadgeClass = 'bg-danger';
                            break;
                        default:
                            statusBadgeClass = 'bg-secondary';
                    }
                    
                    // Add booking details to row
                    row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${booking.eventType}</td>
                        <td>${this.formatTimeSlot(booking.timeSlot)}</td>
                        <td>${booking.guestCount}</td>
                        <td><span class="badge ${statusBadgeClass}">${booking.status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary view-booking" data-id="${booking.id}">
                                <i class="bi bi-eye"></i>
                            </button>
                            ${booking.status !== 'cancelled' ? `
                            <button class="btn btn-sm btn-outline-danger cancel-booking" data-id="${booking.id}">
                                <i class="bi bi-x-circle"></i>
                            </button>` : ''}
                        </td>
                    `;
                    
                    bookingsList.appendChild(row);
                });
                
                // Add event listeners for view and cancel buttons
                document.querySelectorAll('.view-booking').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const bookingId = e.currentTarget.getAttribute('data-id');
                        this.viewBookingDetails(bookingId);
                    });
                });
                
                document.querySelectorAll('.cancel-booking').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        if (confirm('Are you sure you want to cancel this booking?')) {
                            const bookingId = e.currentTarget.getAttribute('data-id');
                            this.cancelBooking(bookingId);
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error loading user bookings:', error);
            bookingsList.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        <i class="bi bi-exclamation-circle-fill me-2"></i>
                        Error loading bookings. Please try again.
                    </td>
                </tr>
            `;
        }
    },
    
    // Cancel a booking
    cancelBooking: async function(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        
        try {
            const docRef = doc(this.config.collections.bookings, bookingId);
            
            // Update booking status
            await updateDoc(docRef, {
                status: 'cancelled'
            });
            
            // Reload bookings
            this.loadUserBookings();
            
            alert('Booking cancelled successfully');
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('An error occurred while cancelling your booking. Please try again.');
        }
    },
    
    // View booking details
    viewBookingDetails: async function(bookingId) {
        try {
            // Get booking from database
            const docRef = doc(this.config.collections.bookings, bookingId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                alert('Booking not found');
                return;
            }
            
            const booking = docSnap.data();
            booking.id = docSnap.id; // Add document ID to booking object
            
            // Create booking details modal if it doesn't exist
            this.createBookingDetailsModal();
            
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
    
    // Create booking details modal if it doesn't exist
    createBookingDetailsModal: function() {
        if (document.getElementById('bookingDetailsModal')) return;
        
        const modalElement = document.createElement('div');
        modalElement.className = 'modal fade';
        modalElement.id = 'bookingDetailsModal';
        modalElement.tabIndex = '-1';
        modalElement.setAttribute('aria-labelledby', 'bookingDetailsModalLabel');
        modalElement.setAttribute('aria-hidden', 'true');
        
        modalElement.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="bookingDetailsModalLabel">Booking Details</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="small text-muted mb-1">Booking ID</p>
                        <p id="modalBookingId" class="mb-3"></p>
                        
                        <div class="row mb-3">
                            <div class="col-6">
                                <p class="small text-muted mb-1">Event Type</p>
                                <p id="modalEventType" class="mb-0 fw-bold"></p>
                            </div>
                            <div class="col-6 text-end">
                                <p class="small text-muted mb-1">Status</p>
                                <p class="mb-0"><span id="modalStatusBadge" class="badge"><span id="modalStatus"></span></span></p>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-6">
                                <p class="small text-muted mb-1">Date</p>
                                <p id="modalEventDate" class="mb-0"></p>
                            </div>
                            <div class="col-6">
                                <p class="small text-muted mb-1">Time</p>
                                <p id="modalEventTime" class="mb-0"></p>
                            </div>
                        </div>
                        
                        <p class="small text-muted mb-1">Number of Guests</p>
                        <p id="modalGuestCount" class="mb-3"></p>
                        
                        <p class="small text-muted mb-1">Special Requests</p>
                        <p id="modalSpecialRequests" class="mb-0"></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalElement);
    }
};

export default BookingSystem;
