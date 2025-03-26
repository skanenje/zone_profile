const logoutButton = document.getElementById('logout-button');

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html';
});

async function fetchProfileData() {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
        window.location.href = 'index.html';
        return;
    }

    const query = `
        {
            user {
                id
                login
                xp
            }
        }
    `;

    try {
        const response = await fetch('https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();

        if (response.ok && data.data && data.data.user && data.data.user.length > 0) {
            const user = data.data.user[0];
            document.getElementById('user-id').textContent = user.id;
            document.getElementById('username').textContent = user.login;
            document.getElementById('xp').textContent = user.xp;
        } else {
            alert('Failed to fetch profile data.');
        }
    } catch (error) {
        alert('Failed to fetch profile data: ' + error);
    }
}

fetchProfileData();
