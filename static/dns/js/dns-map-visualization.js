/**
 * DNS World Map Visualization
 * This script creates an interactive world map showing DNS servers and packet movement
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map if the container exists
    const mapContainer = document.getElementById('dns-world-map');
    if (!mapContainer) return;

    // Create the map
    initializeMap(mapContainer);

    // Listen for custom initialization events
    mapContainer.addEventListener('initializeMap', function(event) {
        // Clear the container
        mapContainer.innerHTML = '';

        // Initialize the map with the domain and query mode
        initializeMap(mapContainer, event.detail.domain, event.detail.queryMode);
    });
});

/**
 * Initialize the world map
 * @param {HTMLElement} container - The container element for the map
 * @param {string} [domain='example.com'] - The domain to resolve
 * @param {string} [queryMode='recursive'] - The query mode ('recursive' or 'iterative')
 */
function initializeMap(container, domain = 'example.com', queryMode = 'recursive') {
    // Create SVG element for the map
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1000 500");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.classList.add("world-map-svg");

    // Add the world map paths
    svg.innerHTML = getWorldMapSVGPaths();

    // Add the SVG to the container
    container.appendChild(svg);

    // If we're on the results page, try to get domain and query mode from the page
    if (!domain || domain === 'example.com') {
        const pageDomain = document.querySelector('.domain-info strong:nth-of-type(1) + span')?.textContent;
        if (pageDomain) domain = pageDomain;
    }

    if (queryMode === 'recursive') {
        const pageQueryMode = document.querySelector('.domain-info strong:nth-of-type(3) + span')?.textContent?.toLowerCase();
        if (pageQueryMode) queryMode = pageQueryMode;
    }

    // Add DNS server locations
    addDNSServerLocations(svg, domain);

    // Get the timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');

    // Animate the DNS resolution process
    if (timelineItems.length > 0) {
        animateResolutionOnMap(svg, timelineItems, queryMode);
    } else {
        // If no timeline items, create a demo animation
        createDemoAnimation(svg, domain, queryMode);
    }
}

/**
 * Create a demo animation for the simulation page
 */
function createDemoAnimation(svg, domain, queryMode) {
    // Create fake timeline items for demonstration
    const demoSteps = [];

    if (queryMode === 'recursive') {
        // Recursive query steps
        demoSteps.push({ step: 'Local DNS Resolver', delay: 0 });
        demoSteps.push({ step: 'Root DNS Servers', delay: 2000 });
        demoSteps.push({ step: 'TLD DNS Servers', delay: 4000 });
        demoSteps.push({ step: 'Authoritative Name Servers', delay: 6000 });
        demoSteps.push({ step: 'Final Answer', delay: 8000 });
    } else {
        // Iterative query steps
        demoSteps.push({ step: 'Root DNS Server Query', delay: 0 });
        demoSteps.push({ step: 'TLD Server Referral', delay: 2000 });
        demoSteps.push({ step: 'TLD DNS Server Query', delay: 4000 });
        demoSteps.push({ step: 'Authoritative Server Referral', delay: 6000 });
        demoSteps.push({ step: 'Authoritative Server Query', delay: 8000 });
        demoSteps.push({ step: 'Final Answer', delay: 10000 });
    }

    // Animate each step
    demoSteps.forEach((step, index) => {
        setTimeout(() => {
            // Determine which servers are involved
            let fromServer = null;
            let toServer = null;

            if (queryMode === 'recursive') {
                // Recursive query paths
                switch (index) {
                    case 0: // Local DNS Resolver
                        fromServer = 'client';
                        toServer = 'resolver';
                        break;
                    case 1: // Root DNS Servers
                        fromServer = 'resolver';
                        toServer = 'a.root-servers.net';
                        break;
                    case 2: // TLD DNS Servers
                        fromServer = 'resolver';
                        toServer = 'com-tld';
                        break;
                    case 3: // Authoritative Name Servers
                        fromServer = 'resolver';
                        toServer = 'auth-server';
                        break;
                    case 4: // Final Answer
                        fromServer = 'resolver';
                        toServer = 'client';
                        break;
                }
            } else {
                // Iterative query paths
                switch (index) {
                    case 0: // Root DNS Server Query
                        fromServer = 'client';
                        toServer = 'a.root-servers.net';
                        break;
                    case 1: // TLD Server Referral
                        fromServer = 'a.root-servers.net';
                        toServer = 'client';
                        break;
                    case 2: // TLD DNS Server Query
                        fromServer = 'client';
                        toServer = 'com-tld';
                        break;
                    case 3: // Authoritative Server Referral
                        fromServer = 'com-tld';
                        toServer = 'client';
                        break;
                    case 4: // Authoritative Server Query
                        fromServer = 'client';
                        toServer = 'auth-server';
                        break;
                    case 5: // Final Answer
                        fromServer = 'auth-server';
                        toServer = 'client';
                        break;
                }
            }

            // Animate the packet if we have valid servers
            if (fromServer && toServer) {
                animatePacket(svg, fromServer, toServer);
            }
        }, step.delay);
    });
}

