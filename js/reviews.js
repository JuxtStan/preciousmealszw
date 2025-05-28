/**
 * Reviews System for Precious Meals & Bakes
 * Handles review submission, approval, and display
 */

const ReviewSystem = {
    // Initialize the reviews system
    init: function() {
        document.addEventListener('DOMContentLoaded', () => {
            // Check if on review submission page (bookings.html)
            const reviewForm = document.getElementById('reviewForm');
            if (reviewForm) {
                reviewForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.submitReview();
                });
            }
            
            // Check if on admin page
            const pendingReviewsList = document.getElementById('pendingReviewsList');
            if (pendingReviewsList) {
                this.loadPendingReviews();
            }
            
            // Check if on index page to load approved reviews
            const testimonialsContainer = document.querySelector('.testimonials-container');
            if (testimonialsContainer && window.location.pathname.includes('index.html')) {
                this.loadApprovedReviews();
            }
        });
    },
    
    // Submit a new review
    submitReview: function() {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            alert('Please log in to submit a review.');
            return;
        }
        
        const user = JSON.parse(currentUser);
        const rating = document.querySelector('input[name="rating"]:checked')?.value;
        const reviewText = document.getElementById('reviewText').value;
        const eventType = document.getElementById('reviewEventType').value;
        
        if (!rating || !reviewText || !eventType) {
            alert('Please fill in all fields.');
            return;
        }
        
        // Create review object
        const newReview = {
            id: 'review-' + Date.now(),
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            rating: parseInt(rating),
            text: reviewText,
            eventType: eventType,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        // Save to localStorage
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        reviews.push(newReview);
        localStorage.setItem('reviews', JSON.stringify(reviews));
        
        // Show success message
        const successMessage = document.getElementById('reviewSuccessMessage');
        if (successMessage) {
            successMessage.classList.remove('d-none');
            document.getElementById('reviewForm').reset();
            
            // Hide message after 5 seconds
            setTimeout(() => {
                successMessage.classList.add('d-none');
            }, 5000);
        } else {
            alert('Thank you for your review! It will be visible after approval.');
        }
    },
    
    // Load pending reviews for admin approval
    loadPendingReviews: function() {
        const pendingReviewsList = document.getElementById('pendingReviewsList');
        if (!pendingReviewsList) return;
        
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        const pendingReviews = reviews.filter(review => review.status === 'pending');
        
        if (pendingReviews.length === 0) {
            pendingReviewsList.innerHTML = '<tr><td colspan="6" class="text-center">No pending reviews</td></tr>';
            return;
        }
        
        pendingReviewsList.innerHTML = '';
        pendingReviews.forEach(review => {
            const row = document.createElement('tr');
            
            // Format date
            const date = new Date(review.createdAt);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            // Create rating stars
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            
            row.innerHTML = `
                <td>${review.userName}</td>
                <td>${review.eventType}</td>
                <td><span class="text-warning">${stars}</span></td>
                <td>${review.text}</td>
                <td>${formattedDate}</td>
                <td>
                    <button class="btn btn-sm btn-success approve-review-btn" data-review-id="${review.id}">
                        <i class="bi bi-check-circle"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-danger reject-review-btn" data-review-id="${review.id}">
                        <i class="bi bi-x-circle"></i> Reject
                    </button>
                </td>
            `;
            
            // Add event listeners
            pendingReviewsList.appendChild(row);
        });
        
        // Add event listeners for approve/reject buttons
        document.querySelectorAll('.approve-review-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.approveReview(btn.getAttribute('data-review-id'));
            });
        });
        
        document.querySelectorAll('.reject-review-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.rejectReview(btn.getAttribute('data-review-id'));
            });
        });
    },
    
    // Approve a review
    approveReview: function(reviewId) {
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        const reviewIndex = reviews.findIndex(r => r.id === reviewId);
        
        if (reviewIndex !== -1) {
            reviews[reviewIndex].status = 'approved';
            localStorage.setItem('reviews', JSON.stringify(reviews));
            
            // Reload pending reviews
            this.loadPendingReviews();
        }
    },
    
    // Reject a review
    rejectReview: function(reviewId) {
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        const reviewIndex = reviews.findIndex(r => r.id === reviewId);
        
        if (reviewIndex !== -1) {
            reviews[reviewIndex].status = 'rejected';
            localStorage.setItem('reviews', JSON.stringify(reviews));
            
            // Reload pending reviews
            this.loadPendingReviews();
        }
    },
    
    // Load approved reviews on index page
    loadApprovedReviews: function() {
        const testimonialsContainer = document.querySelector('.testimonials-container');
        if (!testimonialsContainer) return;
        
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        const approvedReviews = reviews.filter(review => review.status === 'approved');
        
        // If we have approved reviews, replace the static ones
        if (approvedReviews.length > 0) {
            testimonialsContainer.innerHTML = '';
            
            approvedReviews.forEach(review => {
                const col = document.createElement('div');
                col.className = 'col-md-4';
                col.setAttribute('data-aos', 'fade-up');
                
                // Create rating stars
                const stars = '<i class="bi bi-star-fill"></i>'.repeat(review.rating);
                
                col.innerHTML = `
                    <div class="testimonial-card text-center">
                        <img src="./img/default-user.jpg" alt="${review.userName}" class="testimonial-image mx-auto d-block">
                        <h5>${review.userName}</h5>
                        <p class="text-muted">${review.eventType}</p>
                        <div class="testimonial-rating text-warning mb-3">
                            ${stars}
                        </div>
                        <p>"${review.text}"</p>
                    </div>
                `;
                
                testimonialsContainer.appendChild(col);
            });
        }
    }
};

// Initialize the reviews system
ReviewSystem.init();
