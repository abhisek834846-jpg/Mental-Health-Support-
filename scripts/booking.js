class BookingSystem {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.counselors = [
            { id: 'c1', name: 'Dr. Sarah ', specialization: 'Anxiety & Depression' },
            { id: 'c2', name: 'Dr. Michael ', specialization: 'Stress Management' },
            { id: 'c3', name: 'Dr. Emily ', specialization: 'Student Counseling' }
        ];
        this.initializeBookingForm();
    }

    initializeBookingForm() {
        const bookingContainer = document.getElementById('booking-container');
        if (!bookingContainer) return;

        bookingContainer.innerHTML = `
            <form id="booking-form" class="booking-form">
                <div class="form-group">
                    <label for="counselor">Select Counselor:</label>
                    <select id="counselor" required>
                        <option value="">Choose a counselor...</option>
                        ${this.counselors.map(c => `
                            <option value="${c.id}">
                                ${c.name} - ${c.specialization}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label for="date">Select Date:</label>
                    <input type="date" id="date" required min="${this.getTodayString()}">
                </div>

                <div class="form-group">
                    <label for="time">Select Time:</label>
                    <select id="time" required>
                        <option value="">Choose a time...</option>
                        ${this.generateTimeSlots()}
                    </select>
                </div>

                <div class="form-group">
                    <label for="notes">Additional Notes:</label>
                    <textarea id="notes" rows="4" 
                        placeholder="Any specific concerns you'd like to discuss... (optional)"></textarea>
                </div>

                <button type="submit">Request Appointment</button>
            </form>
            <div id="booking-confirmation" class="booking-confirmation" style="display: none;">
                <h3>Appointment Requested!</h3>
                <p>We'll confirm your appointment via email shortly.</p>
            </div>
        `;

        this.setupFormHandler();
    }

    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    generateTimeSlots() {
        const slots = [];
        for (let hour = 9; hour <= 17; hour++) {
            const time24 = `${hour}:00`;
            const time12 = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
            slots.push(`<option value="${time24}">${time12}</option>`);
        }
        return slots.join('');
    }

    setupFormHandler() {
        const form = document.getElementById('booking-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.auth.currentUser) {
                alert('Please login to book an appointment');
                return;
            }

            const bookingData = {
                userId: this.auth.currentUser.uid,
                userEmail: this.auth.currentUser.email,
                counselorId: form.counselor.value,
                counselorName: this.counselors.find(c => c.id === form.counselor.value).name,
                date: form.date.value,
                time: form.time.value,
                notes: form.notes.value,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                await this.saveBooking(bookingData);
                this.showConfirmation();
                form.reset();
            } catch (error) {
                alert('Error booking appointment: ' + error.message);
            }
        });
    }

    async saveBooking(bookingData) {
        await this.db.collection('bookings').add(bookingData);
    }

    showConfirmation() {
        const form = document.getElementById('booking-form');
        const confirmation = document.getElementById('booking-confirmation');
        
        if (form && confirmation) {
            form.style.display = 'none';
            confirmation.style.display = 'block';

            // Reset after 5 seconds
            setTimeout(() => {
                form.style.display = 'block';
                confirmation.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize booking system when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const bookingSystem = new BookingSystem();
});
