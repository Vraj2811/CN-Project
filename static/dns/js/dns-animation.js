/**
 * DNS Resolution Animation
 * This script handles the visualization of DNS resolution process
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get the animation container
    const animationCanvas = document.querySelector('.dns-animation-canvas');
    if (!animationCanvas) return;

    // Get all timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // Create DNS hierarchy elements
    createDnsHierarchy(animationCanvas);
    
    // Animate the DNS resolution process
    animateResolution(timelineItems);
});

/**
 * Create the DNS hierarchy visualization
 */
function createDnsHierarchy(container) {
    // Create the DNS hierarchy structure
    const hierarchy = document.createElement('div');
    hierarchy.className = 'dns-hierarchy';
    
    // Get domain and query mode from the page
    const domain = document.querySelector('.domain-info strong + span')?.textContent || 'example.com';
    const queryMode = document.querySelector('.domain-info strong + span + strong + span')?.textContent || 'Recursive';
    
    // Parse domain parts
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    
    // Create nodes
    const nodes = [
        { id: 'client', label: 'Client', icon: '💻', level: 'client' },
        { id: 'resolver', label: 'DNS Resolver', icon: '🔄', level: 'resolver' },
        { id: 'root', label: 'Root Servers', icon: '🌐', level: 'root' },
        { id: 'tld', label: `.${tld} TLD Servers`, icon: '🔝', level: 'tld' },
        { id: 'auth', label: `${domain} Authoritative Servers`, icon: '🔒', level: 'auth' }
    ];
    
    // Create each node
    nodes.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.className = `dns-level ${node.level}`;
        nodeEl.innerHTML = `
            <div class="dns-node" id="${node.id}-node">
                <div class="node-icon">${node.icon}</div>
                <div class="node-label">${node.label}</div>
            </div>
        `;
        hierarchy.appendChild(nodeEl);
    });
    
    // Add the hierarchy to the container
    container.appendChild(hierarchy);
    
    // Create the query path container
    const queryPath = document.createElement('div');
    queryPath.className = 'query-path';
    container.appendChild(queryPath);
}

/**
 * Animate the DNS resolution process
 */
function animateResolution(timelineItems) {
    // Get the query mode
    const queryMode = document.querySelector('.domain-info strong:nth-of-type(3) + span')?.textContent.toLowerCase() || 'recursive';
    
    // Get the query path container
    const queryPath = document.querySelector('.query-path');
    if (!queryPath) return;
    
    // Clear any existing paths
    queryPath.innerHTML = '';
    
    // Hide all timeline items initially
    timelineItems.forEach(item => {
        item.style.opacity = '0';
    });
    
    // Animate each step with delay
    timelineItems.forEach((item, index) => {
        const delay = parseInt(item.dataset.delay || index * 1000);
        
        setTimeout(() => {
            // Show the timeline item
            item.style.transition = 'opacity 0.5s ease-in-out';
            item.style.opacity = '1';
            
            // Highlight the corresponding node
            highlightNode(item, index, queryMode);
            
            // Draw the path line if needed
            if (index > 0) {
                drawPathLine(index, queryMode);
            }
        }, delay);
    });
}

/**
 * Highlight the corresponding DNS node
 */
function highlightNode(item, index, queryMode) {
    // Get the step title
    const stepTitle = item.querySelector('h3').textContent;
    
    // Determine which node to highlight based on the step
    let nodeId = null;
    
    if (stepTitle.includes('Local DNS') || stepTitle.includes('Client')) {
        nodeId = 'client';
    } else if (stepTitle.includes('Resolver') || stepTitle.includes('Recursive resolver')) {
        nodeId = 'resolver';
    } else if (stepTitle.includes('Root DNS')) {
        nodeId = 'root';
    } else if (stepTitle.includes('TLD')) {
        nodeId = 'tld';
    } else if (stepTitle.includes('Authoritative') || stepTitle.includes('Name Servers')) {
        nodeId = 'auth';
    } else if (stepTitle.includes('Final Answer')) {
        nodeId = queryMode === 'recursive' ? 'resolver' : 'auth';
    }
    
    // Reset all nodes
    document.querySelectorAll('.dns-node').forEach(node => {
        node.classList.remove('active', 'sending', 'receiving');
    });
    
    // Highlight the current node
    if (nodeId) {
        const node = document.getElementById(`${nodeId}-node`);
        if (node) {
            node.classList.add('active');
        }
    }
}

/**
 * Draw a path line between DNS nodes
 */
function drawPathLine(stepIndex, queryMode) {
    // Get the query path container
    const queryPath = document.querySelector('.query-path');
    if (!queryPath) return;
    
    // Define the path based on query mode and step
    let fromNode, toNode;
    
    if (queryMode === 'recursive') {
        // Recursive query paths
        switch (stepIndex) {
            case 1: // Client to Resolver
                fromNode = 'client';
                toNode = 'resolver';
                break;
            case 2: // Resolver to Root
                fromNode = 'resolver';
                toNode = 'root';
                break;
            case 3: // Root to TLD
                fromNode = 'root';
                toNode = 'tld';
                break;
            case 4: // TLD to Auth
                fromNode = 'tld';
                toNode = 'auth';
                break;
            case 5: // Auth to Resolver
                fromNode = 'auth';
                toNode = 'resolver';
                break;
            case 6: // Resolver to Client
                fromNode = 'resolver';
                toNode = 'client';
                break;
        }
    } else {
        // Iterative query paths
        switch (stepIndex) {
            case 1: // Client to Root
                fromNode = 'client';
                toNode = 'root';
                break;
            case 2: // Root to Client
                fromNode = 'root';
                toNode = 'client';
                break;
            case 3: // Client to TLD
                fromNode = 'client';
                toNode = 'tld';
                break;
            case 4: // TLD to Client
                fromNode = 'tld';
                toNode = 'client';
                break;
            case 5: // Client to Auth
                fromNode = 'client';
                toNode = 'auth';
                break;
            case 6: // Auth to Client
                fromNode = 'auth';
                toNode = 'client';
                break;
        }
    }
    
    // Draw the path if we have valid nodes
    if (fromNode && toNode) {
        drawPath(fromNode, toNode, queryPath);
    }
}

/**
 * Draw a path between two nodes
 */
function drawPath(fromNode, toNode, container) {
    // Get the node elements
    const fromEl = document.getElementById(`${fromNode}-node`);
    const toEl = document.getElementById(`${toNode}-node`);
    
    if (!fromEl || !toEl) return;
    
    // Get the positions
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate the center points relative to the container
    const fromX = (fromRect.left + fromRect.width / 2) - containerRect.left;
    const fromY = (fromRect.top + fromRect.height / 2) - containerRect.top;
    const toX = (toRect.left + toRect.width / 2) - containerRect.left;
    const toY = (toRect.top + toRect.height / 2) - containerRect.top;
    
    // Calculate the distance and angle
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Create the path line
    const line = document.createElement('div');
    line.className = 'path-line';
    line.style.width = `${distance}px`;
    line.style.left = `${fromX}px`;
    line.style.top = `${fromY}px`;
    line.style.transform = `rotate(${angle}deg)`;
    
    // Create the arrow
    const arrow = document.createElement('div');
    arrow.className = 'path-arrow';
    arrow.style.left = `${toX - 10}px`;
    arrow.style.top = `${toY - 6}px`;
    arrow.style.transform = `rotate(${angle}deg)`;
    
    // Add to container
    container.appendChild(line);
    container.appendChild(arrow);
    
    // Highlight the nodes
    fromEl.classList.add('sending');
    toEl.classList.add('receiving');
}
