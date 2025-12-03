document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tabs
    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            if (event.target.id === 'simulation-tab') {
                refreshLeases();
            } else if (event.target.id === 'attack-tab') {
                refreshCompromisedLeases();
                loadDhcpConfig();
            }
        });
    });

    // DHCP Mode Toggle
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
        modeToggle.addEventListener('change', function() {
            const mode = this.checked ? 'static' : 'dynamic';
            const modeLabel = document.getElementById('modeLabel');
            modeLabel.textContent = this.checked ? 'Static IP Mode' : 'Dynamic IP Mode';

            // Update server mode
            toggleDhcpMode(mode);
        });
    }

    // MAC Address Input Toggle
    const useRandomMacCheckbox = document.getElementById('useRandomMac');
    const customMacInput = document.getElementById('customMacInput');

    if (useRandomMacCheckbox && customMacInput) {
        useRandomMacCheckbox.addEventListener('change', function() {
            customMacInput.disabled = this.checked;
            if (this.checked) {
                customMacInput.value = '';
            }
        });

        // Initialize state
        customMacInput.disabled = useRandomMacCheckbox.checked;
    }

    // Rogue Server Toggle
    const rogueServerToggle = document.getElementById('rogueServerToggle');
    if (rogueServerToggle) {
        rogueServerToggle.addEventListener('change', function() {
            const active = this.checked;
            const rogueServerLabel = document.getElementById('rogueServerLabel');
            rogueServerLabel.textContent = active ? 'Rogue DHCP Server (Active)' : 'Rogue DHCP Server (Inactive)';

            // Update rogue server status
            toggleRogueServer(active);
        });
    }

    // Rogue DHCP Mode Toggle
    const rogueModeToggle = document.getElementById('rogueModeToggle');
    if (rogueModeToggle) {
        rogueModeToggle.addEventListener('change', function() {
            const mode = this.checked ? 'static' : 'dynamic';
            const rogueModeLabel = document.getElementById('rogueModeLabel');
            rogueModeLabel.textContent = this.checked ? 'Static IP Mode' : 'Dynamic IP Mode';

            // Update rogue server mode
            toggleRogueMode(mode);
        });
    }

    // DHCP Simulation Button
    const startDhcpSimulationBtn = document.getElementById('startDhcpSimulation');
    if (startDhcpSimulationBtn) {
        startDhcpSimulationBtn.addEventListener('click', startDhcpSimulation);
    }

    // Rogue DHCP Simulation Button
    const startRogueDhcpSimulationBtn = document.getElementById('startRogueDhcpSimulation');
    if (startRogueDhcpSimulationBtn) {
        startRogueDhcpSimulationBtn.addEventListener('click', startRogueDhcpSimulation);
    }

    // MAC Address Input Toggle for Rogue Simulation
    const rogueUseRandomMacCheckbox = document.getElementById('rogueUseRandomMac');
    const rogueCustomMacInput = document.getElementById('rogueCustomMacInput');

    if (rogueUseRandomMacCheckbox && rogueCustomMacInput) {
        rogueUseRandomMacCheckbox.addEventListener('change', function() {
            rogueCustomMacInput.disabled = this.checked;
            if (this.checked) {
                rogueCustomMacInput.value = '';
            }
        });

        // Initialize state
        rogueCustomMacInput.disabled = rogueUseRandomMacCheckbox.checked;
    }

    // Refresh Leases Button
    const refreshLeasesBtn = document.getElementById('refreshLeases');
    if (refreshLeasesBtn) {
        refreshLeasesBtn.addEventListener('click', refreshLeases);
    }

    // Clear Leases Button
    const clearLeasesBtn = document.getElementById('clearLeases');
    if (clearLeasesBtn) {
        clearLeasesBtn.addEventListener('click', clearLeases);
    }

    // Refresh Compromised Leases Button
    const refreshCompromisedLeasesBtn = document.getElementById('refreshCompromisedLeases');
    if (refreshCompromisedLeasesBtn) {
        refreshCompromisedLeasesBtn.addEventListener('click', refreshCompromisedLeases);
    }

    // Load initial DHCP configuration
    loadDhcpConfig();
});

// Generate a random MAC address for simulation
function generateMacAddress() {
    return Array(6).fill(0).map(() => {
        return Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    }).join(':');
}

