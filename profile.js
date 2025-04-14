const logoutButton = document.getElementById('logout-button');

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('hasura_jwt_token');
    window.location.href = 'index.html';
});

let moduleXP = [];
let piscineXP = [];

async function fetchProfileData() {
    const jwt = localStorage.getItem('hasura_jwt_token');
    
    if (!jwt || jwt.split('.').length !== 3) {
        console.error('Invalid JWT:', jwt);
        alert('Invalid authentication token');
        window.location.href = 'index.html';
        return;
    }

    const query = `
        query {
            moduleXP: transaction(
                where: {
                    type: {_eq: "xp"}, 
                    path: {_like: "/kisumu/module/%"}
                }
            ) {
                amount
                createdAt
                path
            }
            
            piscineXP: transaction(
                where: {
                    type: {_eq: "xp"}, 
                    path: {_like: "/kisumu/piscine-%"}
                }
            ) {
                amount
                createdAt
                path
            }
            
            auditsDone: transaction(
                where: {
                    type: {_eq: "up"},
                    path: {_like: "/kisumu/module/%"}
                }
            ) {
                amount
                createdAt
                path
            }
            
            auditsReceived: transaction(
                where: {
                    type: {_eq: "down"},
                    path: {_like: "/kisumu/module/%"}
                }
            ) {
                amount
                createdAt
                path
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

        if (responseData.errors) {
            console.error('GraphQL Errors:', responseData.errors);
            throw new Error(responseData.errors.map(err => err.message).join(', '));
        }

        if (!responseData.data) {
            throw new Error('No data returned from GraphQL query');
        }

        // Initialize the XP arrays from the response
        moduleXP = responseData.data.moduleXP || [];
        piscineXP = responseData.data.piscineXP || [];

        // Update UI with user data
        document.getElementById('user-id').textContent = responseData.data.user[0].id || 'N/A';
        document.getElementById('username').textContent = responseData.data.user[0].login || 'N/A';

        // Calculate different types of XP
        const moduleXPTotal = moduleXP.reduce((sum, t) => sum + t.amount, 0) || 0;
        const piscineXPTotal = piscineXP.reduce((sum, t) => sum + t.amount, 0) || 0;
        
        // Update UI with separated XP values
        document.getElementById('xp').innerHTML = `
            <div>Module XP: ${(moduleXPTotal / 1000).toFixed(2)} kB</div>
            <div>Piscine XP: ${(piscineXPTotal / 1000).toFixed(2)} kB</div>
            <div>Total XP: ${((moduleXPTotal + piscineXPTotal) / 1000).toFixed(2)} kB</div>
        `;

        // Calculate audit statistics
        const auditsDone = responseData.data.auditsDone || [];
        const auditsReceived = responseData.data.auditsReceived || [];
        
        // Update the audit ratios visualization
        updateAuditRatios({
            done: {
                count: auditsDone.length,
                amount: auditsDone.reduce((sum, audit) => sum + audit.amount, 0)
            },
            received: {
                count: auditsReceived.length,
                amount: auditsReceived.reduce((sum, audit) => sum + audit.amount, 0)
            }
        });

        // Generate graphs after data is loaded
        generateGraphs();
    } catch (error) {
        console.error('Full Error:', error);
        alert('Failed to fetch profile data: ' + error.message);
    }
}

function generateGraphs() {
    // XP Over Time Line Chart
    const xpSvg = document.getElementById('xp-over-time');
    const xpWidth = xpSvg.clientWidth;
    const xpHeight = xpSvg.clientHeight;
    
    // Clear previous content
    xpSvg.innerHTML = '';
    
    // Add grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = (i / gridLines) * xpHeight;
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', '0');
        gridLine.setAttribute('x2', xpWidth);
        gridLine.setAttribute('y1', y);
        gridLine.setAttribute('y2', y);
        gridLine.setAttribute('class', 'chart-grid-line');
        xpSvg.appendChild(gridLine);
    }

    // Process XP data
    const sortedXP = [...moduleXP, ...piscineXP].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
    );

    if (sortedXP.length > 0) {
        let cumulativeXP = 0;
        const dataPoints = sortedXP.map(transaction => {
            cumulativeXP += transaction.amount;
            return {
                date: new Date(transaction.createdAt),
                xp: cumulativeXP
            };
        });

        // Create XP line
        const maxXP = dataPoints[dataPoints.length - 1].xp;
        const minDate = dataPoints[0].date;
        const maxDate = dataPoints[dataPoints.length - 1].date;
        
        let path = 'M ';
        dataPoints.forEach((point, i) => {
            const x = ((point.date - minDate) / (maxDate - minDate)) * xpWidth;
            const y = xpHeight - (point.xp / maxXP) * xpHeight;
            path += `${x},${y} `;
            if (i < dataPoints.length - 1) path += 'L ';
        });

        const xpLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        xpLine.setAttribute('d', path);
        xpLine.setAttribute('class', 'chart-line');
        xpSvg.appendChild(xpLine);
    }
}

function updateAuditRatios(auditData) {
    const svg = document.getElementById('audit-ratios');
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    
    svg.innerHTML = '';
    
    const padding = 40;
    const barWidth = (width - padding * 3) / 2;
    
    const maxCount = Math.max(auditData.done.count, auditData.received.count);
    const doneHeight = maxCount ? (auditData.done.count / maxCount) * (height - padding * 2) : 0;
    const receivedHeight = maxCount ? (auditData.received.count / maxCount) * (height - padding * 2) : 0;

    // Done bar
    const doneBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    doneBar.setAttribute('x', padding);
    doneBar.setAttribute('y', height - padding - doneHeight);
    doneBar.setAttribute('width', barWidth);
    doneBar.setAttribute('height', doneHeight);
    doneBar.setAttribute('class', 'audit-bar');
    doneBar.setAttribute('fill', 'var(--audit-done-color)');

    // Received bar
    const receivedBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    receivedBar.setAttribute('x', padding * 2 + barWidth);
    receivedBar.setAttribute('y', height - padding - receivedHeight);
    receivedBar.setAttribute('width', barWidth);
    receivedBar.setAttribute('height', receivedHeight);
    receivedBar.setAttribute('class', 'audit-bar');
    receivedBar.setAttribute('fill', 'var(--audit-received-color)');

    // Labels
    const doneLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    doneLabel.setAttribute('x', padding + barWidth/2);
    doneLabel.setAttribute('y', height - padding/2);
    doneLabel.setAttribute('text-anchor', 'middle');
    doneLabel.setAttribute('class', 'audit-label');
    doneLabel.textContent = `Done: ${auditData.done.count}`;

    const receivedLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    receivedLabel.setAttribute('x', padding * 2 + barWidth * 1.5);
    receivedLabel.setAttribute('y', height - padding/2);
    receivedLabel.setAttribute('text-anchor', 'middle');
    receivedLabel.setAttribute('class', 'audit-label');
    receivedLabel.textContent = `Received: ${auditData.received.count}`;

    svg.appendChild(doneBar);
    svg.appendChild(receivedBar);
    svg.appendChild(doneLabel);
    svg.appendChild(receivedLabel);
}

// Call fetchProfileData when the page loads
document.addEventListener('DOMContentLoaded', fetchProfileData);
