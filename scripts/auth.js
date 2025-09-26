// Authentication handling
class Auth {
    constructor() {
        this.auth = firebaseAuth; // Use the instance from firebase-config.js
        this.setupAuthStateListener();
    }

    // Listen for auth state changes
    setupAuthStateListener() {
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                this.onSignIn(user);
            } else {
                this.onSignOut();
            }
        });
    }

    // Email/Password Registration
    async registerWithEmail(email, password) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Email/Password Login
    async loginWithEmail(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Google OAuth Login
    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const userCredential = await this.auth.signInWithPopup(provider);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Logout
    async logout() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Handle successful sign in
    async onSignIn(user) {
        document.body.classList.add('logged-in');
        document.body.classList.remove('logged-out');
        
        // Check if user is admin
        const isAdmin = await this.checkAdminRole(user);
        if (isAdmin) {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }
        
        this.updateUI(true);
        this.showUserInfo(user, isAdmin);
    }

    // Check if user has admin role
    async checkAdminRole(user) {
        try {
            const adminDoc = await db.collection('admin_users').doc(user.uid).get();
            return adminDoc.exists;
        } catch (error) {
            console.error('Error checking admin role:', error);
            return false;
        }
    }

    // Handle sign out
    onSignOut() {
        document.body.classList.add('logged-out');
        document.body.classList.remove('logged-in');
        this.updateUI(false);
        this.hideUserInfo();
    }

    // Update UI based on auth state
    updateUI(isLoggedIn) {
        const authSections = document.querySelectorAll('.auth-required');
        const nonAuthSections = document.querySelectorAll('.non-auth-required');
        
        authSections.forEach(section => {
            section.style.display = isLoggedIn ? 'block' : 'none';
        });
        
        nonAuthSections.forEach(section => {
            section.style.display = isLoggedIn ? 'none' : 'block';
        });
    }

    // Display user information
    showUserInfo(user, isAdmin) {
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <span>Welcome, ${user.email}</span>
                ${isAdmin ? '<a href="/admin" class="admin-link">Admin Dashboard</a>' : ''}
                <button onclick="auth.logout()" class="logout-btn">Logout</button>
            `;
        }
    }

    // Hide user information
    hideUserInfo() {
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML = '';
        }
    }
}

// Initialize auth
const auth = new Auth();

// Handle form submissions
document.addEventListener('DOMContentLoaded', () => {
    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            const result = await auth.loginWithEmail(email, password);
            
            if (!result.success) {
                alert(result.error);
            }
        });
    }

    // Register form handler
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const result = await auth.registerWithEmail(email, password);
            
            if (!result.success) {
                alert(result.error);
            }
        });
    }

    // Google login handler
    const googleBtn = document.getElementById('google-login');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            const result = await auth.loginWithGoogle();
            if (!result.success) {
                alert(result.error);
            }
        });
    }
});
