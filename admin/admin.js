class AdminDashboard {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.adminEmails = ['admin@example.com']; // Add admin emails here
        this.currentSection = 'overview';
        this.initializeAdmin();
    }

    async initializeAdmin() {
        const container = document.getElementById('admin-container');
        if (!container) return;

        // Check if user is admin
        // await this.checkAdminAccess();

        container.innerHTML = `
            <div class="admin-sidebar">
                <button class="nav-btn active" data-section="overview">Overview</button>
                <button class="nav-btn" data-section="bookings">Bookings</button>
                <button class="nav-btn" data-section="resources">Resources</button>
                <button class="nav-btn" data-section="forum">Forum Posts</button>
                <button class="nav-btn" data-section="admins">Manage Admins</button>
            </div>
            <div class="admin-content">
                <div id="overview-section" class="admin-section active"></div>
                <div id="bookings-section" class="admin-section"></div>
                <div id="resources-section" class="admin-section"></div>
                <div id="forum-section" class="admin-section"></div>
            </div>
        `;

        this.setupEventListeners();
        await this.loadSection('overview');
    }

    async checkAdminAccess() {
        const user = this.auth.currentUser;
        if (!user) {
            window.location.href = '/index.html';
            throw new Error('Please login first');
        }

        try {
            const adminDoc = await this.db.collection('admin_users').doc(user.uid).get();
            if (!adminDoc.exists) {
                window.location.href = '/index.html';
                throw new Error('Unauthorized access');
            }
        } catch (error) {
            console.error('Error checking admin access:', error);
            window.location.href = '/index.html';
            throw new Error('Error verifying admin access');
        }
    }

    setupEventListeners() {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadSection(btn.dataset.section);
            });
        });
    }

    async loadSection(section) {
        this.currentSection = section;
        this.showLoadingState(section);

        const sections = document.querySelectorAll('.admin-section');
        sections.forEach(s => s.classList.remove('active'));
        
        const currentSection = document.getElementById(`${section}-section`);
        if (currentSection) {
            currentSection.classList.add('active');
        }

        try {
            switch (section) {
                case 'overview':
                    await this.loadOverview();
                    break;
                case 'bookings':
                    await this.loadBookings();
                    break;
                case 'resources':
                    await this.loadResources();
                    break;
                case 'forum':
                    await this.loadForumPosts();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${section}:`, error);
            this.showError(section, error.message);
        }
    }

    showLoadingState(section) {
        const sectionEl = document.getElementById(`${section}-section`);
        if (sectionEl) {
            sectionEl.innerHTML = '<div class="loading">Loading...</div>';
        }
    }

    showError(section, message) {
        const sectionEl = document.getElementById(`${section}-section`);
        if (sectionEl) {
            sectionEl.innerHTML = `<div class="error">Error: ${message}</div>`;
        }
    }

    async loadOverview() {
        const stats = await this.getStats();
        const section = document.getElementById('overview-section');
        
        if (section) {
            section.innerHTML = `
                <h2>Dashboard Overview</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Total Users</h3>
                        <p class="stat-number">${stats.users}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Pending Bookings</h3>
                        <p class="stat-number">${stats.pendingBookings}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Total Resources</h3>
                        <p class="stat-number">${stats.resources}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Forum Posts</h3>
                        <p class="stat-number">${stats.forumPosts}</p>
                    </div>
                </div>
            `;
        }
    }

    async loadBookings() {
        const bookings = await this.getBookings();
        const section = document.getElementById('bookings-section');
        
        if (section) {
            section.innerHTML = `
                <h2>Appointment Bookings</h2>
                <div class="bookings-list">
                    ${bookings.map(booking => `
                        <div class="booking-card">
                            <div class="booking-header">
                                <h3>Booking #${booking.id.slice(-6)}</h3>
                                <span class="status ${booking.status}">${booking.status}</span>
                            </div>
                            <div class="booking-details">
                                <p><strong>Student:</strong> ${booking.userEmail}</p>
                                <p><strong>Counselor:</strong> ${booking.counselorName}</p>
                                <p><strong>Date:</strong> ${booking.date}</p>
                                <p><strong>Time:</strong> ${booking.time}</p>
                            </div>
                            <div class="booking-actions">
                                ${booking.status === 'pending' ? `
                                    <button onclick="admin.updateBookingStatus('${booking.id}', 'approved')"
                                        class="approve-btn">Approve</button>
                                    <button onclick="admin.updateBookingStatus('${booking.id}', 'rejected')"
                                        class="reject-btn">Reject</button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    async loadResources() {
        const resources = await this.getResources();
        const section = document.getElementById('resources-section');
        
        if (section) {
            section.innerHTML = `
                <h2>Manage Resources</h2>
                <button onclick="admin.showAddResourceForm()" class="add-btn">
                    Add New Resource
                </button>
                <div class="resources-list">
                    ${resources.map(resource => `
                        <div class="resource-card">
                            <div class="resource-info">
                                <h3>${resource.title}</h3>
                                <p>${resource.description}</p>
                                <span class="resource-type">${resource.type}</span>
                            </div>
                            <div class="resource-actions">
                                <button onclick="admin.deleteResource('${resource.id}')"
                                    class="delete-btn">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    async loadForumPosts() {
        const posts = await this.getForumPosts();
        const section = document.getElementById('forum-section');
        
        if (section) {
            section.innerHTML = `
                <h2>Forum Moderation</h2>
                <div class="forum-posts-list">
                    ${posts.map(post => `
                        <div class="forum-post-card">
                            <div class="post-info">
                                <h3>${post.title}</h3>
                                <p>${post.content}</p>
                                <div class="post-meta">
                                    <span>By: ${post.authorName}</span>
                                    <span>Reports: ${post.reports}</span>
                                </div>
                            </div>
                            <div class="post-actions">
                                ${post.reports > 0 ? `
                                    <button onclick="admin.deleteForumPost('${post.id}')"
                                        class="delete-btn">Delete Post</button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    // Helper methods for data fetching and manipulation
    async getStats() {
        const [users, bookings, resources, posts] = await Promise.all([
            this.db.collection('users').get(),
            this.db.collection('bookings').where('status', '==', 'pending').get(),
            this.db.collection('resources').get(),
            this.db.collection('forum_posts').get()
        ]);

        return {
            users: users.size,
            pendingBookings: bookings.size,
            resources: resources.size,
            forumPosts: posts.size
        };
    }

    async getBookings() {
        const snapshot = await this.db.collection('bookings')
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    async getResources() {
        const snapshot = await this.db.collection('resources')
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    async getForumPosts() {
        const snapshot = await this.db.collection('forum_posts')
            .orderBy('reports', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    // Action methods
    async updateBookingStatus(bookingId, status) {
        try {
            await this.db.collection('bookings').doc(bookingId).update({ status });
            await this.loadBookings();
        } catch (error) {
            console.error('Error updating booking:', error);
            alert('Error updating booking status');
        }
    }

    async deleteResource(resourceId) {
        if (confirm('Are you sure you want to delete this resource?')) {
            try {
                await this.db.collection('resources').doc(resourceId).delete();
                await this.loadResources();
            } catch (error) {
                console.error('Error deleting resource:', error);
                alert('Error deleting resource');
            }
        }
    }

    async deleteForumPost(postId) {
        if (confirm('Are you sure you want to delete this post?')) {
            try {
                await this.db.collection('forum_posts').doc(postId).delete();
                await this.loadForumPosts();
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Error deleting forum post');
            }
        }
    }

    async loadAdmins() {
        const section = document.getElementById('admins-section');
        if (!section) return;

        try {
            const adminsSnapshot = await this.db.collection('admin_users').get();
            const admins = [];
            adminsSnapshot.forEach(doc => {
                admins.push({ id: doc.id, ...doc.data() });
            });

            section.innerHTML = `
                <h2>Manage Administrators</h2>
                <div class="add-admin-form">
                    <h3>Add New Admin</h3>
                    <form id="add-admin-form">
                        <input type="email" id="admin-email" placeholder="Admin's Email" required>
                        <button type="submit">Add Admin</button>
                    </form>
                </div>
                <div class="admins-list">
                    <h3>Current Administrators</h3>
                    ${admins.map(admin => `
                        <div class="admin-item">
                            <span>${admin.email}</span>
                            ${admin.email !== this.auth.currentUser.email ? `
                                <button onclick="admin.removeAdmin('${admin.id}')"
                                    class="remove-btn">Remove</button>
                            ` : '<span class="current-user">(You)</span>'}
                        </div>
                    `).join('')}
                </div>
            `;

            const form = document.getElementById('add-admin-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = form['admin-email'].value;
                    await this.addNewAdmin(email);
                    form.reset();
                });
            }
        } catch (error) {
            console.error('Error loading admins:', error);
            section.innerHTML = '<div class="error">Error loading administrators</div>';
        }
    }

    async addNewAdmin(email) {
        try {
            const userRecord = await this.auth.getUserByEmail(email);
            await this.db.collection('admin_users').doc(userRecord.uid).set({
                email: email,
                role: 'admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await this.loadAdmins();
        } catch (error) {
            console.error('Error adding admin:', error);
            alert('Error adding admin: ' + error.message);
        }
    }

    async removeAdmin(adminId) {
        if (confirm('Are you sure you want to remove this admin?')) {
            try {
                await this.db.collection('admin_users').doc(adminId).delete();
                await this.loadAdmins();
            } catch (error) {
                console.error('Error removing admin:', error);
                alert('Error removing admin');
            }
        }
    }

    showAddResourceForm() {
        const section = document.getElementById('resources-section');
        if (section) {
            section.innerHTML += `
                <div class="modal">
                    <div class="modal-content">
                        <h3>Add New Resource</h3>
                        <form id="add-resource-form">
                            <div class="form-group">
                                <label for="title">Title:</label>
                                <input type="text" id="title" required>
                            </div>
                            <div class="form-group">
                                <label for="description">Description:</label>
                                <textarea id="description" required></textarea>
                            </div>
                            <div class="form-group">
                                <label for="type">Type:</label>
                                <select id="type" required>
                                    <option value="video">Video</option>
                                    <option value="audio">Audio</option>
                                    <option value="article">Article</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="url">URL:</label>
                                <input type="url" id="url" required>
                            </div>
                            <div class="modal-actions">
                                <button type="submit">Add Resource</button>
                                <button type="button" onclick="this.closest('.modal').remove()">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            const form = document.getElementById('add-resource-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    await this.db.collection('resources').add({
                        title: form.title.value,
                        description: form.description.value,
                        type: form.type.value,
                        url: form.url.value,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    form.closest('.modal').remove();
                    await this.loadResources();
                } catch (error) {
                    console.error('Error adding resource:', error);
                    alert('Error adding resource');
                }
            });
        }
    }
}

// Initialize admin dashboard when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminDashboard();
});