/**
 * Add DNS server locations to the map
 */
function addDNSServerLocations(svg, domain) {
    // Define server locations on the world map
    const serverLocations = {
        // Client is positioned in the center for better visualization
        client: { x: 500, y: 250, label: 'Your Computer' },

        // ISP DNS Resolver (positioned near the client)
        resolver: { x: 480, y: 220, label: 'ISP DNS Resolver' },

        // Root servers (13 distributed globally)
        'a.root-servers.net': { x: 180, y: 150, label: 'A Root Server (Verisign)' },      // North America
        'b.root-servers.net': { x: 150, y: 180, label: 'B Root Server (USC-ISI)' },       // North America
        'c.root-servers.net': { x: 200, y: 160, label: 'C Root Server (Cogent)' },        // North America
        'd.root-servers.net': { x: 450, y: 120, label: 'D Root Server (Maryland)' },       // Europe
        'e.root-servers.net': { x: 470, y: 140, label: 'E Root Server (NASA)' },          // Europe
        'f.root-servers.net': { x: 650, y: 130, label: 'F Root Server (Internet Systems)' }, // Asia
        'g.root-servers.net': { x: 680, y: 150, label: 'G Root Server (US DOD)' },        // Asia
        'h.root-servers.net': { x: 700, y: 170, label: 'H Root Server (US Army)' },       // Asia
        'i.root-servers.net': { x: 460, y: 250, label: 'I Root Server (RIPE NCC)' },      // Africa
        'j.root-servers.net': { x: 230, y: 330, label: 'J Root Server (Verisign)' },      // South America
        'k.root-servers.net': { x: 830, y: 320, label: 'K Root Server (RIPE NCC)' },      // Australia
        'l.root-servers.net': { x: 190, y: 200, label: 'L Root Server (ICANN)' },         // North America
        'm.root-servers.net': { x: 490, y: 300, label: 'M Root Server (WIDE)' },          // Africa

        // TLD servers
        'com-tld': { x: 250, y: 170, label: '.com TLD Server' },     // North America
        'org-tld': { x: 460, y: 130, label: '.org TLD Server' },     // Europe
        'net-tld': { x: 670, y: 140, label: '.net TLD Server' },     // Asia
        'edu-tld': { x: 220, y: 150, label: '.edu TLD Server' },     // North America
        'gov-tld': { x: 200, y: 190, label: '.gov TLD Server' },     // North America
        'uk-tld': { x: 440, y: 110, label: '.uk TLD Server' },       // Europe
        'jp-tld': { x: 750, y: 160, label: '.jp TLD Server' },       // Asia
        'cn-tld': { x: 700, y: 180, label: '.cn TLD Server' },       // Asia
        'ru-tld': { x: 550, y: 120, label: '.ru TLD Server' },       // Europe/Asia
        'au-tld': { x: 820, y: 330, label: '.au TLD Server' },       // Australia
        'br-tld': { x: 240, y: 350, label: '.br TLD Server' },       // South America

        // Authoritative servers (example)
        'auth-server': { x: 600, y: 200, label: domain + ' Server' }
    };

    // Add server pins to the map
    for (const [id, location] of Object.entries(serverLocations)) {
        // Create a group for the server
        const serverGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        serverGroup.setAttribute("id", `server-${id}`);
        serverGroup.classList.add("server-pin");

        // Create the pin
        const pin = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pin.setAttribute("cx", location.x);
        pin.setAttribute("cy", location.y);
        pin.setAttribute("r", "5");
        pin.setAttribute("fill", getServerColor(id));
        pin.setAttribute("stroke", "#fff");
        pin.setAttribute("stroke-width", "1");

        // Create the label
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", location.x);
        label.setAttribute("y", location.y - 10);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "10");
        label.setAttribute("fill", "#333");
        label.textContent = location.label;

        // Add to the group
        serverGroup.appendChild(pin);
        serverGroup.appendChild(label);

        // Add to the SVG
        svg.appendChild(serverGroup);
    }
}