// Toggle DHCP Mode (Static/Dynamic)
function toggleDhcpMode(mode) {
    fetch('/dhcp/toggle_mode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`DHCP mode changed to ${mode}`);
        } else {
            console.error(`Error changing DHCP mode: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Toggle Rogue DHCP Server
function toggleRogueServer(active) {
    fetch('/dhcp/toggle_rogue_server', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`Rogue DHCP server ${active ? 'activated' : 'deactivated'}`);

            // Update UI elements
            const rogueConnection = document.getElementById('rogueConnection');
            if (rogueConnection) {
                rogueConnection.style.display = active ? 'block' : 'none';
            }
        } else {
            console.error(`Error toggling rogue server: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Toggle Rogue DHCP Mode (Static/Dynamic)
function toggleRogueMode(mode) {
    fetch('/dhcp/toggle_rogue_mode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`Rogue DHCP mode changed to ${mode}`);
        } else {
            console.error(`Error changing rogue DHCP mode: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Load DHCP Configuration
function loadDhcpConfig() {
    fetch('/dhcp/get_dhcp_config')
    .then(response => response.json())
    .then(data => {
        // Update legitimate server info
        document.getElementById('legitimateGateway').textContent = data.legitimate.gateway;
        document.getElementById('legitimateDns').textContent = data.legitimate.dns_servers.join(', ');
        document.getElementById('legitimateRange').textContent = `${data.legitimate.start_ip} - ${data.legitimate.end_ip}`;

        // Update rogue server info
        document.getElementById('rogueGateway').textContent = data.rogue.gateway;
        document.getElementById('rogueDns').textContent = data.rogue.dns_servers.join(', ');
        document.getElementById('rogueRange').textContent = `${data.rogue.start_ip} - ${data.rogue.end_ip}`;
    })
    .catch(error => {
        console.error('Error loading DHCP config:', error);
    });
}

// Start DHCP Simulation
function startDhcpSimulation() {
    // Get MAC address (custom or random)
    let clientMac;
    const useRandomMac = document.getElementById('useRandomMac').checked;
    const customMacInput = document.getElementById('customMacInput');

    if (useRandomMac) {
        // Generate a random MAC address
        clientMac = generateMacAddress();
    } else {
        // Use custom MAC address if provided and valid
        const customMac = customMacInput.value.trim();
        if (isValidMacAddress(customMac)) {
            clientMac = customMac;
        } else {
            alert('Please enter a valid MAC address (format: xx:xx:xx:xx:xx:xx) or enable random generation.');
            return;
        }
    }

    document.getElementById('clientInfo').textContent = `MAC: ${clientMac}`;

    // Reset UI elements
    document.getElementById('dhcpDiscoverContent').textContent = 'Preparing DHCP DISCOVER...';
    document.getElementById('dhcpOfferContent').textContent = 'Waiting for DHCP server response...';
    document.getElementById('dhcpRequestContent').textContent = 'Waiting for DHCP OFFER...';
    document.getElementById('dhcpAckContent').textContent = 'Waiting for DHCP REQUEST...';
    document.getElementById('dhcpStatus').innerHTML = '<strong>Starting DHCP process...</strong>';

    // Highlight client device
    const clientDevice = document.querySelector('.network-device.client');
    clientDevice.classList.add('highlight');

    // Create DHCP DISCOVER packet
    setTimeout(() => {
        // Create and animate DHCP DISCOVER packet
        createDhcpPacket('discover', 'DHCP DISCOVER', clientDevice, 'right');

        // Update DISCOVER content
        document.getElementById('dhcpDiscoverContent').textContent =
`Source MAC: ${clientMac}
Destination MAC: FF:FF:FF:FF:FF:FF (Broadcast)
Message Type: DISCOVER
Client Identifier: ${clientMac}
Requested Parameters: Subnet Mask, Router, DNS`;

        document.getElementById('dhcpStatus').innerHTML = '<strong>Step 1: DISCOVER</strong> - Client broadcasts a message to locate available DHCP servers.';

        // Send DHCP DISCOVER request to server
        fetch('/dhcp/dhcp_discover', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mac: clientMac }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Process DHCP OFFER
                processDhcpOffer(data.offer, clientMac);
            } else {
                document.getElementById('dhcpStatus').innerHTML = `<strong>Error:</strong> ${data.message}`;
                clientDevice.classList.remove('highlight');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('dhcpStatus').innerHTML = '<strong>Error:</strong> Failed to communicate with DHCP server.';
            clientDevice.classList.remove('highlight');
        });
    }, 1000);
}

// Validate MAC address format
function isValidMacAddress(mac) {
    // Check if the MAC address matches the format xx:xx:xx:xx:xx:xx
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
}

// Clear all IP leases
function clearLeases() {
    if (confirm('Are you sure you want to clear all IP leases?')) {
        fetch('/dhcp/clear_leases', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                refreshLeases();
                alert('All IP leases have been cleared.');
            } else {
                console.error(`Error clearing leases: ${data.message}`);
                alert(`Error: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to clear IP leases.');
        });
    }
}

// Process DHCP OFFER
function processDhcpOffer(offer, clientMac) {
    // Highlight server device
    const serverDevice = document.querySelector('.network-device.server');
    const clientDevice = document.querySelector('.network-device.client');

    clientDevice.classList.remove('highlight');
    serverDevice.classList.add('highlight');

    // Create and animate DHCP OFFER packet
    setTimeout(() => {
        createDhcpPacket('offer', 'DHCP OFFER', serverDevice, 'left');

        // Update OFFER content
        document.getElementById('dhcpOfferContent').textContent =
`Source MAC: Server
Destination MAC: ${clientMac}
Message Type: OFFER
Transaction ID: ${offer.transaction_id}
Your IP: ${offer.offered_ip}
Subnet Mask: ${offer.subnet_mask}
Router: ${offer.router}
DNS Servers: ${offer.dns_servers.join(', ')}
Lease Time: ${offer.lease_time} seconds
DHCP Server: ${offer.server_id}`;

        // Display status message with additional info if this is an existing IP
        let statusMessage = `<strong>Step 2: OFFER</strong> - DHCP server offers IP address ${offer.offered_ip}.`;
        if (offer.message) {
            statusMessage += ` <span class="text-info">(${offer.message})</span>`;
        }
        document.getElementById('dhcpStatus').innerHTML = statusMessage;

        // Process DHCP REQUEST
        setTimeout(() => {
            processDhcpRequest(offer, clientMac);
        }, 2000);
    }, 2000);
}

// Process DHCP REQUEST
function processDhcpRequest(offer, clientMac) {
    const serverDevice = document.querySelector('.network-device.server');
    const clientDevice = document.querySelector('.network-device.client');

    serverDevice.classList.remove('highlight');
    clientDevice.classList.add('highlight');

    // Create and animate DHCP REQUEST packet
    setTimeout(() => {
        createDhcpPacket('request', 'DHCP REQUEST', clientDevice, 'right');

        // Update REQUEST content
        document.getElementById('dhcpRequestContent').textContent =
`Source MAC: ${clientMac}
Destination MAC: FF:FF:FF:FF:FF:FF (Broadcast)
Message Type: REQUEST
Transaction ID: ${offer.transaction_id}
Client Identifier: ${clientMac}
Requested IP: ${offer.offered_ip}
DHCP Server: ${offer.server_id}`;

        document.getElementById('dhcpStatus').innerHTML = '<strong>Step 3: REQUEST</strong> - Client requests the offered IP address.';

        // Send DHCP REQUEST to server
        fetch('/dhcp/dhcp_request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mac: clientMac,
                requested_ip: offer.offered_ip,
                server_id: offer.server_id,
                transaction_id: offer.transaction_id,
                is_rogue: offer.is_rogue
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Process DHCP ACK
                processDhcpAck(data.ack, clientMac);
            } else {
                document.getElementById('dhcpStatus').innerHTML = `<strong>Error:</strong> ${data.message}`;
                clientDevice.classList.remove('highlight');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('dhcpStatus').innerHTML = '<strong>Error:</strong> Failed to communicate with DHCP server.';
            clientDevice.classList.remove('highlight');
        });
    }, 1000);
}

// Process DHCP ACK
function processDhcpAck(ack, clientMac) {
    const serverDevice = document.querySelector('.network-device.server');
    const clientDevice = document.querySelector('.network-device.client');

    clientDevice.classList.remove('highlight');
    serverDevice.classList.add('highlight');

    // Create and animate DHCP ACK packet
    setTimeout(() => {
        createDhcpPacket('ack', 'DHCP ACK', serverDevice, 'left');

        // Update ACK content
        document.getElementById('dhcpAckContent').textContent =
`Source MAC: Server
Destination MAC: ${clientMac}
Message Type: ACK
Transaction ID: ${ack.transaction_id}
Your IP: ${ack.assigned_ip}
Subnet Mask: ${ack.subnet_mask}
Router: ${ack.router}
DNS Servers: ${ack.dns_servers.join(', ')}
Lease Time: ${ack.lease_time} seconds
DHCP Server: ${ack.server_id}`;

        document.getElementById('dhcpStatus').innerHTML = `<strong>Step 4: ACKNOWLEDGE</strong> - DHCP server confirms IP address assignment.`;

        // Update client info with assigned IP
        document.getElementById('clientInfo').textContent = `MAC: ${clientMac} | IP: ${ack.assigned_ip}`;

        // Complete the process
        setTimeout(() => {
            serverDevice.classList.remove('highlight');
            document.getElementById('dhcpStatus').innerHTML = `<strong>DHCP Process Complete!</strong> Client has been assigned IP address ${ack.assigned_ip}.`;

            // Refresh the lease table
            refreshLeases();
        }, 2000);
    }, 2000);
}

// Original DHCP packet animation for authentic simulation
function createDhcpPacket(packetClass, packetText, sourceElement, direction, connectionId = 'networkConnection') {
    // Check if this is for the attack simulation
    if (connectionId === 'legitimateNetworkConnection' || connectionId === 'rogueNetworkConnection') {
        // Use enhanced visuals for attack simulation
        createRogueDhcpPacket(packetClass, packetText, sourceElement, direction, connectionId);
        return;
    }

    // Original implementation for authentic simulation
    const networkDiagram = sourceElement.closest('.network-diagram');
    const networkConnection = document.getElementById(connectionId);

    // Create packet element
    const packet = document.createElement('div');
    packet.className = `dhcp-packet ${packetClass}`;
    packet.textContent = packetText;

    // Position packet at source
    const sourceRect = sourceElement.getBoundingClientRect();
    const connectionRect = networkConnection.getBoundingClientRect();
    const diagramRect = networkDiagram.getBoundingClientRect();

    packet.style.top = `${(sourceRect.top + sourceRect.height/2) - diagramRect.top - 10}px`;

    if (direction === 'right') {
        packet.style.left = `${sourceRect.right - diagramRect.left + 10}px`;
        packet.style.animation = 'moveRight 2s forwards';
    } else {
        packet.style.right = `${diagramRect.right - sourceRect.left + 10}px`;
        packet.style.animation = 'moveLeft 2s forwards';
    }

    // Add packet to diagram
    networkDiagram.appendChild(packet);

    // Remove packet after animation
    setTimeout(() => {
        packet.remove();
    }, 2000);
}

// Enhanced DHCP packet animation for rogue simulation
function createRogueDhcpPacket(packetClass, packetText, sourceElement, direction, connectionId) {
    // Find the packet container based on the connection ID
    let packetContainerId;
    if (connectionId === 'legitimateNetworkConnection') {
        packetContainerId = 'legitimatePacketContainer';
    } else if (connectionId === 'rogueNetworkConnection') {
        packetContainerId = 'roguePacketContainer';
    } else {
        packetContainerId = 'packetContainer';
    }

    const packetContainer = document.getElementById(packetContainerId);
    if (!packetContainer) return;

    // Create packet element
    const packet = document.createElement('div');
    packet.className = `dhcp-packet ${packetClass}`;
    packet.textContent = packetText;

    // Set initial position
    if (direction === 'right') {
        packet.style.top = '0%';
        packet.style.left = '50%';
        packet.style.transform = 'translateX(-50%)';
        packet.style.animation = 'moveDown 2s forwards';
    } else {
        packet.style.bottom = '0%';
        packet.style.left = '50%';
        packet.style.transform = 'translateX(-50%)';
        packet.style.animation = 'moveUp 2s forwards';
    }

    // Add packet to container
    packetContainer.appendChild(packet);

    // Add traffic flow indicator
    const trafficIndicator = document.createElement('div');
    trafficIndicator.className = 'traffic-indicator';
    document.getElementById(connectionId).appendChild(trafficIndicator);

    // Remove elements after animation
    setTimeout(() => {
        packet.remove();
        trafficIndicator.remove();
    }, 2000);
}

// New function for horizontal packet animation in rogue simulation
function createHorizontalPacket(packetClass, packetText, sourceElement, direction, connectionId) {
    // Get the container and connection elements
    const container = document.querySelector('.attack-simulation-container');
    const connection = document.getElementById(connectionId);

    if (!container || !connection) {
        console.error('Container or connection element not found');
        return;
    }

    // Create packet element
    const packet = document.createElement('div');
    packet.className = `rogue-packet ${packetClass}`;
    packet.textContent = packetText;

    // Get positions for animation
    const containerRect = container.getBoundingClientRect();
    const connectionRect = connection.getBoundingClientRect();

    // Position packet along the connection
    packet.style.top = `${connectionRect.top - containerRect.top - 20}px`;

    // Set animation based on direction and connection
    // Calculate animation duration and step size
    const normalDuration = 3000; // 3 seconds for normal speed
    const fastDuration = 1000;   // 1 second for fast speed

    // Standard step size for client-to-server (same for both directions)
    const clientToServerStepSize = 0.5;

    // Different step sizes for server-to-client based on server type
    const legitimateToClientStepSize = 0.5; // Normal speed
    const rogueToClientStepSize = 1.5;      // Fast speed

    if (connectionId === 'legitimateNetworkConnection') {
        // Left connection (legitimate server)
        if (direction === 'right') {
            // Client to legitimate server (left movement: 50% to 0%)
            packet.style.left = '50%';
            packet.style.animation = 'none';

            // Manually animate from 50% to 0% (standard client speed)
            let startPos = 50;
            let startTime = performance.now();

            const animateLeft = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / normalDuration, 1);
                startPos = 50 - (progress * 50);
                packet.style.left = `${startPos}%`;

                if (progress < 1) {
                    requestAnimationFrame(animateLeft);
                } else {
                    setTimeout(() => packet.remove(), 100);
                }
            };
            requestAnimationFrame(animateLeft);
        } else {
            // Legitimate server to client (right movement: 0% to 50%)
            packet.style.left = '0%';
            packet.style.animation = 'none';

            // Manually animate from 0% to 50% (normal speed - 3s)
            let startPos = 0;
            let startTime = performance.now();

            const animateRight = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / normalDuration, 1);
                startPos = progress * 50;
                packet.style.left = `${startPos}%`;

                if (progress < 1) {
                    requestAnimationFrame(animateRight);
                } else {
                    setTimeout(() => packet.remove(), 100);
                }
            };
            requestAnimationFrame(animateRight);
        }
    } else {
        // Right connection (rogue server)
        if (direction === 'right') {
            // Client to rogue server (right movement: 50% to 100%)
            packet.style.left = '50%';
            packet.style.animation = 'none';

            // Manually animate from 50% to 100% (standard client speed)
            let startPos = 50;
            let startTime = performance.now();

            const animateRight = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / normalDuration, 1);
                startPos = 50 + (progress * 50);
                packet.style.left = `${startPos}%`;

                if (progress < 1) {
                    requestAnimationFrame(animateRight);
                } else {
                    setTimeout(() => packet.remove(), 100);
                }
            };
            requestAnimationFrame(animateRight);
        } else {
            // Rogue server to client (left movement: 100% to 50%)
            packet.style.left = '100%';
            packet.style.animation = 'none';

            // Manually animate from 100% to 50% (faster speed - 1s)
            let startPos = 100;
            let startTime = performance.now();

            const animateLeft = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / fastDuration, 1);
                startPos = 100 - (progress * 50);
                packet.style.left = `${startPos}%`;

                if (progress < 1) {
                    requestAnimationFrame(animateLeft);
                } else {
                    setTimeout(() => packet.remove(), 100);
                }
            };
            requestAnimationFrame(animateLeft);
        }
    }

    // Add packet to container
    container.appendChild(packet);

    // Add traffic flow indicator
    const trafficIndicator = document.createElement('div');
    trafficIndicator.className = 'horizontal-traffic';

    // Set traffic indicator properties based on connection and direction
    if (connectionId === 'legitimateNetworkConnection') {
        trafficIndicator.style.backgroundColor = 'rgba(40, 167, 69, 0.5)';
        trafficIndicator.style.top = '0';

        if (direction === 'right') {
            // Client to legitimate server (left movement: 50% to 0%)
            trafficIndicator.style.left = '0%';
            trafficIndicator.style.width = '50%';
        } else {
            // Legitimate server to client (right movement: 0% to 50%)
            trafficIndicator.style.left = '0%';
            trafficIndicator.style.width = '50%';
        }
    } else {
        trafficIndicator.style.backgroundColor = 'rgba(220, 53, 69, 0.5)';
        trafficIndicator.style.top = '0';

        if (direction === 'right') {
            // Client to rogue server (right movement: 50% to 100%)
            trafficIndicator.style.left = '50%';
            trafficIndicator.style.width = '50%';
        } else {
            // Rogue server to client (left movement: 100% to 50%)
            trafficIndicator.style.left = '50%';
            trafficIndicator.style.width = '50%';
        }
    }

    // Add traffic indicator to connection
    connection.appendChild(trafficIndicator);

    // Only remove the packet after animation, keep the traffic indicator
    // The traffic indicator will be cleared when a new animation starts or when the simulation resets

    console.log(`Created horizontal packet: ${packetText} for ${connectionId} in direction ${direction}`);
}

