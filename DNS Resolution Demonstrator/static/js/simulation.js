/**
 * DNS Query Simulation
 * This script handles the interactive DNS query simulation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get the simulation controls
    const domainInput = document.getElementById('sim-domain');
    const recordTypeSelect = document.getElementById('sim-record-type');
    const queryModeSelect = document.getElementById('sim-query-mode');
    const useCacheCheckbox = document.getElementById('sim-use-cache');
    const startButton = document.getElementById('start-simulation');

    // Get the simulation display elements
    const statusElement = document.getElementById('simulation-status');
    const stepElement = document.getElementById('simulation-step');
    const detailsElement = document.getElementById('simulation-details');
    const logContent = document.getElementById('query-log-content');
    const terminalPrompt = document.getElementById('terminal-prompt');
    const terminalOutput = document.getElementById('terminal-output');

    // Get the world map container
    const worldMapContainer = document.getElementById('dns-world-map');

    // Add event listener to the start button
    if (startButton) {
        startButton.addEventListener('click', function() {
            // Get the input values
            const domain = domainInput.value.trim();
            const recordType = recordTypeSelect.value;
            const queryMode = queryModeSelect.value;
            const useCache = useCacheCheckbox.checked;

            // Validate the domain
            if (!domain) {
                alert('Please enter a domain name');
                return;
            }

            // Update the simulation status
            statusElement.textContent = 'Starting simulation...';
            stepElement.textContent = '';
            detailsElement.textContent = '';
            logContent.innerHTML = '';

            // Update the terminal prompt
            if (terminalPrompt) {
                const command = queryMode === 'recursive' ?
                    `dig ${domain} ${recordType}` :
                    `dig +trace ${domain} ${recordType}`;
                terminalPrompt.textContent = `$ ${command}`;
            }

            if (terminalOutput) {
                terminalOutput.textContent = 'Executing DNS query...';
            }

            // Clear the world map
            if (worldMapContainer) {
                worldMapContainer.innerHTML = '';
            }

            // Start the simulation
            startSimulation(domain, recordType, queryMode, useCache);
        });
    }

    /**
     * Start the DNS resolution simulation
     */
    function startSimulation(domain, recordType, queryMode, useCache) {
        // Add initial log entry
        addLogEntry(`Starting DNS resolution for ${domain} (${recordType} record) using ${queryMode} query mode`);

        // Make API request to resolve the domain
        fetch('/api/resolve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                domain: domain,
                record_type: recordType,
                query_mode: queryMode,
                use_cache: useCache
            })
        })
        .then(response => response.json())
        .then(data => {
            // Update the simulation status
            if (data.from_cache) {
                statusElement.textContent = 'Result retrieved from cache';
                addLogEntry('Result found in DNS cache');
            } else {
                statusElement.textContent = 'Simulation completed';
            }

            // Update the terminal output
            updateTerminalOutput(domain, recordType);

            // Initialize the world map visualization
            initializeWorldMapVisualization(domain, queryMode);

            // Process the resolution steps
            processResolutionSteps(data.resolution_steps, queryMode);

            // Display the final records
            if (data.final_records && data.final_records.length > 0) {
                detailsElement.innerHTML = `<strong>Results:</strong><br>`;
                data.final_records.forEach(record => {
                    detailsElement.innerHTML += `${record.type} record: ${record.value} (TTL: ${record.ttl}s)<br>`;
                    addLogEntry(`Found ${record.type} record: ${record.value} with TTL ${record.ttl}s`);
                });
            } else if (data.errors && data.errors.length > 0) {
                detailsElement.innerHTML = `<strong>Errors:</strong><br>`;
                data.errors.forEach(error => {
                    detailsElement.innerHTML += `${error}<br>`;
                    addLogEntry(`Error: ${error}`);
                });
            }
        })
        .catch(error => {
            statusElement.textContent = 'Simulation failed';
            detailsElement.textContent = `Error: ${error.message}`;
            addLogEntry(`Simulation failed: ${error.message}`);
        });
    }

    /**
     * Initialize the world map visualization
     */
    function initializeWorldMapVisualization(domain, queryMode) {
        const worldMapContainer = document.getElementById('dns-world-map');
        if (!worldMapContainer) return;

        // Create a custom event to trigger the map initialization
        const event = new CustomEvent('initializeMap', {
            detail: {
                domain: domain,
                queryMode: queryMode
            }
        });

        // Dispatch the event to the map container
        worldMapContainer.dispatchEvent(event);
    }

    /**
     * Update the terminal output with real command output
     */
    function updateTerminalOutput(domain, recordType) {
        const terminalOutput = document.getElementById('terminal-output');
        if (!terminalOutput) return;

        // Fetch the actual command output
        fetch('/api/nslookup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                domain: domain,
                record_type: recordType
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                terminalOutput.innerHTML = data.stdout.replace(/\n/g, '<br>');
                addLogEntry('Terminal command executed successfully');
            }
        })
        .catch(error => {
            console.error('Error fetching command output:', error);
            addLogEntry(`Error executing terminal command: ${error.message}`);
        });
    }

    /**
     * Process the resolution steps and animate them
     */
    function processResolutionSteps(steps, queryMode) {
        if (!steps || steps.length === 0) return;

        // Process each step with delay
        steps.forEach((step, index) => {
            const delay = index * 2000; // 2 seconds between steps

            setTimeout(() => {
                // Update the step display
                stepElement.textContent = step.step;

                // Add log entry
                addLogEntry(step.description);

                // Reset all nodes
                document.querySelectorAll('.dns-node').forEach(node => {
                    node.classList.remove('active', 'sending', 'receiving');
                });

                // Highlight the appropriate nodes based on query mode and step
                if (queryMode === 'recursive') {
                    animateRecursiveStep(index, step);
                } else {
                    animateIterativeStep(index, step);
                }
            }, delay);
        });
    }

    /**
     * Animate a step in recursive query mode
     */
    function animateRecursiveStep(index, step) {
        // Clear any existing paths
        queryPath.innerHTML = '';

        switch (index) {
            case 0: // Local DNS Resolver
                clientNode.classList.add('active', 'sending');
                resolverNode.classList.add('receiving');
                drawPath('client', 'resolver', queryPath);
                break;

            case 1: // Root DNS Servers
                resolverNode.classList.add('active', 'sending');
                rootNode.classList.add('receiving');
                drawPath('resolver', 'root', queryPath);
                break;

            case 2: // TLD DNS Servers
                resolverNode.classList.add('active', 'sending');
                rootNode.classList.add('active');
                tldNode.classList.add('receiving');
                drawPath('resolver', 'tld', queryPath);
                break;

            case 3: // Authoritative Name Servers
                resolverNode.classList.add('active', 'sending');
                tldNode.classList.add('active');
                authNode.classList.add('receiving');
                drawPath('resolver', 'auth', queryPath);
                break;

            case 4: // Final Answer
                resolverNode.classList.add('active', 'sending');
                authNode.classList.add('active');
                clientNode.classList.add('receiving');
                drawPath('resolver', 'client', queryPath);
                break;
        }
    }

    /**
     * Animate a step in iterative query mode
     */
    function animateIterativeStep(index, step) {
        // Clear any existing paths
        queryPath.innerHTML = '';

        switch (index) {
            case 0: // Root DNS Server Query
                clientNode.classList.add('active', 'sending');
                rootNode.classList.add('receiving');
                drawPath('client', 'root', queryPath);
                break;

            case 1: // TLD Server Referral
                rootNode.classList.add('active', 'sending');
                clientNode.classList.add('receiving');
                drawPath('root', 'client', queryPath);
                break;

            case 2: // TLD DNS Server Query
                clientNode.classList.add('active', 'sending');
                tldNode.classList.add('receiving');
                drawPath('client', 'tld', queryPath);
                break;

            case 3: // Authoritative Server Referral
                tldNode.classList.add('active', 'sending');
                clientNode.classList.add('receiving');
                drawPath('tld', 'client', queryPath);
                break;

            case 4: // Authoritative Server Query
                clientNode.classList.add('active', 'sending');
                authNode.classList.add('receiving');
                drawPath('client', 'auth', queryPath);
                break;

            case 5: // Final Answer
                authNode.classList.add('active', 'sending');
                clientNode.classList.add('receiving');
                drawPath('auth', 'client', queryPath);
                break;
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
    }

    /**
     * Add an entry to the query log
     */
    function addLogEntry(message) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <div class="log-time">${timestamp}</div>
            <div class="log-message">${message}</div>
        `;

        if (logContent) {
            logContent.appendChild(entry);
            logContent.scrollTop = logContent.scrollHeight;
        }
    }

    /**
     * Display the terminal command used for DNS resolution
     */
    function displayTerminalCommand(domain, recordType, queryMode) {
        // Create a terminal command display
        const terminalCmd = document.createElement('div');
        terminalCmd.className = 'terminal-display';

        // Determine the command based on query mode
        let command = '';
        if (queryMode === 'recursive') {
            command = `dig ${domain} ${recordType}`;
        } else {
            command = `dig +trace ${domain} ${recordType}`;
        }

        terminalCmd.innerHTML = `
            <div class="terminal-header">
                <div class="terminal-title">Terminal</div>
                <div class="terminal-controls">
                    <span class="terminal-btn"></span>
                    <span class="terminal-btn"></span>
                    <span class="terminal-btn"></span>
                </div>
            </div>
            <div class="terminal-content">
                <div class="terminal-prompt">$ ${command}</div>
                <div class="terminal-output">Executing DNS query...</div>
            </div>
        `;

        // Add to the simulation details
        const terminalContainer = document.createElement('div');
        terminalContainer.className = 'terminal-container';
        terminalContainer.appendChild(terminalCmd);

        // Insert before the details element
        if (detailsElement.parentNode) {
            detailsElement.parentNode.insertBefore(terminalContainer, detailsElement);
        }

        // Make API request to get the actual command output
        fetch('/api/nslookup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                domain: domain,
                record_type: recordType
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const outputElement = terminalCmd.querySelector('.terminal-output');
                if (outputElement) {
                    outputElement.innerHTML = data.stdout.replace(/\n/g, '<br>');
                }
            }
        })
        .catch(error => {
            console.error('Error fetching command output:', error);
        });
    }
});
