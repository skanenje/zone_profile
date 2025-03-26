const logoutButton = document.getElementById('logout-button');

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html';
});

let transactionData = [];
let resultData = [];
let userData = {};

async function fetchProfileData() {
    const jwt = localStorage.getItem('hasura_jwt_token');
    
    // Validate JWT before using
    if (!jwt || jwt.split('.').length !== 3) {
        console.error('Invalid JWT:', jwt);
        alert('Invalid authentication token');
        window.location.href = 'index.html';
        return;
    }

    const query = `
        query {
            transaction(where: {type: {_eq: "xp"}}) {
                amount
                createdAt
                path
                objectId
            }
            
            result(where: {type: {_eq: "project"}}) {
                grade
                createdAt
                path
                objectId
            }
            
            user {
                id
                login
                attrs
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

        const responseData = await response.json();

        // Log the full response for debugging
        console.log('Full Response:', responseData);

        // Check for errors in the GraphQL response
        if (responseData.errors) {
            throw new Error(responseData.errors.map(err => err.message).join(', '));
        }

        // Ensure data exists before accessing
        if (!responseData.data) {
            throw new Error('No data returned from GraphQL query');
        }

        // Safe access with fallback to empty arrays/objects
        transactionData = responseData.data?.transaction || [];
        resultData = responseData.data?.result || [];
        userData = (responseData.data?.user && responseData.data.user[0]) || {};

        // Update UI with user data
        document.getElementById('user-id').textContent = userData.id || 'N/A';
        document.getElementById('username').textContent = userData.login || 'N/A';

        // Calculate total XP
        const totalXP = transactionData.reduce((sum, transaction) => sum + transaction.amount, 0);
        document.getElementById('xp').textContent = `${totalXP} XP`;

        generateGraphs();
    } catch (error) {
        console.error('Full Error:', error);
        alert('Failed to fetch profile data: ' + error.message);
    }
}

function generateGraphs() {
    // XP Over Time Line Chart
    const xpSvg = document.getElementById('xp-over-time');
    const xpWidth = xpSvg.width.baseVal.value;
    const xpHeight = xpSvg.height.baseVal.value;

    // Clear previous content
    xpSvg.innerHTML = '';

    // Process XP data - sort by createdAt
    const sortedTransactions = transactionData.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
    );

    // Calculate cumulative XP
    const cumulativeXP = sortedTransactions.reduce((acc, transaction) => {
        const lastXP = acc.length > 0 ? acc[acc.length - 1] : 0;
        acc.push(lastXP + transaction.amount);
        return acc;
    }, []);

    // Create line
    let xpLinePath = '';
    for (let i = 0; i < cumulativeXP.length; i++) {
        const x = i / (cumulativeXP.length - 1) * xpWidth;
        const y = xpHeight - (cumulativeXP[i] / Math.max(...cumulativeXP)) * xpHeight;
        xpLinePath += (i === 0) ? `M${x},${y}` : ` L${x},${y}`;
    }

    const xpLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    xpLine.setAttribute('d', xpLinePath);
    xpLine.setAttribute('stroke', 'blue');
    xpLine.setAttribute('fill', 'none');
    xpSvg.appendChild(xpLine);

    // Project Success Ratio Bar Chart
    const projectSvg = document.getElementById('audit-ratios');
    const projectWidth = projectSvg.width.baseVal.value;
    const projectHeight = projectSvg.height.baseVal.value;

    // Clear previous content
    projectSvg.innerHTML = '';

    // Process project data
    const passCount = resultData.filter(item => item.grade === 1).length;
    const failCount = resultData.filter(item => item.grade === 0).length;
    const totalCount = resultData.length;

    const passPercentage = (totalCount === 0) ? 0 : passCount / totalCount * 100;
    const failPercentage = (totalCount === 0) ? 0 : failCount / totalCount * 100;

    // Create pass bar
    const passBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    passBar.setAttribute('x', 0);
    passBar.setAttribute('y', 0);
    passBar.setAttribute('width', projectWidth / 2);
    passBar.setAttribute('height', passPercentage / 100 * projectHeight);
    passBar.setAttribute('fill', 'green');
    projectSvg.appendChild(passBar);

    // Create fail bar
    const failBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    failBar.setAttribute('x', projectWidth / 2);
    failBar.setAttribute('y', 0);
    failBar.setAttribute('width', projectWidth / 2);
    failBar.setAttribute('height', failPercentage / 100 * projectHeight);
    failBar.setAttribute('fill', 'red');
    projectSvg.appendChild(failBar);
}

fetchProfileData();
