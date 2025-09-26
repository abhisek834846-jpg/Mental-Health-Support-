// Run this script to set up initial admin user
async function setupAdmin(adminEmail) {
    try {
        // Check if user is logged in
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) {
            alert('Please login first with the account you want to make admin');
            return;
        }

        // If no email is provided, use the current user's email
        const emailToUse = adminEmail || currentUser.email;

        // Set up admin document
        await db.collection('admin_users').doc(currentUser.uid).set({
            email: emailToUse,
            role: 'admin',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`Admin user ${emailToUse} has been set up successfully! You can now access the admin dashboard.`);
        // Refresh the page to update UI
        window.location.reload();
    } catch (error) {
        console.error('Error setting up admin:', error);
        alert('Error setting up admin: ' + error.message);
    }
}

// Add a button to the UI for admin setup
document.addEventListener('DOMContentLoaded', () => {
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        const setupButton = document.createElement('button');
        setupButton.className = 'setup-admin-btn';
        setupButton.textContent = 'Setup as Admin';
        setupButton.onclick = () => setupAdmin();
        userInfo.appendChild(setupButton);
    }
});