const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    console.log('Login attempt with username:', username);
    
    const credentials = btoa(`${username}:${password}`);
    console.log('Basic auth header being sent:', `Basic ${credentials}`);

    try {
        console.log('Sending request to signin endpoint...');
        const response = await fetch('https://learn.zone01kisumu.ke/api/auth/signin', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        const data = await response.json();
        console.log('Full response data:', data);

        if (response.ok) {
            // The JWT token is the response data itself
            if (data && typeof data === 'string') {
                console.log('JWT found in response');
                localStorage.setItem('hasura_jwt_token', data);
                window.location.href = 'profile.html';
            } else {
                console.error('Invalid response format:', data);
                alert('Login failed: Invalid response format');
            }
        } else {
            console.error('Login failed with status:', response.status);
            console.error('Error details:', data);
            alert('Login failed: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Login request failed:', error);
        alert('Login failed: ' + error);
    }
});
