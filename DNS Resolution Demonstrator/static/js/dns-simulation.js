/**
 * DNS Query Simulation
 * This script creates an interactive simulation of DNS query resolution
 * showing packets moving between servers
 */

class DNSSimulation {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.width = this.container.clientWidth;
        this.height = 500;
        this.servers = {};
        this.packets = [];
        this.animationQueue = [];
        this.isPlaying = false;
        this.currentStep = 0;

        this.initializeSimulation();
    }

    initializeSimulation() {
        // Create SVG container
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("width", this.width);
        this.svg.setAttribute("height", this.height);
        this.svg.setAttribute("class", "dns-simulation-svg");

        // Create a background
        const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        background.setAttribute("width", this.width);
        background.setAttribute("height", this.height);
        background.setAttribute("fill", "#f8f9fa");
        this.svg.appendChild(background);

        // Create a group for servers
        this.serversGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.svg.appendChild(this.serversGroup);

        // Create a group for packets
        this.packetsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.svg.appendChild(this.packetsGroup);

        // Create a group for labels
        this.labelsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.svg.appendChild(this.labelsGroup);

        // Add the SVG to the container
        this.container.appendChild(this.svg);

        // Create controls
        this.createControls();
    }

    createControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'simulation-controls';

        // Play/Pause button
        this.playButton = document.createElement('button');
        this.playButton.className = 'sim-control-btn play-btn';
        this.playButton.innerHTML = '<i class="fas fa-play"></i> Play';
        this.playButton.addEventListener('click', () => this.togglePlayPause());

        // Reset button
        const resetButton = document.createElement('button');
        resetButton.className = 'sim-control-btn reset-btn';
        resetButton.innerHTML = '<i class="fas fa-redo"></i> Reset';
        resetButton.addEventListener('click', () => this.resetSimulation());

        // Set a fixed maximum speed (hidden from UI)
        this.speedSlider = { value: '2' }; // Maximum speed

        // Add controls to the container
        controlsDiv.appendChild(this.playButton);
        controlsDiv.appendChild(resetButton);

        this.container.appendChild(controlsDiv);

        // Create status display
        this.statusDisplay = document.createElement('div');
        this.statusDisplay.className = 'simulation-status';
        this.statusDisplay.innerHTML = '<span class="status-label">Status:</span> <span class="status-value">Ready</span>';
        this.container.appendChild(this.statusDisplay);
    }

    addServer(id, x, y, type, label) {
        // Create server group
        const serverGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        serverGroup.setAttribute("id", `server-${id}`);
        serverGroup.setAttribute("class", `server-node ${type}-server`);

        // Create server icon
        const serverIcon = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        serverIcon.setAttribute("x", x - 20);
        serverIcon.setAttribute("y", y - 20);
        serverIcon.setAttribute("width", 40);
        serverIcon.setAttribute("height", 40);
        serverIcon.setAttribute("rx", 5);
        serverIcon.setAttribute("ry", 5);

        // Set color based on server type
        let fillColor = "#95a5a6"; // Default gray
        switch(type) {
            case 'client':
                fillColor = "#3498db"; // Blue
                break;
            case 'resolver':
                fillColor = "#9b59b6"; // Purple
                break;
            case 'root':
                fillColor = "#e74c3c"; // Red
                break;
            case 'tld':
                fillColor = "#f39c12"; // Orange
                break;
            case 'auth':
                fillColor = "#2ecc71"; // Green
                break;
        }

        serverIcon.setAttribute("fill", fillColor);
        serverIcon.setAttribute("stroke", "#fff");
        serverIcon.setAttribute("stroke-width", "2");

        // Create server label
        const serverLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        serverLabel.setAttribute("x", x);
        serverLabel.setAttribute("y", y + 35);
        serverLabel.setAttribute("text-anchor", "middle");
        serverLabel.setAttribute("font-size", "12");
        serverLabel.setAttribute("fill", "#333");
        serverLabel.textContent = label;

        // Add to group
        serverGroup.appendChild(serverIcon);

        // Add to servers group
        this.serversGroup.appendChild(serverGroup);
        this.labelsGroup.appendChild(serverLabel);

        // Store server info
        this.servers[id] = {
            x: x,
            y: y,
            type: type,
            label: label,
            element: serverGroup
        };

        return serverGroup;
    }

    createPacket(id, fromX, fromY, toX, toY, query) {
        // Create packet group
        const packetGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        packetGroup.setAttribute("id", `packet-${id}`);
        packetGroup.setAttribute("class", "dns-packet");

        // Create packet circle
        const packetCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        packetCircle.setAttribute("cx", fromX);
        packetCircle.setAttribute("cy", fromY);
        packetCircle.setAttribute("r", 8);
        packetCircle.setAttribute("fill", "#ff9900");
        packetCircle.setAttribute("stroke", "#fff");
        packetCircle.setAttribute("stroke-width", "2");

        // Create packet label (query)
        const packetLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        packetLabel.setAttribute("x", fromX);
        packetLabel.setAttribute("y", fromY - 15);
        packetLabel.setAttribute("text-anchor", "middle");
        packetLabel.setAttribute("font-size", "10");
        packetLabel.setAttribute("fill", "#333");
        packetLabel.setAttribute("class", "packet-label");
        packetLabel.textContent = query;

        // Add to group
        packetGroup.appendChild(packetCircle);
        packetGroup.appendChild(packetLabel);

        // Add to packets group
        this.packetsGroup.appendChild(packetGroup);

        // Store packet info
        const packet = {
            id: id,
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,
            query: query,
            element: packetGroup,
            circle: packetCircle,
            label: packetLabel
        };

        this.packets.push(packet);
        return packet;
    }

    animatePacket(packet, onComplete) {
        const duration = 2000 / parseFloat(this.speedSlider.value);
        const startTime = performance.now();

        // Highlight the source server
        const fromServerId = Object.keys(this.servers).find(id =>
            this.servers[id].x === packet.fromX && this.servers[id].y === packet.fromY);
        const toServerId = Object.keys(this.servers).find(id =>
            this.servers[id].x === packet.toX && this.servers[id].y === packet.toY);

        if (fromServerId) {
            this.servers[fromServerId].element.classList.add('sending');
        }

        if (toServerId) {
            this.servers[toServerId].element.classList.add('receiving');
        }

        const animate = (timestamp) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Calculate current position
            const currentX = packet.fromX + (packet.toX - packet.fromX) * progress;
            const currentY = packet.fromY + (packet.toY - packet.fromY) * progress;

            // Update packet position
            packet.circle.setAttribute("cx", currentX);
            packet.circle.setAttribute("cy", currentY);
            packet.label.setAttribute("x", currentX);
            packet.label.setAttribute("y", currentY - 15);

            if (progress < 1 && this.isPlaying) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete or paused
                if (progress >= 1) {
                    // Remove the packet
                    setTimeout(() => {
                        packet.element.remove();

                        // Reset server highlights
                        if (fromServerId) {
                            this.servers[fromServerId].element.classList.remove('sending');
                        }

                        if (toServerId) {
                            this.servers[toServerId].element.classList.remove('receiving');
                        }

                        if (onComplete) onComplete();
                    }, 500);
                }
            }
        };

        requestAnimationFrame(animate);
    }

    addAnimationStep(fromServerId, toServerId, query, response = null) {
        if (!this.servers[fromServerId] || !this.servers[toServerId]) return;

        const fromX = this.servers[fromServerId].x;
        const fromY = this.servers[fromServerId].y;
        const toX = this.servers[toServerId].x;
        const toY = this.servers[toServerId].y;

        // Add query packet
        this.animationQueue.push({
            type: 'packet',
            fromServerId: fromServerId,
            toServerId: toServerId,
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,
            query: query
        });

        // Add response packet if provided
        if (response) {
            this.animationQueue.push({
                type: 'packet',
                fromServerId: toServerId,
                toServerId: fromServerId,
                fromX: toX,
                fromY: toY,
                toX: fromX,
                toY: fromY,
                query: response
            });
        }
    }

    async setupDNSSimulation(domain, recordType, queryMode) {
        // Clear any existing servers and packets
        this.serversGroup.innerHTML = '';
        this.packetsGroup.innerHTML = '';
        this.labelsGroup.innerHTML = '';
        this.servers = {};
        this.packets = [];
        this.animationQueue = [];

        // Get actual DNS records for the domain
        let dnsRecords = await this.fetchDNSRecords(domain, recordType);

        // Add servers based on the query mode
        this.addServer('client', 100, 250, 'client', 'Your Computer');

        if (queryMode === 'recursive') {
            // Recursive mode servers
            this.addServer('resolver', 250, 250, 'resolver', 'DNS Resolver');
            this.addServer('root', 400, 150, 'root', dnsRecords.rootServer || 'Root Server');
            this.addServer('tld', 550, 250, 'tld', dnsRecords.tldServer || `.${domain.split('.').pop()} TLD Server`);
            this.addServer('auth', 700, 350, 'auth', dnsRecords.authServer || `${domain} Server`);

            // Set up animation steps for recursive mode
            this.animationQueue = [
                {
                    type: 'status',
                    message: `Starting recursive DNS resolution for ${domain}`
                },
                {
                    type: 'status',
                    message: `Step 1: Client sends recursive query to DNS resolver`
                },
                {
                    type: 'packet',
                    fromServerId: 'client',
                    toServerId: 'resolver',
                    fromX: this.servers['client'].x,
                    fromY: this.servers['client'].y,
                    toX: this.servers['resolver'].x,
                    toY: this.servers['resolver'].y,
                    query: `Resolve ${domain} ${recordType} for me`
                },
                {
                    type: 'status',
                    message: `Step 2: Resolver queries root server`
                },
                {
                    type: 'packet',
                    fromServerId: 'resolver',
                    toServerId: 'root',
                    fromX: this.servers['resolver'].x,
                    fromY: this.servers['resolver'].y,
                    toX: this.servers['root'].x,
                    toY: this.servers['root'].y,
                    query: `Who has ${domain} ${recordType}?`
                },
                {
                    type: 'status',
                    message: `Root server doesn't know but provides referral`
                },
                {
                    type: 'packet',
                    fromServerId: 'root',
                    toServerId: 'resolver',
                    fromX: this.servers['root'].x,
                    fromY: this.servers['root'].y,
                    toX: this.servers['resolver'].x,
                    toY: this.servers['resolver'].y,
                    query: `I don't know. Try ${dnsRecords.tldServer || `.${domain.split('.').pop()} TLD server`}`
                },
                {
                    type: 'status',
                    message: `Step 3: Resolver queries TLD server based on referral`
                },
                {
                    type: 'packet',
                    fromServerId: 'resolver',
                    toServerId: 'tld',
                    fromX: this.servers['resolver'].x,
                    fromY: this.servers['resolver'].y,
                    toX: this.servers['tld'].x,
                    toY: this.servers['tld'].y,
                    query: `Who has ${domain} ${recordType}?`
                },
                {
                    type: 'status',
                    message: `TLD server doesn't know but provides referral`
                },
                {
                    type: 'packet',
                    fromServerId: 'tld',
                    toServerId: 'resolver',
                    fromX: this.servers['tld'].x,
                    fromY: this.servers['tld'].y,
                    toX: this.servers['resolver'].x,
                    toY: this.servers['resolver'].y,
                    query: `I don't know. Try ${dnsRecords.authServer || `${domain} authoritative server`}`
                },
                {
                    type: 'status',
                    message: `Step 4: Resolver queries authoritative server based on referral`
                },
                {
                    type: 'packet',
                    fromServerId: 'resolver',
                    toServerId: 'auth',
                    fromX: this.servers['resolver'].x,
                    fromY: this.servers['resolver'].y,
                    toX: this.servers['auth'].x,
                    toY: this.servers['auth'].y,
                    query: `Who has ${domain} ${recordType}?`
                },
                {
                    type: 'status',
                    message: `Authoritative server has the answer`
                },
                {
                    type: 'packet',
                    fromServerId: 'auth',
                    toServerId: 'resolver',
                    fromX: this.servers['auth'].x,
                    fromY: this.servers['auth'].y,
                    toX: this.servers['resolver'].x,
                    toY: this.servers['resolver'].y,
                    query: `${domain} ${recordType} = ${dnsRecords.recordValue || 'No record found'}`
                },
                {
                    type: 'status',
                    message: `Step 5: Resolver returns the final answer to client`
                },
                {
                    type: 'packet',
                    fromServerId: 'resolver',
                    toServerId: 'client',
                    fromX: this.servers['resolver'].x,
                    fromY: this.servers['resolver'].y,
                    toX: this.servers['client'].x,
                    toY: this.servers['client'].y,
                    query: `${domain} ${recordType} = ${dnsRecords.recordValue || 'No record found'}`
                },
                {
                    type: 'status',
                    message: `Client receives the final answer from resolver`
                }
            ];
        } else {
            // Iterative mode servers - position them in a more logical flow
            this.addServer('root', 400, 150, 'root', dnsRecords.rootServer || 'Root Server');
            this.addServer('tld', 550, 250, 'tld', dnsRecords.tldServer || `.${domain.split('.').pop()} TLD Server`);
            this.addServer('auth', 700, 350, 'auth', dnsRecords.authServer || `${domain} Server`);

            // Set up animation steps for iterative mode - showing the correct step-by-step process
            this.animationQueue = [
                {
                    type: 'status',
                    message: `Starting iterative DNS resolution for ${domain}`
                },
                {
                    type: 'status',
                    message: `Step 1: Client queries root server`
                },
                {
                    type: 'packet',
                    fromServerId: 'client',
                    toServerId: 'root',
                    fromX: this.servers['client'].x,
                    fromY: this.servers['client'].y,
                    toX: this.servers['root'].x,
                    toY: this.servers['root'].y,
                    query: `Who has ${domain} ${recordType}?`
                },
                {
                    type: 'status',
                    message: `Root server contacts TLD server`
                },
                {
                    type: 'packet',
                    fromServerId: 'root',
                    toServerId: 'tld',
                    fromX: this.servers['root'].x,
                    fromY: this.servers['root'].y,
                    toX: this.servers['tld'].x,
                    toY: this.servers['tld'].y,
                    query: `Who has ${domain} ${recordType}?`
                },
                {
                    type: 'status',
                    message: `TLD server contacts authoritative server`
                },
                {
                    type: 'packet',
                    fromServerId: 'tld',
                    toServerId: 'auth',
                    fromX: this.servers['tld'].x,
                    fromY: this.servers['tld'].y,
                    toX: this.servers['auth'].x,
                    toY: this.servers['auth'].y,
                    query: `Who has ${domain} ${recordType}?`
                },
                {
                    type: 'status',
                    message: `Authoritative server has the answer`
                },
                {
                    type: 'packet',
                    fromServerId: 'auth',
                    toServerId: 'tld',
                    fromX: this.servers['auth'].x,
                    fromY: this.servers['auth'].y,
                    toX: this.servers['tld'].x,
                    toY: this.servers['tld'].y,
                    query: `${domain} ${recordType} = ${dnsRecords.recordValue || 'No record found'}`
                },
                {
                    type: 'status',
                    message: `TLD server passes answer back to root server`
                },
                {
                    type: 'packet',
                    fromServerId: 'tld',
                    toServerId: 'root',
                    fromX: this.servers['tld'].x,
                    fromY: this.servers['tld'].y,
                    toX: this.servers['root'].x,
                    toY: this.servers['root'].y,
                    query: `${domain} ${recordType} = ${dnsRecords.recordValue || 'No record found'}`
                },
                {
                    type: 'status',
                    message: `Root server passes answer back to client`
                },
                {
                    type: 'packet',
                    fromServerId: 'root',
                    toServerId: 'client',
                    fromX: this.servers['root'].x,
                    fromY: this.servers['root'].y,
                    toX: this.servers['client'].x,
                    toY: this.servers['client'].y,
                    query: `${domain} ${recordType} = ${dnsRecords.recordValue || 'No record found'}`
                },
                {
                    type: 'status',
                    message: `Client receives the final answer through the chain of DNS servers`
                }
            ];
        }

        // Reset simulation state
        this.currentStep = 0;
        this.isPlaying = false;
        this.updateStatus('Ready to start simulation');
    }

    updateStatus(message) {
        const statusValue = this.statusDisplay.querySelector('.status-value');
        if (statusValue) {
            statusValue.textContent = message;
        }
    }

    async fetchDNSRecords(domain, recordType) {
        // Initialize with default values
        const dnsRecords = {
            rootServer: null,
            tldServer: null,
            authServer: null,
            recordValue: null
        };

        try {
            // Try to get DNS records from the page if available
            const recordElements = document.querySelectorAll('.records tbody tr');
            if (recordElements.length > 0) {
                // Extract record value from the results table
                for (const row of recordElements) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3 && cells[0].textContent.trim() === recordType) {
                        dnsRecords.recordValue = cells[1].textContent.trim();
                        break;
                    }
                }
            }

            // Try to get server information from the timeline
            const timelineItems = document.querySelectorAll('.timeline-item');
            for (const item of timelineItems) {
                const title = item.querySelector('h3')?.textContent.trim();
                const serverDetails = item.querySelector('.server-details li')?.textContent.trim();

                if (title && serverDetails) {
                    if (title.includes('Root DNS')) {
                        // Extract root server name
                        const match = serverDetails.match(/Contacted ([\w\.-]+)/);
                        if (match && match[1]) {
                            dnsRecords.rootServer = match[1];
                        }
                    } else if (title.includes('TLD')) {
                        // Extract TLD server name
                        const match = serverDetails.match(/Contacted ([\w\.-]+)/);
                        if (match && match[1]) {
                            dnsRecords.tldServer = match[1];
                        }
                    } else if (title.includes('Authoritative')) {
                        // Extract authoritative server name
                        const match = serverDetails.match(/Contacted ([\w\.-]+)/);
                        if (match && match[1]) {
                            dnsRecords.authServer = match[1];
                        }
                    }
                }
            }

            // If we couldn't get the record value from the page, try to fetch it
            if (!dnsRecords.recordValue) {
                // Use a simple fetch to a DNS API service
                try {
                    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=${recordType}`);
                    const data = await response.json();

                    if (data.Answer && data.Answer.length > 0) {
                        dnsRecords.recordValue = data.Answer[0].data;
                    }
                } catch (error) {
                    console.warn('Could not fetch DNS record from API:', error);
                }
            }

            // If we still don't have values, use some defaults
            if (!dnsRecords.rootServer) {
                dnsRecords.rootServer = 'a.root-servers.net';
            }

            if (!dnsRecords.tldServer) {
                const tld = domain.split('.').pop();
                dnsRecords.tldServer = `a.${tld}.servers.net`;
            }

            if (!dnsRecords.authServer) {
                dnsRecords.authServer = `ns1.${domain}`;
            }

            if (!dnsRecords.recordValue) {
                // Use a realistic default based on record type
                switch (recordType) {
                    case 'A':
                        dnsRecords.recordValue = '93.184.216.34'; // example.com IP
                        break;
                    case 'AAAA':
                        dnsRecords.recordValue = '2606:2800:220:1:248:1893:25c8:1946';
                        break;
                    case 'MX':
                        dnsRecords.recordValue = '10 mail.example.com';
                        break;
                    case 'TXT':
                        dnsRecords.recordValue = 'v=spf1 -all';
                        break;
                    case 'NS':
                        dnsRecords.recordValue = 'ns1.example.com';
                        break;
                    default:
                        dnsRecords.recordValue = 'Record not found';
                }
            }
        } catch (error) {
            console.error('Error fetching DNS records:', error);
        }

        return dnsRecords;
    }

    processNextStep() {
        if (this.currentStep >= this.animationQueue.length) {
            this.isPlaying = false;
            this.updatePlayButton();
            this.updateStatus('Simulation complete');
            return;
        }

        const step = this.animationQueue[this.currentStep];
        this.currentStep++;

        if (step.type === 'packet') {
            // Create and animate a packet
            const packetId = `packet-${Date.now()}`;
            const packet = this.createPacket(
                packetId,
                step.fromX,
                step.fromY,
                step.toX,
                step.toY,
                step.query
            );

            this.animatePacket(packet, () => {
                if (this.isPlaying) {
                    this.processNextStep();
                }
            });
        } else if (step.type === 'status') {
            // Update status message
            this.updateStatus(step.message);

            // Move to next step after a delay
            setTimeout(() => {
                if (this.isPlaying) {
                    this.processNextStep();
                }
            }, 1000 / parseFloat(this.speedSlider.value));
        }
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        this.updatePlayButton();

        if (this.isPlaying) {
            if (this.currentStep >= this.animationQueue.length) {
                // Restart if at the end
                this.resetSimulation();
            }
            this.processNextStep();
        }
    }

    updatePlayButton() {
        if (this.isPlaying) {
            this.playButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
        } else {
            this.playButton.innerHTML = '<i class="fas fa-play"></i> Play';
        }
    }

    resetSimulation() {
        // Stop any ongoing animation
        this.isPlaying = false;
        this.updatePlayButton();

        // Clear packets
        this.packetsGroup.innerHTML = '';

        // Reset server states
        Object.values(this.servers).forEach(server => {
            server.element.classList.remove('sending', 'receiving');
        });

        // Reset step counter
        this.currentStep = 0;

        // Reset status
        this.updateStatus('Ready to start simulation');
    }

    // Step forward method removed
}

// Initialize the simulation when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the simulation page
    const simulationContainer = document.getElementById('dns-simulation-container');
    if (simulationContainer) {
        // Get domain and record type from the page
        const domain = document.getElementById('sim-domain')?.value || 'example.com';
        const recordType = document.getElementById('sim-record-type')?.value || 'A';
        const queryMode = document.getElementById('sim-query-mode')?.value || 'recursive';

        // Create the simulation
        const simulation = new DNSSimulation('dns-simulation-container');
        simulation.setupDNSSimulation(domain, recordType, queryMode);

        // Store the simulation instance on the window for access from other scripts
        window.dnsSimulation = simulation;

        // Add event listeners to the form inputs to update the simulation
        const simForm = document.getElementById('simulation-form');
        if (simForm) {
            const domainInput = document.getElementById('sim-domain');
            const recordTypeSelect = document.getElementById('sim-record-type');
            const queryModeSelect = document.getElementById('sim-query-mode');

            const updateSimulation = () => {
                const domain = domainInput.value || 'example.com';
                const recordType = recordTypeSelect.value || 'A';
                const queryMode = queryModeSelect.value || 'recursive';

                simulation.setupDNSSimulation(domain, recordType, queryMode);
            };

            domainInput?.addEventListener('change', updateSimulation);
            recordTypeSelect?.addEventListener('change', updateSimulation);
            queryModeSelect?.addEventListener('change', updateSimulation);
        }

        // If there's a start simulation button, add event listener
        const startSimButton = document.getElementById('start-simulation');
        if (startSimButton) {
            startSimButton.addEventListener('click', function(e) {
                e.preventDefault();
                simulation.resetSimulation();
                simulation.togglePlayPause();
            });
        }
    }

    // Check if we're on the results page
    const resultsContainer = document.getElementById('dns-results-simulation');
    if (resultsContainer) {
        // Get domain and record type from the hidden inputs
        const domainInput = document.getElementById('sim-domain');
        const recordTypeInput = document.getElementById('sim-record-type');
        const queryModeInput = document.getElementById('sim-query-mode');

        let domain = domainInput?.value || 'example.com';
        let recordType = recordTypeInput?.value || 'A';
        let queryMode = queryModeInput?.value || 'recursive';

        // If inputs not found, try to extract from the domain-info section
        if (!domainInput || !recordTypeInput || !queryModeInput) {
            const domainInfo = document.querySelector('.domain-info');
            if (domainInfo) {
                const domainText = domainInfo.querySelector('p:nth-of-type(1)');
                const recordTypeText = domainInfo.querySelector('p:nth-of-type(2)');

                if (domainText) {
                    const match = domainText.textContent.match(/Domain:\s+(.+)/);
                    if (match && match[1]) domain = match[1].trim();
                }

                if (recordTypeText) {
                    const match = recordTypeText.textContent.match(/Record Type:\s+(.+)/);
                    if (match && match[1]) recordType = match[1].trim();
                }

                // Try to determine query mode from the active toggle button
                const activeToggle = document.querySelector('.query-mode-toggle .active');
                if (activeToggle) {
                    if (activeToggle.textContent.trim().toLowerCase().includes('recursive')) {
                        queryMode = 'recursive';
                    } else if (activeToggle.textContent.trim().toLowerCase().includes('iterative')) {
                        queryMode = 'iterative';
                    }
                }
            }
        }

        console.log(`Initializing DNS simulation with: domain=${domain}, recordType=${recordType}, queryMode=${queryMode}`);

        // Create the simulation
        const simulation = new DNSSimulation('dns-results-simulation');
        simulation.setupDNSSimulation(domain, recordType, queryMode);
    }
});