/**
 * Animate the DNS resolution process on the map
 */
function animateResolutionOnMap(svg, timelineItems, queryMode) {
    // Clear any existing animations
    const existingPackets = svg.querySelectorAll('.dns-packet');
    existingPackets.forEach(packet => packet.remove());

    // Reset all server pins
    const serverPins = svg.querySelectorAll('.server-pin');
    serverPins.forEach(pin => {
        pin.classList.remove('active', 'sending', 'receiving');
    });

    // Process each step with delay
    timelineItems.forEach((item, index) => {
        const delay = parseInt(item.dataset.delay || index * 2000);

        setTimeout(() => {
            // Get the step title
            const stepTitle = item.querySelector('h3').textContent;

            // Determine which servers are involved
            let fromServer = null;
            let toServer = null;

            if (queryMode === 'recursive') {
                // Recursive query paths
                if (stepTitle.includes('Local DNS') || stepTitle.includes('Client')) {
                    fromServer = 'client';
                    toServer = 'resolver';
                } else if (stepTitle.includes('Root DNS')) {
                    fromServer = 'resolver';
                    toServer = 'a.root-servers.net';
                } else if (stepTitle.includes('TLD')) {
                    fromServer = 'resolver';
                    toServer = 'com-tld';
                } else if (stepTitle.includes('Authoritative') || stepTitle.includes('Name Servers')) {
                    fromServer = 'resolver';
                    toServer = 'auth-server';
                } else if (stepTitle.includes('Final Answer')) {
                    fromServer = 'resolver';
                    toServer = 'client';
                }
            } else {
                // Iterative query paths
                if (stepTitle.includes('Root DNS Server Query')) {
                    fromServer = 'client';
                    toServer = 'a.root-servers.net';
                } else if (stepTitle.includes('TLD Server Referral')) {
                    fromServer = 'a.root-servers.net';
                    toServer = 'client';
                } else if (stepTitle.includes('TLD DNS Server Query')) {
                    fromServer = 'client';
                    toServer = 'com-tld';
                } else if (stepTitle.includes('Authoritative Server Referral')) {
                    fromServer = 'com-tld';
                    toServer = 'client';
                } else if (stepTitle.includes('Authoritative Server Query')) {
                    fromServer = 'client';
                    toServer = 'auth-server';
                } else if (stepTitle.includes('Final Answer')) {
                    fromServer = 'auth-server';
                    toServer = 'client';
                }
            }

            // Animate the packet if we have valid servers
            if (fromServer && toServer) {
                animatePacket(svg, fromServer, toServer);
            }
        }, delay);
    });
}

/**
 * Animate a packet moving between two servers
 */
function animatePacket(svg, fromServer, toServer) {
    // Get the server elements
    const fromEl = document.getElementById(`server-${fromServer}`);
    const toEl = document.getElementById(`server-${toServer}`);

    if (!fromEl || !toEl) return;

    // Get the pin positions
    const fromPin = fromEl.querySelector('circle');
    const toPin = toEl.querySelector('circle');

    if (!fromPin || !toPin) return;

    // Get the coordinates
    const fromX = parseFloat(fromPin.getAttribute('cx'));
    const fromY = parseFloat(fromPin.getAttribute('cy'));
    const toX = parseFloat(toPin.getAttribute('cx'));
    const toY = parseFloat(toPin.getAttribute('cy'));

    // Highlight the servers
    fromEl.classList.add('sending');
    toEl.classList.add('receiving');

    // Create the packet
    const packet = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    packet.setAttribute("cx", fromX);
    packet.setAttribute("cy", fromY);
    packet.setAttribute("r", "3");
    packet.setAttribute("fill", "#ff9900");
    packet.classList.add("dns-packet");

    // Add to the SVG
    svg.appendChild(packet);

    // Animate the packet
    const duration = 1000; // 1 second
    const startTime = performance.now();

    function animateStep(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Calculate the current position
        const currentX = fromX + (toX - fromX) * progress;
        const currentY = fromY + (toY - fromY) * progress;

        // Update the packet position
        packet.setAttribute("cx", currentX);
        packet.setAttribute("cy", currentY);

        // Continue the animation if not complete
        if (progress < 1) {
            requestAnimationFrame(animateStep);
        } else {
            // Animation complete
            setTimeout(() => {
                packet.remove();

                // Reset the server highlights
                fromEl.classList.remove('sending');
                toEl.classList.remove('receiving');
            }, 500);
        }
    }

    // Start the animation
    requestAnimationFrame(animateStep);
}