// Initialize page when loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize code here if needed
});

// Refresh IP Lease Table
function refreshLeases() {
    fetch('/dhcp/get_leases')
    .then(response => response.json())
    .then(leases => {
        const tableBody = document.getElementById('ipLeaseTable');

        // Filter out rogue entries - only show legitimate DHCP leases
        const legitimateLeases = leases.filter(lease => !lease.is_rogue);

        if (legitimateLeases.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No active leases</td></tr>';
            return;
        }

        let tableContent = '';
        legitimateLeases.forEach(lease => {
            // Calculate time remaining
            const expiryTime = new Date(lease.expiry_time);
            const currentTime = new Date();
            const timeRemaining = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));

            const statusClass = lease.active ? 'active' : 'expired';
            const statusText = lease.active ? 'Active' : 'Expired';
            const rowClass = lease.is_rogue ? 'compromised' : '';
            const typeText = lease.type || 'dynamic'; // Default to dynamic if not specified
            const typeClass = typeText === 'static' ? 'text-primary' : '';

            // For static entries, show "--" for lease time and expiry
            const leaseTimeDisplay = typeText === 'static' ? '--' : `${lease.lease_time} seconds`;
            const expiryDisplay = typeText === 'static' ?
                '<span>--</span>' :
                `<span class="countdown" data-expiry="${lease.expiry_time}">${formatTimeRemaining(timeRemaining)}</span>`;

            // Disable Release and Renew buttons for static entries
            const isStatic = typeText === 'static';
            const releaseButtonAttr = isStatic ? 'disabled' : '';
            const renewButtonAttr = isStatic ? 'disabled' : '';

            tableContent += `
            <tr class="${rowClass}">
                <td>${lease.ip}</td>
                <td>${lease.mac}</td>
                <td><span class="${typeClass}">${typeText}</span></td>
                <td>${leaseTimeDisplay}</td>
                <td>${expiryDisplay}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-warning release-btn" data-ip="${lease.ip}" ${releaseButtonAttr}>Release</button>
                        <button class="btn btn-success renew-btn" data-ip="${lease.ip}" ${renewButtonAttr}>Renew</button>
                        <button class="btn btn-danger remove-btn" data-ip="${lease.ip}">Remove</button>
                    </div>
                </td>
            </tr>`;
        });

        tableBody.innerHTML = tableContent;

        // Add event listeners to buttons
        document.querySelectorAll('.release-btn').forEach(button => {
            button.addEventListener('click', function() {
                releaseIp(this.getAttribute('data-ip'));
            });
        });

        document.querySelectorAll('.renew-btn').forEach(button => {
            button.addEventListener('click', function() {
                renewIp(this.getAttribute('data-ip'));
            });
        });

        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', function() {
                removeIp(this.getAttribute('data-ip'));
            });
        });

        // Start countdown timers
        startCountdowns();
    })
    .catch(error => {
        console.error('Error refreshing leases:', error);
    });
}

