const logoutButton = document.getElementById('logout-button');

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('hasura_jwt_token');
    window.location.href = '/index.html';
});

let moduleXP = [];
let piscineGoXP = [];
let piscineJsXP = [];
let piscineUxXP = [];
let piscineUiXP = [];
let piscineRustXP = [];

async function fetchProfileData() {
    const jwt = localStorage.getItem('hasura_jwt_token');

    if (!jwt || jwt.split('.').length !== 3) {
        console.error('Invalid JWT:', jwt);
        alert('Invalid authentication token');
        window.location.href = '/index.html';
        return;
    }

    const query = `
        query {
            moduleXP: transaction(
                where: {
                    type: {_eq: "xp"},
                    path: {_like: "/kisumu/module/%"},
                    _and: {
                        path: {_nlike: "%piscine%"}
                    }
                }
            ) {
                amount
                createdAt
                path
            }

            skills: transaction(
                where: {
                    type: {_like: "skill_%"}
                },
                order_by: {
                    createdAt: desc
                }
            ) {
                id
                type
                amount
                createdAt
                path
            }

            exercises: progress(
                where: {
                    object: {
                        type: {_eq: "exercise"}
                    }
                },
                order_by: {
                    createdAt: desc
                }
            ) {
                id
                grade
                createdAt
                object {
                    id
                    name
                    type
                }
            }

            skillSummary: transaction_aggregate(
                where: {
                    type: {_like: "skill_%"}
                }
            ) {
                nodes {
                    type
                    amount
                }
                aggregate {
                    count
                }
            }

            piscineGoXP: transaction(
                where: {
                    type: {_eq: "xp"},
                    path: {_like: "%piscine-go%"}
                }
            ) {
                amount
                createdAt
                path
            }

            piscineJsXP: transaction(
                where: {
                    type: {_eq: "xp"},
                    path: {_like: "%piscine-js%"}
                }
            ) {
                amount
                createdAt
                path
            }

            piscineUxXP: transaction(
                where: {
                    type: {_eq: "xp"},
                    path: {_like: "%piscine-ux%"}
                }
            ) {
                amount
                createdAt
                path
            }

            piscineUiXP: transaction(
                where: {
                    type: {_eq: "xp"},
                    path: {_like: "%piscine-ui%"}
                }
            ) {
                amount
                createdAt
                path
            }

            piscineRustXP: transaction(
                where: {
                    type: {_eq: "xp"},
                    path: {_like: "%piscine-rust%"}
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
        piscineGoXP = responseData.data.piscineGoXP || [];
        piscineJsXP = responseData.data.piscineJsXP || [];
        piscineUxXP = responseData.data.piscineUxXP || [];
        piscineUiXP = responseData.data.piscineUiXP || [];
        piscineRustXP = responseData.data.piscineRustXP || [];

        // Update UI with all the data
        document.getElementById('user-id').textContent = responseData.data.user[0].id || 'N/A';
        document.getElementById('username').textContent = responseData.data.user[0].login || 'N/A';

        // Display skills data
        displaySkills(responseData.data.skills, responseData.data.skillSummary);

        // Calculate different types of XP
        const moduleXPTotal = moduleXP.reduce((sum, t) => sum + t.amount, 0) || 0;
        const piscineGoTotal = piscineGoXP.reduce((sum, t) => sum + t.amount, 0) || 0;
        const piscineJsTotal = piscineJsXP.reduce((sum, t) => sum + t.amount, 0) || 0;
        const piscineUxTotal = piscineUxXP.reduce((sum, t) => sum + t.amount, 0) || 0;
        const piscineUiTotal = piscineUiXP.reduce((sum, t) => sum + t.amount, 0) || 0;
        const piscineRustTotal = piscineRustXP.reduce((sum, t) => sum + t.amount, 0) || 0;

        // Update UI with separated XP values
        document.getElementById('xp').innerHTML = `
            <div>Module XP: ${(moduleXPTotal / 1000).toFixed(2)} kB</div>
            <div>Piscine Go XP: ${(piscineGoTotal / 1000).toFixed(2)} kB</div>
            <div>Piscine JS XP: ${(piscineJsTotal / 1000).toFixed(2)} kB</div>
            <div>Piscine UX XP: ${(piscineUxTotal / 1000).toFixed(2)} kB</div>
            <div>Piscine UI XP: ${(piscineUiTotal / 1000).toFixed(2)} kB</div>
            <div>Piscine Rust XP: ${(piscineRustTotal / 1000).toFixed(2)} kB</div>
            <div>Total XP: ${((moduleXPTotal + piscineGoTotal + piscineJsTotal + piscineUxTotal + piscineUiTotal + piscineRustTotal) / 1000).toFixed(2)} kB</div>
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

function displaySkills(skills, skillSummary) {
    const skillsContainer = document.getElementById('skills-container');

    // Clear previous content
    skillsContainer.innerHTML = '';

    // Group and sum skills by type
    if (skills && skills.length > 0) {
        const groupedSkills = skills.reduce((acc, skill) => {
            const skillType = skill.type.replace('skill_', '').replace(/_/g, ' ');
            if (!acc[skillType]) {
                acc[skillType] = 0;
            }
            acc[skillType] += skill.amount;
            return acc;
        }, {});

        // Convert to array and sort by amount
        const skillsHtml = Object.entries(groupedSkills)
            .sort((a, b) => b[1] - a[1]) // Sort by amount in descending order
            .map(([type, amount]) => {
                // Calculate percentage for the circle (capped at 100)
                const percentage = Math.min(amount, 100);
                const radius = 36;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (percentage / 100) * circumference;

                return `
                    <div class="skill-item">
                        <div class="skill-progress-circle">
                            <svg viewBox="0 0 80 80">
                                <circle class="skill-progress-background"
                                    cx="40" cy="40" r="${radius}"
                                />
                                <circle class="skill-progress-value"
                                    cx="40" cy="40" r="${radius}"
                                    stroke-dasharray="${circumference}"
                                    stroke-dashoffset="${offset}"
                                />
                            </svg>
                            <span class="skill-amount">${amount.toFixed(0)}</span>
                        </div>
                        <span class="skill-name">${type}</span>
                    </div>
                `;
            }).join('');

        skillsContainer.innerHTML = skillsHtml;
    } else {
        skillsContainer.innerHTML = '<p>No skills data available</p>';
    }
}

function generateGraphs() {
    const xpSvg = document.getElementById('xp-over-time');
    const xpWidth = xpSvg.clientWidth;
    const xpHeight = xpSvg.clientHeight;
    const padding = {
        left: 60,
        right: 20,
        top: 20,
        bottom: 30
    };

    // Clear previous content
    xpSvg.innerHTML = '';

    // Add grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (i / gridLines) * (xpHeight - padding.top - padding.bottom);
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', padding.left);
        gridLine.setAttribute('x2', xpWidth - padding.right);
        gridLine.setAttribute('y1', y);
        gridLine.setAttribute('y2', y);
        gridLine.setAttribute('class', 'chart-grid-line');
        xpSvg.appendChild(gridLine);
    }

    // Process XP data
    const sortedXP = [...moduleXP, ...piscineGoXP, ...piscineJsXP, ...piscineUxXP, ...piscineUiXP, ...piscineRustXP].sort((a, b) =>
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

        // Draw the line
        let path = 'M ';
        const points = [];
        dataPoints.forEach((point, i) => {
            const x = padding.left + ((point.date - minDate) / (maxDate - minDate)) * (xpWidth - padding.left - padding.right);
            const y = padding.top + (xpHeight - padding.top - padding.bottom) - ((point.xp / maxXP) * (xpHeight - padding.top - padding.bottom));
            path += `${x},${y} `;
            if (i < dataPoints.length - 1) path += 'L ';
            points.push({ x, y });
        });

        // Create gradient
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'xpLineGradient');
        gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
        gradient.setAttribute('x1', '0');
        gradient.setAttribute('y1', '0');
        gradient.setAttribute('x2', xpWidth.toString());
        gradient.setAttribute('y2', '0');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', 'var(--primary-color)');

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', 'var(--secondary-color)');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        xpSvg.appendChild(gradient);

        // Add the line
        const xpLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        xpLine.setAttribute('d', path);
        xpLine.setAttribute('class', 'chart-line');
        xpLine.setAttribute('stroke', 'url(#xpLineGradient)');
        xpSvg.appendChild(xpLine);

        // Add data points
        points.forEach((point) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', point.x.toString());
            circle.setAttribute('cy', point.y.toString());
            circle.setAttribute('r', '4');
            circle.setAttribute('class', 'chart-point');
            xpSvg.appendChild(circle);
        });

        // Add Y-axis labels
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (i / gridLines) * (xpHeight - padding.top - padding.bottom);
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            const value = ((gridLines - i) / gridLines * maxXP / 1000).toFixed(1);
            label.setAttribute('x', padding.left - 10);
            label.setAttribute('y', y);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('alignment-baseline', 'middle');
            label.setAttribute('class', 'chart-label');
            label.textContent = `${value}k`;
            xpSvg.appendChild(label);
        }

        // Add X-axis labels (start and end dates)
        const startLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        startLabel.setAttribute('x', padding.left);
        startLabel.setAttribute('y', xpHeight - padding.bottom / 2);
        startLabel.setAttribute('class', 'chart-label');
        startLabel.textContent = minDate.toLocaleDateString();

        const endLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        endLabel.setAttribute('x', xpWidth - padding.right);
        endLabel.setAttribute('y', xpHeight - padding.bottom / 2);
        endLabel.setAttribute('text-anchor', 'end');
        endLabel.setAttribute('class', 'chart-label');
        endLabel.textContent = maxDate.toLocaleDateString();

        xpSvg.appendChild(startLabel);
        xpSvg.appendChild(endLabel);
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
