const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const credentials = btoa(`${username}:${password}`);

    try {
        const response = await fetch('https://learn.zone01kisumu.ke/api/auth/signin', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        const data = await response.json();

    if (response.ok) {
        console.log('Raw JWT:', data.jwt);  // Log the raw JWT
        localStorage.setItem('jwt', data.jwt);
        window.location.href = 'profile.html';
    } else {
        alert('Login failed: ' + data.message);
    }
    } catch (error) {
        alert('Login failed: ' + error);
    }
});