// Refresh Compromised Leases Table
function refreshCompromisedLeases() {
    fetch('/dhcp/get_leases')
    .then(response => response.json())
    .then(leases => {
        const tableBody = document.getElementById('compromisedLeaseTable');

        // Filter for compromised (rogue) leases
        const compromisedLeases = leases.filter(lease => lease.is_rogue);

        if (compromisedLeases.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No compromised leases</td></tr>';
            return;
        }

        let tableContent = '';
        compromisedLeases.forEach(lease => {
            const statusClass = lease.active ? 'active' : 'expired';
            const statusText = lease.active ? 'Compromised' : 'Expired';
            const typeText = lease.type || 'dynamic'; // Default to dynamic if not specified

            tableContent += `
            <tr class="compromised">
                <td>${lease.ip}</td>
                <td>${lease.mac}</td>
                <td><span class="${typeText === 'static' ? 'text-primary' : ''}">${typeText}</span></td>
                <td>192.168.1.254 (Attacker)</td>
                <td>192.168.1.254 (Malicious)</td>
                <td><span class="${statusClass}">${statusText}</span></td>
            </tr>`;
        });

        tableBody.innerHTML = tableContent;
    })
    .catch(error => {
        console.error('Error refreshing compromised leases:', error);
    });
}

// Release IP Address
function releaseIp(ip) {
    fetch('/dhcp/release_ip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            refreshLeases();
        } else {
            console.error(`Error releasing IP: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Renew IP Address
function renewIp(ip) {
    fetch('/dhcp/renew_ip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            refreshLeases();
        } else {
            console.error(`Error renewing IP: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Remove IP Address (completely delete the record)
function removeIp(ip) {
    if (confirm(`Are you sure you want to remove the IP lease for ${ip}?`)) {
        fetch('/dhcp/delete_lease', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ip }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                refreshLeases();
                refreshCompromisedLeases(); // Also refresh the compromised leases table if needed
            } else {
                console.error(`Error removing IP: ${data.message}`);
                alert(`Error: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to remove IP lease.');
        });
    }
}

// Format time remaining for display
function formatTimeRemaining(seconds) {
    if (seconds <= 0) {
        return 'Expired';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    } else {
        return `${remainingSeconds}s`;
    }
}

// Start countdown timers for lease expiry
function startCountdowns() {
    const countdowns = document.querySelectorAll('.countdown');

    // Clear any existing intervals
    if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
    }

    // Update countdowns every second
    window.countdownInterval = setInterval(() => {
        const currentTime = new Date();

        countdowns.forEach(countdown => {
            const expiryTime = new Date(countdown.getAttribute('data-expiry'));
            const timeRemaining = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));

            countdown.textContent = formatTimeRemaining(timeRemaining);

            // Update row status if expired
            if (timeRemaining <= 0) {
                const row = countdown.closest('tr');
                const statusCell = row.querySelector('td:nth-child(5) span');
                statusCell.className = 'expired';
                statusCell.textContent = 'Expired';
            }
        });
    }, 1000);
}

// Start Rogue DHCP Simulation with horizontal layout
function startRogueDhcpSimulation() {
    const rogueServerActive = document.getElementById('rogueServerToggle').checked;
    const attackStatus = document.getElementById('attackStatus');
    const clientDevice = document.querySelector('.horizontal-network-diagram .network-device.victim');
    const rogueServer = document.querySelector('.horizontal-network-diagram .network-device.attacker');
    const legitimateServer = document.querySelector('.horizontal-network-diagram .network-device.legitimate');
    const rogueResponseTime = document.getElementById('rogueResponseTime');
    const legitimateResponseTime = document.getElementById('legitimateResponseTime');

    // Reset UI elements
    clientDevice.classList.remove('highlight', 'compromised', 'pulse-animation');
    rogueServer.classList.remove('highlight', 'pulse-animation');
    legitimateServer.classList.remove('highlight', 'pulse-animation');
    rogueResponseTime.innerHTML = '';
    legitimateResponseTime.innerHTML = '';
    legitimateServer.style.opacity = '1';

    // Remove any existing packets and traffic indicators
    document.querySelectorAll('.rogue-packet, .horizontal-traffic').forEach(el => el.remove());

    // Check if rogue server is active
    if (!rogueServerActive) {
        attackStatus.innerHTML = '<strong>Rogue DHCP server is not active.</strong> Please activate it to simulate the DHCP process.';
        return;
    }

    // Get MAC address (custom or random)
    let clientMac;
    const useRandomMac = document.getElementById('rogueUseRandomMac').checked;
    const customMacInput = document.getElementById('rogueCustomMacInput');

    if (useRandomMac) {
        // Generate a random MAC address
        clientMac = generateMacAddress();
    } else {
        // Use custom MAC address if provided and valid
        const customMac = customMacInput.value.trim();
        if (isValidMacAddress(customMac)) {
            clientMac = customMac;
        } else {
            alert('Please enter a valid MAC address (format: xx:xx:xx:xx:xx:xx) or enable random generation.');
            return;
        }
    }

    document.getElementById('rogueClientInfo').textContent = `MAC: ${clientMac}`;

    // Reset UI elements
    document.getElementById('rogueDiscoverContent').textContent = 'Preparing DHCP DISCOVER...';
    document.getElementById('rogueOfferContent').textContent = 'Waiting for DHCP server response...';
    document.getElementById('rogueRequestContent').textContent = 'Waiting for DHCP OFFER...';
    document.getElementById('rogueAckContent').textContent = 'Waiting for DHCP REQUEST...';
    document.getElementById('attackStatus').innerHTML = '<strong>Starting DHCP process with rogue server...</strong>';

    // Highlight client device
    clientDevice.classList.add('highlight');

    // Create DHCP DISCOVER packet with horizontal animation
    setTimeout(() => {
        // Add visual effects to the client (highlight only, no pulse)
        clientDevice.classList.add('highlight');

        // Create and animate DHCP DISCOVER packet to both servers using our new function
        createHorizontalPacket('discover', 'DHCP DISCOVER', clientDevice, 'right', 'rogueNetworkConnection');
        createHorizontalPacket('discover', 'DHCP DISCOVER', clientDevice, 'right', 'legitimateNetworkConnection');

        // Update DISCOVER content with more detailed information
        document.getElementById('rogueDiscoverContent').textContent =
`Source MAC: ${clientMac}
Destination MAC: FF:FF:FF:FF:FF:FF (Broadcast)
Message Type: DISCOVER
Client Identifier: ${clientMac}
Transaction ID: ${Math.floor(Math.random() * 1000000)}
Requested Parameters: Subnet Mask, Router, DNS
Broadcast Flag: 1 (Broadcast)`;

        // Update status with more detailed explanation
        document.getElementById('attackStatus').innerHTML =
            '<strong>Step 1: DISCOVER</strong> - Client broadcasts a DHCPDISCOVER message to locate available DHCP servers. ' +
            'This message is sent to the broadcast address (FF:FF:FF:FF:FF:FF) so all DHCP servers on the network can receive it.';

        // Highlight both servers to show they received the DISCOVER
        setTimeout(() => {
            // Visual effect for servers receiving the broadcast
            legitimateServer.classList.add('highlight');
            rogueServer.classList.add('highlight');
            // No need to remove pulse animation as we're not adding it

            // Show response time preparation - rogue server responds faster
            setTimeout(() => {
                rogueResponseTime.innerHTML = '<span class="badge bg-danger">Faster Response</span>';
                rogueResponseTime.style.left = '95%'; // Center over the rogue server
                legitimateResponseTime.innerHTML = '<span class="badge bg-secondary">Slower Response</span>';
                legitimateResponseTime.style.left = '5%'; // Center over the legitimate server

                // Update status with more detailed explanation
                document.getElementById('attackStatus').innerHTML =
                    '<strong>Step 1.5:</strong> Both legitimate and rogue DHCP servers receive the DISCOVER message. ' +
                    'The rogue server is configured to respond faster than the legitimate server.';
            }, 1000);
        }, 2000);

        // Send DHCP DISCOVER request to server (using the attack endpoint to ensure rogue server responds)
        fetch('/dhcp/attack_dhcp_discover', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mac: clientMac }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.offer.is_rogue) {
                // Process DHCP OFFER from rogue server using our new horizontal animation function
                processHorizontalRogueOffer(data.offer, clientMac);
            } else {
                document.getElementById('attackStatus').innerHTML = `<strong>Error:</strong> The rogue DHCP server did not respond. Make sure it is activated.`;
                clientDevice.classList.remove('highlight');
                rogueResponseTime.innerHTML = '';
                legitimateResponseTime.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('attackStatus').innerHTML = '<strong>Error:</strong> Failed to communicate with DHCP server.';
            clientDevice.classList.remove('highlight');
            rogueResponseTime.innerHTML = '';
            legitimateResponseTime.innerHTML = '';
        });
    }, 1000);
}

// Process Rogue DHCP OFFER with horizontal animation
function processHorizontalRogueOffer(offer, clientMac) {
    // Get device elements
    const rogueServer = document.querySelector('.horizontal-network-diagram .network-device.attacker');
    const legitimateServer = document.querySelector('.horizontal-network-diagram .network-device.legitimate');
    const clientDevice = document.querySelector('.horizontal-network-diagram .network-device.victim');
    const rogueResponseTime = document.getElementById('rogueResponseTime');
    const legitimateResponseTime = document.getElementById('legitimateResponseTime');

    // Reset client highlight
    clientDevice.classList.remove('highlight', 'pulse-animation');

    // Show that the rogue server responds faster with visual effects
    setTimeout(() => {
        // Add visual effect to show legitimate server is slower
        legitimateServer.classList.remove('highlight');
        legitimateServer.style.opacity = '0.7';

        // Add visual effect to show rogue server is faster (highlight only, no pulse)
        rogueServer.classList.add('highlight');
        legitimateServer.classList.add('highlight');

        

        // Update status with detailed explanation
        document.getElementById('attackStatus').innerHTML =
            '<strong>Step 2:</strong> The rogue DHCP server responds faster than the legitimate server. ' +
            'This is a common technique in DHCP attacks where the attacker configures their server to respond more quickly.';

        // Wait for the normal duration of client-to-server packet (3s) before sending response
        setTimeout(() => {
            // Create the packet animation from rogue server to client (faster response - 1s)
            createHorizontalPacket('malicious', 'ROGUE DHCP OFFER', rogueServer, 'left', 'rogueNetworkConnection');

            // Update OFFER content with more detailed information
            document.getElementById('rogueOfferContent').textContent =
`Source MAC: Rogue Server (${offer.server_id})
Destination MAC: ${clientMac}
Message Type: OFFER
Transaction ID: ${offer.transaction_id}
Your IP: ${offer.offered_ip}
Subnet Mask: ${offer.subnet_mask}
Router: ${offer.router} (Malicious Gateway)
DNS Servers: ${offer.dns_servers.join(', ')} (Malicious DNS)
Lease Time: ${offer.lease_time} seconds
DHCP Server: ${offer.server_id}
Renewal Time: ${Math.floor(offer.lease_time/2)} seconds
Rebinding Time: ${Math.floor(offer.lease_time*0.875)} seconds`;

            // Display status message with additional info if this is an existing IP
            let statusMessage =
                `<strong>Step 2: OFFER</strong> - Rogue DHCP server offers IP address ${offer.offered_ip} with malicious configuration. ` +
                `<span class="text-danger">Notice the malicious gateway and DNS settings that will redirect traffic through the attacker.</span>`;

            if (offer.message) {
                statusMessage += ` <span class="text-info">(${offer.message})</span>`;
            }
            document.getElementById('attackStatus').innerHTML = statusMessage;

            // Highlight the client to show it received the offer
            setTimeout(() => {
                // No need to remove pulse animation as we're not adding it
                clientDevice.classList.add('highlight');

                // Process DHCP REQUEST after a delay
                setTimeout(() => {
                    processHorizontalRogueRequest(offer, clientMac);
                }, 2000);
            }, 2000);
        }, 3000); // Wait for full client-to-server animation (3s)
    }, 1000);
}

// Process Rogue DHCP REQUEST with horizontal animation
function processHorizontalRogueRequest(offer, clientMac) {
    // Get device elements
    const rogueServer = document.querySelector('.horizontal-network-diagram .network-device.attacker');
    const legitimateServer = document.querySelector('.horizontal-network-diagram .network-device.legitimate');
    const clientDevice = document.querySelector('.horizontal-network-diagram .network-device.victim');
    const rogueResponseTime = document.getElementById('rogueResponseTime');
    const legitimateResponseTime = document.getElementById('legitimateResponseTime');

    // Reset server highlights
    rogueServer.classList.remove('highlight');
    legitimateServer.classList.remove('highlight');
    legitimateServer.style.opacity = '1'; // Restore opacity
    rogueResponseTime.innerHTML = '';
    legitimateResponseTime.innerHTML = '';

    // Add visual effect to client (highlight only, no pulse)
    clientDevice.classList.add('highlight');

    // Update status with detailed explanation about the client's decision
    document.getElementById('attackStatus').innerHTML =
        '<strong>Step 3 (Decision):</strong> Client decides to accept the first offer it received (from the rogue server). ' +
        'The client doesn\'t know this is a malicious server.';

    // Create and animate DHCP REQUEST packet with horizontal animation
    setTimeout(() => {
        // No need to remove pulse animation as we're not adding it

        // Create the packet animation - broadcast to all servers
        createHorizontalPacket('request', 'DHCP REQUEST', clientDevice, 'right', 'rogueNetworkConnection');
        createHorizontalPacket('request', 'DHCP REQUEST', clientDevice, 'right', 'legitimateNetworkConnection');

        // Update REQUEST content with more detailed information
        document.getElementById('rogueRequestContent').textContent =
`Source MAC: ${clientMac}
Destination MAC: FF:FF:FF:FF:FF:FF (Broadcast)
Message Type: REQUEST
Transaction ID: ${offer.transaction_id}
Client Identifier: ${clientMac}
Requested IP: ${offer.offered_ip}
DHCP Server: ${offer.server_id} (Selected Server)
Parameter Request List: Subnet Mask, Router, DNS
Client Hostname: Client-${clientMac.substring(9).replace(/:/g, '')}`;

        // Update status with more detailed explanation
        document.getElementById('attackStatus').innerHTML =
            '<strong>Step 3: REQUEST</strong> - Client broadcasts a DHCPREQUEST message to formally request the offered IP. ' +
            'This message includes the server identifier of the chosen DHCP server (the rogue server) and is broadcast so other servers know their offers were declined.';

        // Show the legitimate server acknowledging the rejection
        setTimeout(() => {
            // Add rejection indicator to legitimate server
            legitimateResponseTime.innerHTML = '<span class="badge bg-secondary">Offer Declined</span>';
            legitimateResponseTime.style.left = '5%'; // Center over the legitimate server

            // Highlight rogue server to show it's processing the request
            rogueServer.classList.add('highlight');
            rogueResponseTime.innerHTML = '<span class="badge bg-danger">Processing Request</span>';
            rogueResponseTime.style.left = '95%'; // Center over the rogue server
        }, 2000);

        // Wait for the normal duration of client-to-server packet (3s) before processing
        setTimeout(() => {
            // Send DHCP REQUEST to server
            fetch('/dhcp/dhcp_request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mac: clientMac,
                requested_ip: offer.offered_ip,
                server_id: offer.server_id,
                transaction_id: offer.transaction_id,
                is_rogue: true
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Process DHCP ACK using our new horizontal animation function
                processHorizontalRogueAck(data.ack, clientMac);
            } else {
                document.getElementById('attackStatus').innerHTML = `<strong>Error:</strong> ${data.message}`;
                clientDevice.classList.remove('highlight');
                rogueResponseTime.innerHTML = '';
                legitimateResponseTime.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('attackStatus').innerHTML = '<strong>Error:</strong> Failed to communicate with DHCP server.';
            clientDevice.classList.remove('highlight');
            rogueResponseTime.innerHTML = '';
            legitimateResponseTime.innerHTML = '';
        });
        }, 3000); // Wait for full client-to-server animation (3s)
    }, 2000);
}

// Process Rogue DHCP ACK with horizontal animation
function processHorizontalRogueAck(ack, clientMac) {
    // Get device elements
    const rogueServer = document.querySelector('.horizontal-network-diagram .network-device.attacker');
    const legitimateServer = document.querySelector('.horizontal-network-diagram .network-device.legitimate');
    const clientDevice = document.querySelector('.horizontal-network-diagram .network-device.victim');
    const rogueResponseTime = document.getElementById('rogueResponseTime');
    const legitimateResponseTime = document.getElementById('legitimateResponseTime');

    // Reset client highlight
    clientDevice.classList.remove('highlight');

    // Wait for the normal duration of client-to-server packet (3s) before sending ACK
    setTimeout(() => {
        // Create the packet animation
        createHorizontalPacket('malicious', 'ROGUE DHCP ACK', rogueServer, 'left', 'rogueNetworkConnection');

        // Update ACK content with more detailed information
        document.getElementById('rogueAckContent').textContent =
`Source MAC: Rogue Server (${ack.server_id})
Destination MAC: ${clientMac}
Message Type: ACK
Transaction ID: ${ack.transaction_id}
Your IP: ${ack.assigned_ip}
Subnet Mask: ${ack.subnet_mask}
Router: ${ack.router} (Malicious Gateway)
DNS Servers: ${ack.dns_servers.join(', ')} (Malicious DNS)
Lease Time: ${ack.lease_time} seconds
DHCP Server: ${ack.server_id}
Renewal Time: ${Math.floor(ack.lease_time/2)} seconds
Rebinding Time: ${Math.floor(ack.lease_time*0.875)} seconds`;

        // Update status with more detailed explanation
        document.getElementById('attackStatus').innerHTML =
            `<strong>Step 4: ACKNOWLEDGE</strong> - Rogue DHCP server confirms IP address assignment with malicious configuration. ` +
            `The client is now configured to use the attacker's machine as its gateway and DNS server.`;

        
        // Add compromised visual effect to client
        setTimeout(() => {
            // Remove server highlight
            rogueServer.classList.remove('highlight');
            legitimateServer.classList.remove('highlight');
            rogueResponseTime.innerHTML = '';
            legitimateResponseTime.innerHTML = '';

            // Add compromised effect to client (without pulse animation)
            clientDevice.classList.add('compromised');
            document.getElementById('rogueClientInfo').textContent = `MAC: ${clientMac} | IP: ${ack.assigned_ip} | Gateway: ${ack.router} (Malicious)`;


            // Update status to show completion
            document.getElementById('attackStatus').innerHTML =
                `<strong>Attack Complete!</strong> The client has been compromised and is now using the attacker's machine as its gateway and DNS server. ` +
                `All traffic from this client will be routed through the attacker's machine, allowing for man-in-the-middle attacks.`;

            // Refresh the compromised leases table
            refreshCompromisedLeases();

            // Set up automatic refresh of the compromised leases table
            setTimeout(() => {
                refreshCompromisedLeases(); // Refresh again after a delay to ensure the table is updated

                // Stop all animations and blinking after 2 seconds
                setTimeout(() => {
                    // Remove all animation classes from all elements
                    document.querySelectorAll('.highlight, .pulse-animation, .blink').forEach(el => {
                        el.classList.remove('highlight', 'pulse-animation', 'blink');
                    });

                    // Remove all response time indicators
                    document.getElementById('rogueResponseTime').innerHTML = '';
                    document.getElementById('legitimateResponseTime').innerHTML = '';

                    // Remove all traffic indicators but keep the compromised state
                    document.querySelectorAll('.horizontal-traffic').forEach(el => el.remove());

                    // Make sure the client stays marked as compromised
                    document.querySelector('.horizontal-network-diagram .network-device.victim').classList.add('compromised');

                    // Reset opacity for all elements
                    document.querySelectorAll('.network-device').forEach(el => {
                        el.style.opacity = '1';
                    });

                    // Specifically ensure the legitimate server's opacity is reset
                    const legitServer = document.querySelector('.horizontal-network-diagram .network-device.legitimate');
                    if (legitServer) {
                        legitServer.style.opacity = '1';
                    }
                }, 2000);
            }, 1000);
        }, 2000);
    }, 3000); // Wait for full client-to-server animation (3s)
}
