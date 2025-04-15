const loginForm = document.getElementById('login-form');

// Create error message element and insert it before the form
const errorDiv = document.createElement('div');
errorDiv.className = 'error-message';
errorDiv.style.display = 'none';
loginForm.insertBefore(errorDiv, loginForm.firstChild);

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Clear previous error
    errorDiv.style.display = 'none';
    
    try {
        const credentials = btoa(`${username}:${password}`);
        const response = await fetch('https://learn.zone01kisumu.ke/api/auth/signin', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            if (data && typeof data === 'string') {
                localStorage.setItem('hasura_jwt_token', data);
                window.location.href = '/profile.html';
            } else {
                showError('Server error: Invalid response format');
            }
        } else {
            // Handle specific error cases
            if (response.status === 401) {
                showError('Incorrect username or password');
            } else if (response.status === 429) {
                showError('Too many login attempts. Please try again in a few minutes');
            } else {
                showError(data.message || 'Login failed. Please try again');
            }
        }
    } catch (error) {
        console.error('Login request failed:', error);
        showError('Unable to connect to the server. Please check your internet connection');
    }
});

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    // Ensure the error message is visible
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
