const logoutButton = document.getElementById('logout-button');

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html';
});