/**
 * Get the color for a server type
 */
function getServerColor(serverId) {
    if (serverId === 'client') {
        return '#3498db'; // Blue
    } else if (serverId === 'resolver') {
        return '#9b59b6'; // Purple
    } else if (serverId.includes('root')) {
        return '#e74c3c'; // Red
    } else if (serverId.includes('tld')) {
        return '#f39c12'; // Orange
    } else if (serverId.includes('auth')) {
        return '#2ecc71'; // Green
    }
    return '#95a5a6'; // Gray (default)
}

/**
 * Get the SVG paths for the world map
 * This is a detailed world map for visualization purposes
 */
function getWorldMapSVGPaths() {
    return `
    <!-- Background -->
    <rect x="0" y="0" width="1000" height="500" fill="#e6f7ff" />

    <!-- North America -->
    <path d="M 50,120 L 200,80 L 280,90 L 330,110 L 350,150 L 330,200 L 280,240 L 220,260 L 170,270 L 120,250 L 80,220 L 50,180 Z" fill="#c8e6c9" stroke="#81c784" stroke-width="1" />

    <!-- South America -->
    <path d="M 220,280 L 260,300 L 280,350 L 270,400 L 240,430 L 210,420 L 190,380 L 200,330 Z" fill="#c8e6c9" stroke="#81c784" stroke-width="1" />

    <!-- Europe -->
    <path d="M 420,100 L 480,80 L 520,90 L 540,110 L 530,140 L 500,160 L 470,170 L 440,160 L 420,140 Z" fill="#c8e6c9" stroke="#81c784" stroke-width="1" />

    <!-- Africa -->
    <path d="M 450,180 L 520,190 L 550,230 L 540,290 L 510,340 L 470,360 L 430,340 L 410,300 L 420,240 Z" fill="#c8e6c9" stroke="#81c784" stroke-width="1" />

    <!-- Asia -->
    <path d="M 550,90 L 650,70 L 750,80 L 800,110 L 820,150 L 800,200 L 750,230 L 700,240 L 650,230 L 600,210 L 570,180 L 550,150 Z" fill="#c8e6c9" stroke="#81c784" stroke-width="1" />

    <!-- Australia -->
    <path d="M 800,280 L 850,270 L 880,290 L 890,320 L 870,350 L 830,360 L 800,340 L 790,310 Z" fill="#c8e6c9" stroke="#81c784" stroke-width="1" />

    <!-- Antarctica (partial) -->
    <path d="M 200,450 L 350,470 L 500,480 L 650,470 L 800,450 L 750,430 L 600,420 L 450,420 L 300,430 Z" fill="#e0e0e0" stroke="#bdbdbd" stroke-width="1" />

    <!-- Grid lines -->
    <line x1="0" y1="250" x2="1000" y2="250" stroke="#b0bec5" stroke-width="0.5" stroke-dasharray="5,5" />
    <line x1="500" y1="0" x2="500" y2="500" stroke="#b0bec5" stroke-width="0.5" stroke-dasharray="5,5" />

    <!-- Continent labels -->
    <text x="150" y="170" font-size="14" fill="#37474f" font-weight="bold">North America</text>
    <text x="220" y="350" font-size="14" fill="#37474f" font-weight="bold">South America</text>
    <text x="470" y="120" font-size="14" fill="#37474f" font-weight="bold">Europe</text>
    <text x="480" y="270" font-size="14" fill="#37474f" font-weight="bold">Africa</text>
    <text x="650" y="150" font-size="14" fill="#37474f" font-weight="bold">Asia</text>
    <text x="830" y="320" font-size="14" fill="#37474f" font-weight="bold">Australia</text>

    <!-- Oceans -->
    <text x="350" y="220" font-size="16" fill="#0277bd" font-style="italic">Atlantic Ocean</text>
    <text x="700" y="300" font-size="16" fill="#0277bd" font-style="italic">Pacific Ocean</text>
    <text x="600" y="380" font-size="16" fill="#0277bd" font-style="italic">Indian Ocean</text>
    `;
}
