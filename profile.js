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
        query {
            transaction(
              where: {
                type: {_eq: "xp"}
              }
              order_by: {createdAt: asc}
            ) {
              amount
              createdAt
              path
            }
            
            result(
              where: {
                type: {_eq: "up"}
              }
            ) {
              grade
              createdAt
              path
            }
            
            user {
              id
              login
            }

            # For audits done by the user (as auditor)
            result(
              where: {
                type: {_eq: "up"}
              }
            ) {
              grade      # 1 for pass, 0 for fail
              createdAt
              path
            }

            # For audits received by the user (as auditee)
            result(
              where: {
                type: {_eq: "down"}
              }
            ) {
              grade
              createdAt
              path
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

async function generateGraphs() {
    // Placeholder data
    const xpData = [
        { month: 'Jan', xp: 100 },
        { month: 'Feb', xp: 150 },
        { month: 'Mar', xp: 200 },
        { month: 'Apr', xp: 180 },
        { month: 'May', xp: 250 }
    ];

    const auditData = [
        { result: 'Pass', count: 80 },
        { result: 'Fail', count: 20 }
    ];

    // XP Over Time Line Chart
    const xpSvg = document.getElementById('xp-over-time');
    const xpWidth = xpSvg.width.baseVal.value;
    const xpHeight = xpSvg.height.baseVal.value;

    const xpLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    xpLine.setAttribute('d', 'M0,' + xpHeight + ' L' + xpWidth + ',0');
    xpLine.setAttribute('stroke', 'blue');
    xpSvg.appendChild(xpLine);

    // Audit Ratios Bar Chart
    const auditSvg = document.getElementById('audit-ratios');
    const auditWidth = auditSvg.width.baseVal.value;
    const auditHeight = auditSvg.height.baseVal.value;

    const passBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    passBar.setAttribute('x', 0);
    passBar.setAttribute('y', 0);
    passBar.setAttribute('width', auditWidth / 2);
    passBar.setAttribute('height', auditData[0].count / 100 * auditHeight);
    passBar.setAttribute('fill', 'green');
    auditSvg.appendChild(passBar);

    const failBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    failBar.setAttribute('x', auditWidth / 2);
    failBar.setAttribute('y', 0);
    failBar.setAttribute('width', auditWidth / 2);
    failBar.setAttribute('height', auditData[1].count / 100 * auditHeight);
    failBar.setAttribute('fill', 'red');
    auditSvg.appendChild(failBar);
}

generateGraphs();
