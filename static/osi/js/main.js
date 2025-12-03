document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tabs
    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            // Handle tab changes if needed
        });
    });

    // OSI Layer Click Handlers
    const osiLayers = document.querySelectorAll('.osi-layer');
    osiLayers.forEach(layer => {
        layer.addEventListener('click', function() {
            const layerId = this.getAttribute('data-layer');
            fetchOsiLayerDetails(layerId);

            // Highlight the selected layer
            osiLayers.forEach(l => l.classList.remove('active-layer'));
            this.classList.add('active-layer');
        });
    });

    // TCP/IP Layer Click Handlers
    const tcpipLayers = document.querySelectorAll('.tcpip-layer');
    tcpipLayers.forEach(layer => {
        layer.addEventListener('click', function() {
            const layerId = this.getAttribute('data-layer');
            fetchTcpIpLayerDetails(layerId);
        });
    });

    // Initialize buttons
    initializeButtons();

    // Load initial data
    if (document.querySelector('.osi-layer')) {
        // Select the first layer by default
        document.querySelector('.osi-layer[data-layer="7"]').click();
    }
});

// Fetch OSI Layer Details
function fetchOsiLayerDetails(layerId) {
    fetch(`/osi/get_osi_layer/${layerId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayOsiLayerInfo(data.layer, layerId);
            } else {
                console.error('Error fetching layer details:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Fetch TCP/IP Layer Details
function fetchTcpIpLayerDetails(layerId) {
    fetch(`/osi/get_tcpip_layer/${layerId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayTcpIpLayerInfo(data.layer, layerId);
            } else {
                console.error('Error fetching TCP/IP layer details:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Display OSI Layer Information
function displayOsiLayerInfo(layer, layerId) {
    const layerTitle = document.getElementById('selected-layer-title');
    const layerInfo = document.getElementById('layer-info');

    layerTitle.textContent = `Layer ${layerId}: ${layer.name}`;

    let protocolsList = '';
    layer.protocols.forEach(protocol => {
        protocolsList += `<li>${protocol}</li>`;
    });

    let devicesList = '';
    layer.devices.forEach(device => {
        devicesList += `<li>${device}</li>`;
    });

    layerInfo.innerHTML = `
        <p><strong>Description:</strong> ${layer.description}</p>
        <p><strong>TCP/IP Equivalent:</strong> ${layer.tcpip_equivalent}</p>
        <p><strong>Real-world Analogy:</strong> ${layer.analogy}</p>

        <div class="mt-3">
            <h5>Data Units</h5>
            <p><strong>PDU (Protocol Data Unit):</strong> ${layer.pdu}</p>
            <p><strong>SDU (Service Data Unit):</strong> ${layer.sdu}</p>
        </div>

        <div class="mt-3">
            <h5>Headers & Encapsulation</h5>
            <p><strong>Header Information:</strong> ${layer.header_info}</p>
            <p><strong>Encapsulation Process:</strong> ${layer.encapsulation}</p>
        </div>

        <div class="mt-3">
            <h5>Common Protocols</h5>
            <ul>${protocolsList}</ul>
        </div>

        <div class="mt-3">
            <h5>Devices at this Layer</h5>
            <ul>${devicesList}</ul>
        </div>
    `;
}

// Display TCP/IP Layer Information
function displayTcpIpLayerInfo(layer, layerId) {
    const layerTitle = document.getElementById('selected-layer-title');
    const layerInfo = document.getElementById('layer-info');

    layerTitle.textContent = `TCP/IP Layer ${layerId}: ${layer.name}`;

    let protocolsList = '';
    layer.protocols.forEach(protocol => {
        protocolsList += `<li>${protocol}</li>`;
    });

    let osiEquivalent = '';
    layer.osi_equivalent.forEach(osiLayer => {
        osiEquivalent += `<li>Layer ${osiLayer}</li>`;
    });

    let headersList = '';
    if (layer.headers) {
        layer.headers.forEach(header => {
            headersList += `<li><strong>${header.name}:</strong> ${header.description}</li>`;
        });
    }

    layerInfo.innerHTML = `
        <p><strong>Description:</strong> ${layer.description}</p>

        <div class="mt-3">
            <h5>Data Units</h5>
            <p><strong>PDU (Protocol Data Unit):</strong> ${layer.pdu}</p>
            <p><strong>SDU (Service Data Unit):</strong> ${layer.sdu}</p>
        </div>

        <div class="mt-3">
            <h5>Headers & Encapsulation</h5>
            <p><strong>Header Function:</strong> ${layer.header_function}</p>
            <ul>${headersList}</ul>
        </div>

        <div class="mt-3">
            <h5>Common Protocols</h5>
            <ul>${protocolsList}</ul>
        </div>

        <div class="mt-3">
            <h5>OSI Model Equivalent</h5>
            <ul>${osiEquivalent}</ul>
        </div>
    `;
}

// Initialize all interactive buttons
function initializeButtons() {
    // No animation buttons for OSI Model tab anymore

    // TCP Communication Buttons
    const startTcpCommunicationBtn = document.getElementById('startTcpCommunicationBtn');
    const resetTcpCommunicationBtn = document.getElementById('resetTcpCommunicationBtn');
    const slowAnimationToggle = document.getElementById('slowAnimationToggle');

    if (startTcpCommunicationBtn) {
        startTcpCommunicationBtn.addEventListener('click', startTcpCommunication);
    }

    if (resetTcpCommunicationBtn) {
        resetTcpCommunicationBtn.addEventListener('click', resetTcpCommunication);
    }

    if (slowAnimationToggle) {
        slowAnimationToggle.addEventListener('change', function() {
            slowAnimation = this.checked;
        });
    }

    // TCP Phase Tabs
    const connectionTab = document.getElementById('connection-tab');
    const dataTransferTab = document.getElementById('data-transfer-tab');
    const terminationTab = document.getElementById('termination-tab');

    if (connectionTab) {
        connectionTab.addEventListener('click', () => {
            currentTcpPhase = 'connection';
            resetTcpCommunication();
        });
    }

    if (dataTransferTab) {
        dataTransferTab.addEventListener('click', () => {
            currentTcpPhase = 'data-transfer';
            resetTcpCommunication();
        });
    }

    if (terminationTab) {
        terminationTab.addEventListener('click', () => {
            currentTcpPhase = 'termination';
            resetTcpCommunication();
        });
    }

    // Initialize Bootstrap tabs for TCP phases
    const tcpPhaseTabs = document.querySelectorAll('#tcpPhaseTabs button');
    if (tcpPhaseTabs.length > 0) {
        tcpPhaseTabs.forEach(tab => {
            tab.addEventListener('shown.bs.tab', function(event) {
                // Update the info panel with appropriate phase information
                const targetId = event.target.getAttribute('data-bs-target').substring(1);
                const communicationInfo = document.getElementById('tcp-communication-info');
                if (communicationInfo) {
                    communicationInfo.innerHTML = '<p>Click "Start TCP Communication" to begin the animation.</p>';
                }
            });
        });
    }

    // UDP Communication Buttons
    const startUdpBtn = document.getElementById('startUdpBtn');
    const simulatePacketLossBtn = document.getElementById('simulatePacketLossBtn');
    const resetUdpBtn = document.getElementById('resetUdpBtn');

    if (startUdpBtn) {
        startUdpBtn.addEventListener('click', () => startUdpCommunication(false));
    }

    if (simulatePacketLossBtn) {
        simulatePacketLossBtn.addEventListener('click', () => startUdpCommunication(true));
    }

    if (resetUdpBtn) {
        resetUdpBtn.addEventListener('click', resetUdpCommunication);
    }

    // HTTP Request-Response Buttons
    const startHttpBtn = document.getElementById('startHttpBtn');
    const resetHttpBtn = document.getElementById('resetHttpBtn');

    if (startHttpBtn) {
        startHttpBtn.addEventListener('click', startHttpCycle);
    }

    if (resetHttpBtn) {
        resetHttpBtn.addEventListener('click', resetHttpCycle);
    }

    // TCP vs UDP Comparison Buttons
    const startComparisonBtn = document.getElementById('startComparisonBtn');
    const resetComparisonBtn = document.getElementById('resetComparisonBtn');

    if (startComparisonBtn) {
        startComparisonBtn.addEventListener('click', startProtocolComparison);
    }

    if (resetComparisonBtn) {
        resetComparisonBtn.addEventListener('click', resetProtocolComparison);
    }
}

// OSI Model - No animations anymore
// This section has been removed as per requirements to focus only on layer information
// and remove animations from the OSI Model tab.

// TCP Communication Animation
let tcpCommunicationInProgress = false;
let currentTcpPhase = 'connection';
let slowAnimation = false;

// This function is defined earlier in the file

function startTcpCommunication() {
    if (tcpCommunicationInProgress) return;

    tcpCommunicationInProgress = true;

    // Reset any previous animation
    resetTcpCommunication();

    // Fetch TCP communication data from the server
    fetch('/osi/tcp_communication')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Display packet structure information
                displayTcpPacketStructure(data.packet_structure);

                // Determine which phase to animate based on the selected tab
                let phaseToAnimate;
                switch (currentTcpPhase) {
                    case 'connection':
                        phaseToAnimate = data.phases[0]; // Connection Establishment
                        break;
                    case 'data-transfer':
                        phaseToAnimate = data.phases[1]; // Data Transfer
                        break;
                    case 'termination':
                        phaseToAnimate = data.phases[2]; // Connection Termination
                        break;
                    default:
                        phaseToAnimate = data.phases[0]; // Default to Connection Establishment
                }

                // Animate the selected phase
                animateTcpPhase(phaseToAnimate);
                displayTcpPhaseInfo(phaseToAnimate);
            } else {
                console.error('Error fetching TCP communication data');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function animateTcpPhase(phase) {
    const packetContainer = document.querySelector('.handshake-animation-area .packet-container');
    const client = document.querySelector('.tcp-handshake-container .client');
    const server = document.querySelector('.tcp-handshake-container .server');

    // Get animation timing based on slow mode setting
    const animationTiming = getAnimationTiming();

    // Create a sequence of animation steps
    let animationSequence = [];

    // Process each step in the phase
    phase.steps.forEach((step, index) => {
        // Add step to the animation sequence
        if (step.from === 'client') {
            // Client to server packet
            animationSequence.push(() => {
                // Highlight client
                client.classList.add('highlight');
                server.classList.remove('highlight');

                // Create packet
                const packet = createTcpPacket(step);
                packet.style.top = '40%';
                packet.style.left = '10%';

                packetContainer.appendChild(packet);

                // Highlight the current step in the sequence table
                highlightSequenceTableRow(index);

                // Animate packet movement
                setTimeout(() => {
                    packet.style.left = '90%';

                    // When packet reaches destination
                    setTimeout(() => {
                        if (index < phase.steps.length - 1) {
                            // Move to next step
                            animationSequence[index + 1]();
                        } else {
                            // Animation complete
                            completePhaseAnimation(phase);
                        }
                    }, animationTiming.packetTravel);
                }, animationTiming.beforeTravel);
            });
        } else {
            // Server to client packet
            animationSequence.push(() => {
                // Highlight server
                server.classList.add('highlight');
                client.classList.remove('highlight');

                // Create packet
                const packet = createTcpPacket(step);
                packet.style.top = '60%';
                packet.style.right = '10%';

                packetContainer.appendChild(packet);

                // Highlight the current step in the sequence table
                highlightSequenceTableRow(index);

                // Animate packet movement
                setTimeout(() => {
                    packet.style.right = '90%';

                    // When packet reaches destination
                    setTimeout(() => {
                        if (index < phase.steps.length - 1) {
                            // Move to next step
                            animationSequence[index + 1]();
                        } else {
                            // Animation complete
                            completePhaseAnimation(phase);
                        }
                    }, animationTiming.packetTravel);
                }, animationTiming.beforeTravel);
            });
        }
    });

    // Start the animation sequence
    if (animationSequence.length > 0) {
        animationSequence[0]();
    }
}

function createTcpPacket(step) {
    const packet = document.createElement('div');

    // Determine packet class based on flags
    let packetClass = 'tcp-packet';
    if (step.flags.includes('SYN') && step.flags.includes('ACK')) {
        packetClass += ' syn-ack';
    } else if (step.flags.includes('SYN')) {
        packetClass += ' syn';
    } else if (step.flags.includes('FIN')) {
        packetClass += ' fin';
    } else if (step.flags.includes('ACK') && step.name === 'DATA') {
        packetClass += ' data';
    } else {
        packetClass += ' ack';
    }

    packet.className = packetClass;
    packet.textContent = step.name;

    // Add data size indicator for data packets
    if (step.data_size) {
        packet.setAttribute('data-size', step.data_size + ' bytes');
    }

    return packet;
}

function getAnimationTiming() {
    // Return different timing values based on slow animation setting
    if (slowAnimation) {
        return {
            beforeTravel: 1500,  // Time before packet starts moving
            packetTravel: 2000,  // Time for packet to travel
            afterComplete: 1500  // Time after phase completes
        };
    } else {
        return {
            beforeTravel: 800,
            packetTravel: 1200,
            afterComplete: 1000
        };
    }
}

function completePhaseAnimation(phase) {
    const client = document.querySelector('.tcp-handshake-container .client');
    const server = document.querySelector('.tcp-handshake-container .server');

    // Reset highlights
    client.classList.remove('highlight');
    server.classList.remove('highlight');

    // Add appropriate completion state based on the phase
    if (phase.name === 'Connection Establishment') {
        client.classList.add('connected');
        server.classList.add('connected');

        // Update status
        document.getElementById('tcp-communication-info').innerHTML += `
            <div class="alert alert-success mt-3">
                <strong>Connection Established!</strong> The TCP three-way handshake is complete.
            </div>
        `;
    } else if (phase.name === 'Connection Termination') {
        client.classList.remove('connected');
        server.classList.remove('connected');

        // Update status
        document.getElementById('tcp-communication-info').innerHTML += `
            <div class="alert alert-info mt-3">
                <strong>Connection Closed!</strong> The TCP four-way termination is complete.
            </div>
        `;
    } else {
        // Data Transfer phase
        document.getElementById('tcp-communication-info').innerHTML += `
            <div class="alert alert-primary mt-3">
                <strong>Data Transfer Complete!</strong> Data has been reliably exchanged between client and server.
            </div>
        `;
    }

    // Reset animation state
    tcpCommunicationInProgress = false;
}

function displayTcpPhaseInfo(phase) {
    const communicationInfo = document.getElementById('tcp-communication-info');
    const sequenceTable = document.getElementById('tcp-sequence-table');

    // Clear previous content
    communicationInfo.innerHTML = `<h5>${phase.name}</h5><p>${phase.description}</p>`;
    sequenceTable.innerHTML = '';

    // Add each step to the sequence table
    phase.steps.forEach((step, index) => {
        // Add step details to the info panel
        communicationInfo.innerHTML += `
            <div class="step-info mt-2" id="tcp-step-${index}">
                <strong>Step ${index + 1}: ${step.name}</strong>
                <p>${step.description}</p>
                <div class="small text-muted">${step.details}</div>
            </div>
        `;

        // Add sequence and acknowledgment numbers to the table
        const flagsText = step.flags.join(', ');
        let dataSize = step.data_size ? `<br><span class="small text-muted">Data: ${step.data_size} bytes</span>` : '';

        sequenceTable.innerHTML += `
            <tr id="seq-row-${index}">
                <td>${step.name}</td>
                <td>${step.seq}${dataSize}</td>
                <td>${step.ack}</td>
                <td>${flagsText}</td>
            </tr>
        `;
    });
}

function highlightSequenceTableRow(index) {
    // Remove highlight from all rows
    const rows = document.querySelectorAll('#tcp-sequence-table tr');
    rows.forEach(row => row.classList.remove('table-primary'));

    // Highlight the current row
    const currentRow = document.getElementById(`seq-row-${index}`);
    if (currentRow) {
        currentRow.classList.add('table-primary');
    }

    // Highlight the current step info
    const stepInfos = document.querySelectorAll('.step-info');
    stepInfos.forEach(info => info.classList.remove('bg-light', 'p-2', 'rounded'));

    const currentStepInfo = document.getElementById(`tcp-step-${index}`);
    if (currentStepInfo) {
        currentStepInfo.classList.add('bg-light', 'p-2', 'rounded');
    }
}

function displayTcpPacketStructure(packetStructure) {
    // This function would update any dynamic elements in the TCP packet structure diagram
    // For now, the structure is static in the HTML, but we could highlight different fields
    // based on the current phase or step

    // Example: Highlight specific fields based on the current phase
    const headerFields = document.querySelectorAll('.header-field');

    // Reset any previous highlights
    headerFields.forEach(field => {
        field.classList.remove('bg-light');
    });

    // Highlight relevant fields based on current phase
    if (currentTcpPhase === 'connection') {
        // Highlight sequence number, flags for connection establishment
        highlightHeaderField('Sequence Number');
        highlightHeaderField('Flags');
    } else if (currentTcpPhase === 'data-transfer') {
        // Highlight data section, sequence and ack numbers for data transfer
        highlightHeaderField('Sequence Number');
        highlightHeaderField('Acknowledgment Number');
        highlightHeaderField('Data');
        highlightHeaderField('Window Size');
    } else if (currentTcpPhase === 'termination') {
        // Highlight flags for connection termination
        highlightHeaderField('Flags');
        highlightHeaderField('Sequence Number');
        highlightHeaderField('Acknowledgment Number');
    }
}

function highlightHeaderField(fieldName) {
    const headerFields = document.querySelectorAll('.header-field');
    headerFields.forEach(field => {
        if (field.textContent.includes(fieldName)) {
            field.classList.add('bg-light');
        }
    });
}

function resetTcpCommunication() {
    // Clear any existing packets
    const packetContainer = document.querySelector('.handshake-animation-area .packet-container');
    if (packetContainer) {
        packetContainer.innerHTML = '';
    }

    // Reset device states
    const client = document.querySelector('.tcp-handshake-container .client');
    const server = document.querySelector('.tcp-handshake-container .server');

    if (client) {
        client.classList.remove('highlight', 'connected');
    }

    if (server) {
        server.classList.remove('highlight', 'connected');
    }

    // Reset info panel
    const communicationInfo = document.getElementById('tcp-communication-info');
    if (communicationInfo) {
        communicationInfo.innerHTML = '<p>Click "Start TCP Communication" to begin the animation.</p>';
    }

    // Reset sequence table
    const sequenceTable = document.getElementById('tcp-sequence-table');
    if (sequenceTable) {
        sequenceTable.innerHTML = '';
    }

    // Reset animation state
    tcpCommunicationInProgress = false;
}

// UDP Communication Animation
let udpCommunicationInProgress = false;

function startUdpCommunication(simulatePacketLoss) {
    if (udpCommunicationInProgress) return;

    udpCommunicationInProgress = true;

    // Reset any previous animation
    resetUdpCommunication();

    // Fetch UDP communication data from the server
    fetch('/osi/udp_communication')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                animateUdpCommunication(data.steps, simulatePacketLoss);
                displayUdpInfo(data.steps, simulatePacketLoss);
            } else {
                console.error('Error fetching UDP communication data');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function animateUdpCommunication(steps, simulatePacketLoss) {
    const udpContainer = document.querySelector('.udp-animation-area .packet-container');
    const client = document.querySelector('.udp-container .client');
    const server = document.querySelector('.udp-container .server');

    // Highlight client for first step
    client.classList.add('highlight');

    // Create and animate UDP datagram from client to server
    setTimeout(() => {
        const udpPacket = document.createElement('div');
        udpPacket.className = 'udp-packet';
        udpPacket.textContent = 'UDP Datagram';
        udpPacket.style.top = '40%';
        udpPacket.style.left = '10%';

        udpContainer.appendChild(udpPacket);

        // Animate UDP packet from client to server
        setTimeout(() => {
            udpPacket.style.left = '90%';

            // If simulating packet loss, make the packet disappear midway
            if (simulatePacketLoss) {
                setTimeout(() => {
                    udpPacket.classList.add('lost');
                    udpPacket.textContent = 'Packet Lost';

                    // Update info panel to show packet loss
                    document.getElementById('udp-info').innerHTML += `
                        <div class="alert alert-danger mt-3">
                            <strong>Packet Lost!</strong> UDP does not guarantee delivery or retransmit lost packets.
                        </div>
                    `;

                    // End animation after packet loss
                    setTimeout(() => {
                        client.classList.remove('highlight');
                        udpCommunicationInProgress = false;
                    }, 1500);
                }, 500);
            } else {
                // When packet reaches server (no packet loss)
                setTimeout(() => {
                    // Remove client highlight and highlight server
                    client.classList.remove('highlight');
                    server.classList.add('highlight');

                    // For demonstration, show optional response from server
                    setTimeout(() => {
                        const responsePacket = document.createElement('div');
                        responsePacket.className = 'udp-packet';
                        responsePacket.textContent = 'UDP Response';
                        responsePacket.style.top = '60%';
                        responsePacket.style.right = '10%';

                        udpContainer.appendChild(responsePacket);

                        // Animate response packet from server to client
                        setTimeout(() => {
                            responsePacket.style.right = '90%';

                            // When response reaches client
                            setTimeout(() => {
                                server.classList.remove('highlight');
                                client.classList.add('highlight');

                                // End animation
                                setTimeout(() => {
                                    client.classList.remove('highlight');
                                    udpCommunicationInProgress = false;

                                    // Update info panel
                                    document.getElementById('udp-info').innerHTML += `
                                        <div class="alert alert-info mt-3">
                                            <strong>Communication Complete!</strong> Note that UDP is connectionless and does not establish or maintain a connection.
                                        </div>
                                    `;
                                }, 1000);
                            }, 1000);
                        }, 500);
                    }, 1000);
                }, 1000);
            }
        }, 500);
    }, 500);
}

function displayUdpInfo(steps, simulatePacketLoss) {
    const udpInfo = document.getElementById('udp-info');

    // Clear previous content
    udpInfo.innerHTML = '<h5>UDP Communication</h5>';

    // Add general UDP information
    udpInfo.innerHTML += `
        <p>UDP (User Datagram Protocol) is a connectionless protocol that:</p>
        <ul>
            <li>Does not establish a connection before sending data</li>
            <li>Does not guarantee packet delivery</li>
            <li>Does not maintain packet order</li>
            <li>Has minimal overhead (faster but less reliable)</li>
        </ul>
    `;

    if (simulatePacketLoss) {
        udpInfo.innerHTML += `
            <div class="alert alert-warning">
                <strong>Simulating Packet Loss</strong> - This demonstrates how UDP handles network problems.
            </div>
        `;
    }

    // Add each step to the info panel
    steps.forEach((step, index) => {
        udpInfo.innerHTML += `
            <div class="step-info mt-2">
                <strong>${step.name}</strong>
                <p>${step.description}</p>
                <small>From: ${step.from} | To: ${step.to} | Data: "${step.data}"</small>
            </div>
        `;
    });
}

function resetUdpCommunication() {
    // Clear any existing packets
    const packetContainer = document.querySelector('.udp-animation-area .packet-container');
    if (packetContainer) {
        packetContainer.innerHTML = '';
    }

    // Reset device states
    const client = document.querySelector('.udp-container .client');
    const server = document.querySelector('.udp-container .server');

    if (client) {
        client.classList.remove('highlight');
    }

    if (server) {
        server.classList.remove('highlight');
    }

    // Reset info panel
    const udpInfo = document.getElementById('udp-info');
    if (udpInfo) {
        udpInfo.innerHTML = '<p>Click "Start UDP Communication" to begin the animation.</p>';
    }

    // Reset animation state
    udpCommunicationInProgress = false;
}

// HTTP Request-Response Cycle Animation
let httpCycleInProgress = false;
let slowHttpAnimation = false;

function startHttpCycle() {
    if (httpCycleInProgress) return;

    httpCycleInProgress = true;

    // Reset any previous animation
    resetHttpCycle();

    // Check if slow animation is enabled
    slowHttpAnimation = document.getElementById('slowHttpAnimationToggle').checked;

    // Fetch HTTP cycle data from the server
    fetch('/osi/http_request_response')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Display HTTP information
                displayHttpInfo(data.steps);

                // Start the animation with a slight delay
                setTimeout(() => {
                    animateHttpCycle(data.steps);
                }, 500);
            } else {
                console.error('Error fetching HTTP cycle data');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function animateHttpCycle(steps) {
    const httpContainer = document.querySelector('.http-animation-area .packet-container');
    const client = document.querySelector('.http-container .client');
    const server = document.querySelector('.http-container .server');

    // Get animation timing based on slow mode setting
    const timing = getHttpAnimationTiming();

    // Define animation sequence
    const animations = [
        // Step 1: DNS Resolution
        () => {
            // Highlight client for DNS resolution
            client.classList.add('highlight');
            updateHttpStepHighlight(0);

            // Create DNS request packet
            const dnsPacket = document.createElement('div');
            dnsPacket.className = 'http-packet';
            dnsPacket.textContent = 'DNS Query';
            dnsPacket.style.top = '30%';
            dnsPacket.style.left = '10%';

            httpContainer.appendChild(dnsPacket);

            // Animate DNS request
            setTimeout(() => {
                dnsPacket.style.left = '90%';

                // DNS response
                setTimeout(() => {
                    const dnsResponse = document.createElement('div');
                    dnsResponse.className = 'http-packet';
                    dnsResponse.textContent = 'DNS Response';
                    dnsResponse.style.top = '40%';
                    dnsResponse.style.right = '10%';

                    httpContainer.appendChild(dnsResponse);

                    setTimeout(() => {
                        dnsResponse.style.right = '90%';

                        // Move to next step after DNS resolution
                        setTimeout(() => {
                            // Clear DNS packets
                            dnsPacket.remove();
                            dnsResponse.remove();

                            // Move to TCP handshake
                            animations[1]();
                        }, timing.betweenSteps);
                    }, timing.packetTravel);
                }, timing.responseDelay);
            }, timing.packetTravel);
        },

        // Step 2: TCP Handshake
        () => {
            updateHttpStepHighlight(1);

            // SYN packet
            const synPacket = document.createElement('div');
            synPacket.className = 'http-packet';
            synPacket.textContent = 'SYN';
            synPacket.style.top = '30%';
            synPacket.style.left = '10%';

            httpContainer.appendChild(synPacket);

            // Animate SYN
            setTimeout(() => {
                synPacket.style.left = '90%';

                // SYN-ACK response
                setTimeout(() => {
                    server.classList.add('highlight');

                    const synAckPacket = document.createElement('div');
                    synAckPacket.className = 'http-packet';
                    synAckPacket.textContent = 'SYN-ACK';
                    synAckPacket.style.top = '40%';
                    synAckPacket.style.right = '10%';

                    httpContainer.appendChild(synAckPacket);

                    setTimeout(() => {
                        synAckPacket.style.right = '90%';

                        // ACK packet
                        setTimeout(() => {
                            const ackPacket = document.createElement('div');
                            ackPacket.className = 'http-packet';
                            ackPacket.textContent = 'ACK';
                            ackPacket.style.top = '50%';
                            ackPacket.style.left = '10%';

                            httpContainer.appendChild(ackPacket);

                            setTimeout(() => {
                                ackPacket.style.left = '90%';

                                // Move to next step after TCP handshake
                                setTimeout(() => {
                                    // Clear TCP handshake packets
                                    synPacket.remove();
                                    synAckPacket.remove();
                                    ackPacket.remove();

                                    // Move to HTTP request
                                    animations[2]();
                                }, timing.betweenSteps);
                            }, timing.packetTravel);
                        }, timing.packetDelay);
                    }, timing.packetTravel);
                }, timing.responseDelay);
            }, timing.packetTravel);
        },

        // Step 3: HTTP Request
        () => {
            updateHttpStepHighlight(2);

            // HTTP GET request
            const httpRequest = document.createElement('div');
            httpRequest.className = 'http-packet';
            httpRequest.textContent = 'HTTP GET';
            httpRequest.style.top = '40%';
            httpRequest.style.left = '10%';

            httpContainer.appendChild(httpRequest);

            // Animate HTTP request
            setTimeout(() => {
                httpRequest.style.left = '90%';

                // Move to next step after HTTP request
                setTimeout(() => {
                    // Move to server processing
                    animations[3]();
                }, timing.betweenSteps);
            }, timing.packetTravel);
        },

        // Step 4: Server Processing
        () => {
            updateHttpStepHighlight(3);

            // Highlight server during processing
            server.classList.add('processing');
            client.classList.remove('highlight');

            // Simulate server processing time
            setTimeout(() => {
                server.classList.remove('processing');

                // Move to HTTP response
                animations[4]();
            }, timing.serverProcessing);
        },

        // Step 5: HTTP Response
        () => {
            updateHttpStepHighlight(4);

            // HTTP response
            const httpResponse = document.createElement('div');
            httpResponse.className = 'http-packet';
            httpResponse.textContent = 'HTTP Response';
            httpResponse.style.top = '60%';
            httpResponse.style.right = '10%';

            httpContainer.appendChild(httpResponse);

            // Animate HTTP response
            setTimeout(() => {
                httpResponse.style.right = '90%';

                // Client receives response
                setTimeout(() => {
                    client.classList.add('highlight');
                    server.classList.remove('highlight');

                    // Move to connection close
                    setTimeout(() => {
                        // Clear HTTP response packet
                        httpResponse.remove();

                        // Move to connection close
                        animations[5]();
                    }, timing.betweenSteps);
                }, timing.responseDelay);
            }, timing.packetTravel);
        },

        // Step 6: Connection Close
        () => {
            updateHttpStepHighlight(5);

            // FIN packet
            const finPacket = document.createElement('div');
            finPacket.className = 'http-packet';
            finPacket.textContent = 'FIN';
            finPacket.style.top = '30%';
            finPacket.style.left = '10%';

            httpContainer.appendChild(finPacket);

            // Animate FIN
            setTimeout(() => {
                finPacket.style.left = '90%';

                // ACK response
                setTimeout(() => {
                    server.classList.add('highlight');

                    const ackPacket = document.createElement('div');
                    ackPacket.className = 'http-packet';
                    ackPacket.textContent = 'ACK';
                    ackPacket.style.top = '40%';
                    ackPacket.style.right = '10%';

                    httpContainer.appendChild(ackPacket);

                    setTimeout(() => {
                        ackPacket.style.right = '90%';

                        // Server FIN
                        setTimeout(() => {
                            const serverFinPacket = document.createElement('div');
                            serverFinPacket.className = 'http-packet';
                            serverFinPacket.textContent = 'FIN';
                            serverFinPacket.style.top = '50%';
                            serverFinPacket.style.right = '10%';

                            httpContainer.appendChild(serverFinPacket);

                            setTimeout(() => {
                                serverFinPacket.style.right = '90%';

                                // Final ACK
                                setTimeout(() => {
                                    const finalAckPacket = document.createElement('div');
                                    finalAckPacket.className = 'http-packet';
                                    finalAckPacket.textContent = 'ACK';
                                    finalAckPacket.style.top = '60%';
                                    finalAckPacket.style.left = '10%';

                                    httpContainer.appendChild(finalAckPacket);

                                    setTimeout(() => {
                                        finalAckPacket.style.left = '90%';

                                        // Complete the cycle
                                        setTimeout(() => {
                                            // Clear connection close packets
                                            finPacket.remove();
                                            ackPacket.remove();
                                            serverFinPacket.remove();
                                            finalAckPacket.remove();

                                            // Reset highlights
                                            client.classList.remove('highlight');
                                            server.classList.remove('highlight');

                                            // Update progress to 100%
                                            const progressBar = document.getElementById('http-progress-bar');
                                            progressBar.style.width = '100%';
                                            progressBar.setAttribute('aria-valuenow', 100);

                                            // Update current step indicator
                                            const currentStepElement = document.getElementById('current-http-step');
                                            const currentStepDescElement = document.getElementById('current-http-step-description');

                                            if (currentStepElement && currentStepDescElement) {
                                                currentStepElement.textContent = 'Complete!';
                                                currentStepDescElement.textContent = 'The HTTP transaction has been successfully completed.';
                                            }

                                            // Mark all steps as completed
                                            const stepItems = document.querySelectorAll('#http-steps-list li');
                                            stepItems.forEach(item => {
                                                item.classList.remove('active');
                                                item.classList.add('completed');
                                            });

                                            // Add completion message
                                            const stepsList = document.getElementById('http-steps-list');
                                            stepsList.insertAdjacentHTML('afterend', `
                                                <div class="alert alert-success mt-3">
                                                    <strong>HTTP Transaction Complete!</strong> The full request-response cycle has finished.
                                                </div>
                                            `);

                                            // Reset animation state
                                            httpCycleInProgress = false;
                                        }, timing.betweenSteps);
                                    }, timing.packetTravel);
                                }, timing.packetDelay);
                            }, timing.packetTravel);
                        }, timing.packetDelay);
                    }, timing.packetTravel);
                }, timing.responseDelay);
            }, timing.packetTravel);
        }
    ];

    // Start the animation sequence
    animations[0]();
}

function getHttpAnimationTiming() {
    // Return different timing values based on slow animation setting
    if (slowHttpAnimation) {
        return {
            packetTravel: 1200,     // Time for packet to travel
            packetDelay: 800,       // Delay before sending next packet
            responseDelay: 1500,    // Delay before server responds
            betweenSteps: 1500,     // Delay between major steps
            serverProcessing: 3000  // Time for server to process request
        };
    } else {
        return {
            packetTravel: 600,      // Time for packet to travel
            packetDelay: 400,       // Delay before sending next packet
            responseDelay: 800,     // Delay before server responds
            betweenSteps: 800,      // Delay between major steps
            serverProcessing: 1500  // Time for server to process request
        };
    }
}

function updateHttpStepHighlight(stepIndex) {
    // Highlight the current step in the steps list
    const steps = document.querySelectorAll('#http-steps-list li');
    const totalSteps = steps.length;

    if (steps && totalSteps > 0) {
        // Update progress bar
        const progressPercentage = ((stepIndex + 1) / totalSteps) * 100;
        const progressBar = document.getElementById('http-progress-bar');
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute('aria-valuenow', progressPercentage);

        // Update current step indicator
        const currentStepElement = document.getElementById('current-http-step');
        const currentStepDescElement = document.getElementById('current-http-step-description');
        const currentStep = steps[stepIndex];

        if (currentStepElement && currentStep) {
            const stepName = currentStep.querySelector('strong').textContent;
            const stepDescription = currentStep.querySelector('p').textContent;

            currentStepElement.textContent = `${stepIndex + 1}. ${stepName}`;
            currentStepDescElement.textContent = stepDescription;

            // Add animation to the step indicator
            const indicator = document.querySelector('.current-step-indicator');
            indicator.classList.add('bg-light');
            setTimeout(() => {
                indicator.classList.remove('bg-light');
            }, 300);
        }

        // Update step list items
        steps.forEach((step, index) => {
            // Remove all classes first
            step.classList.remove('active', 'completed');

            if (index === stepIndex) {
                // Current step
                step.classList.add('active');
            } else if (index < stepIndex) {
                // Completed steps
                step.classList.add('completed');
            }
            // Future steps remain neutral
        });
    }
}

function displayHttpInfo(steps) {
    const stepsList = document.getElementById('http-steps-list');

    // Clear previous content
    stepsList.innerHTML = '';

    // Reset progress bar
    const progressBar = document.getElementById('http-progress-bar');
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', 0);

    // Add each step to the steps list
    steps.forEach((step, index) => {
        stepsList.innerHTML += `
            <li id="http-step-${index}">
                <strong>${step.name}</strong>
                <p>${step.description}</p>
                <div class="step-details small text-muted">${step.details}</div>
            </li>
        `;
    });

    // Reset current step indicator
    const currentStepElement = document.getElementById('current-http-step');
    const currentStepDescElement = document.getElementById('current-http-step-description');

    if (currentStepElement && currentStepDescElement) {
        currentStepElement.textContent = 'Not Started';
        currentStepDescElement.textContent = 'Click "Start HTTP Cycle" to begin the animation.';
    }
}

function resetHttpCycle() {
    // Clear any existing packets
    const packetContainer = document.querySelector('.http-animation-area .packet-container');
    if (packetContainer) {
        packetContainer.innerHTML = '';
    }

    // Reset device states
    const client = document.querySelector('.http-container .client');
    const server = document.querySelector('.http-container .server');

    if (client) {
        client.classList.remove('highlight', 'processing');
    }

    if (server) {
        server.classList.remove('highlight', 'processing');
    }

    // Reset progress bar
    const progressBar = document.getElementById('http-progress-bar');
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.setAttribute('aria-valuenow', 0);
    }

    // Reset current step indicator
    const currentStepElement = document.getElementById('current-http-step');
    const currentStepDescElement = document.getElementById('current-http-step-description');

    if (currentStepElement && currentStepDescElement) {
        currentStepElement.textContent = 'Not Started';
        currentStepDescElement.textContent = 'Click "Start HTTP Cycle" to begin the animation.';
    }

    // Remove any success messages
    const successMessage = document.querySelector('.http-steps .alert');
    if (successMessage) {
        successMessage.remove();
    }

    // Reset animation state
    httpCycleInProgress = false;
}

// TCP vs UDP Comparison Animation
let protocolComparisonInProgress = false;
let slowComparisonAnimation = true;
let tcpSteps = [];
let udpSteps = [];
let tcpPacketStructure = [];
let udpPacketStructure = [];

function startProtocolComparison() {
    if (protocolComparisonInProgress) return;

    protocolComparisonInProgress = true;

    // Reset any previous animation
    resetProtocolComparison();

    // Check if slow animation is enabled
    slowComparisonAnimation = document.getElementById('slowComparisonToggle').checked;

    // Fetch TCP vs UDP comparison data from the server
    fetch('/osi/tcp_vs_udp')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Store steps and packet structure data
                tcpSteps = data.steps.tcp;
                udpSteps = data.steps.udp;
                tcpPacketStructure = data.packet_structures.tcp;
                udpPacketStructure = data.packet_structures.udp;

                // Display protocol comparison information
                displayProtocolComparison(data.comparison);

                // Display steps and packet structures
                displayProtocolSteps();
                displayPacketStructures();

                // Start the animation with a slight delay
                setTimeout(() => {
                    animateProtocolComparison();
                }, 500);
            } else {
                console.error('Error fetching TCP vs UDP comparison data');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function displayProtocolComparison(comparison) {
    const tcpDetails = document.getElementById('tcp-details');
    const udpDetails = document.getElementById('udp-details');

    // Clear previous content
    tcpDetails.innerHTML = '';
    udpDetails.innerHTML = '';

    // Display TCP details
    tcpDetails.innerHTML += `
        <h5>${comparison.tcp.name}</h5>
        <ul class="list-group">
            <li class="list-group-item"><strong>Connection:</strong> ${comparison.tcp.connection}</li>
            <li class="list-group-item"><strong>Reliability:</strong> ${comparison.tcp.reliability}</li>
            <li class="list-group-item"><strong>Ordering:</strong> ${comparison.tcp.ordering}</li>
            <li class="list-group-item"><strong>Error Checking:</strong> ${comparison.tcp.error_checking}</li>
            <li class="list-group-item"><strong>Flow Control:</strong> ${comparison.tcp.flow_control}</li>
            <li class="list-group-item"><strong>Speed:</strong> ${comparison.tcp.speed}</li>
        </ul>

        <div class="mt-3">
            <h6>Common Use Cases:</h6>
            <ul>
                ${comparison.tcp.use_cases.map(useCase => `<li>${useCase}</li>`).join('')}
            </ul>
        </div>
    `;

    // Display UDP details
    udpDetails.innerHTML += `
        <h5>${comparison.udp.name}</h5>
        <ul class="list-group">
            <li class="list-group-item"><strong>Connection:</strong> ${comparison.udp.connection}</li>
            <li class="list-group-item"><strong>Reliability:</strong> ${comparison.udp.reliability}</li>
            <li class="list-group-item"><strong>Ordering:</strong> ${comparison.udp.ordering}</li>
            <li class="list-group-item"><strong>Error Checking:</strong> ${comparison.udp.error_checking}</li>
            <li class="list-group-item"><strong>Flow Control:</strong> ${comparison.udp.flow_control}</li>
            <li class="list-group-item"><strong>Speed:</strong> ${comparison.udp.speed}</li>
        </ul>

        <div class="mt-3">
            <h6>Common Use Cases:</h6>
            <ul>
                ${comparison.udp.use_cases.map(useCase => `<li>${useCase}</li>`).join('')}
            </ul>
        </div>
    `;
}

function animateProtocolComparison() {
    const tcpContainer = document.querySelector('.tcp-packets-container');
    const udpContainer = document.querySelector('.udp-packets-container');
    const tcpSender = document.querySelector('.tcp-animation .sender');
    const tcpReceiver = document.querySelector('.tcp-animation .receiver');
    const udpSender = document.querySelector('.udp-animation .sender');
    const udpReceiver = document.querySelector('.udp-animation .receiver');

    // Get animation timing based on slow mode setting
    const timing = getComparisonAnimationTiming();

    // Clear previous animations
    tcpContainer.innerHTML = '';
    udpContainer.innerHTML = '';

    // Create connection line for TCP
    const tcpConnectionLine = document.createElement('div');
    tcpConnectionLine.className = 'connection-line';
    tcpContainer.appendChild(tcpConnectionLine);

    // Create connection line for UDP
    const udpConnectionLine = document.createElement('div');
    udpConnectionLine.className = 'connection-line';
    udpContainer.appendChild(udpConnectionLine);

    // Simulate sending 5 packets with both protocols
    const numPackets = 5;

    // Start with TCP connection establishment
    updateTcpStepHighlight(0);
    tcpSender.classList.add('highlight');

    // Start with UDP no connection setup
    updateUdpStepHighlight(0);
    udpSender.classList.add('highlight');

    // Start the animation sequence after a delay
    setTimeout(() => {
        // TCP Animation Sequence
        let tcpStepIndex = 1; // Start with first data packet after connection establishment

        // Create and send TCP packets
        for (let i = 0; i < numPackets; i++) {
            setTimeout(() => {
                // Update step for data packet
                updateTcpStepHighlight(tcpStepIndex);

                // Create TCP packet
                const tcpPacket = document.createElement('div');
                tcpPacket.className = 'tcp-packet-animation';
                tcpPacket.textContent = `${i + 1}`;
                tcpPacket.style.top = '40%';
                tcpPacket.style.left = '10%';

                tcpContainer.appendChild(tcpPacket);

                // Animate TCP packet
                setTimeout(() => {
                    tcpPacket.style.left = '90%';

                    // When packet reaches destination, highlight receiver
                    setTimeout(() => {
                        tcpSender.classList.remove('highlight');
                        tcpReceiver.classList.add('highlight');

                        // Update step for acknowledgment
                        tcpStepIndex++;
                        updateTcpStepHighlight(tcpStepIndex);

                        // Create ACK packet
                        const ackPacket = document.createElement('div');
                        ackPacket.className = 'tcp-packet-animation tcp-ack';
                        ackPacket.textContent = 'ACK';
                        ackPacket.style.top = '60%';
                        ackPacket.style.right = '10%';

                        tcpContainer.appendChild(ackPacket);

                        // Animate ACK packet
                        setTimeout(() => {
                            ackPacket.style.right = '90%';

                            // When ACK reaches sender, highlight sender for next packet
                            setTimeout(() => {
                                tcpReceiver.classList.remove('highlight');
                                tcpSender.classList.add('highlight');

                                // Move to next step if not the last packet
                                if (i < numPackets - 1) {
                                    tcpStepIndex++;
                                }
                            }, timing.tcpAckDelay);
                        }, timing.tcpPacketTravel);
                    }, timing.tcpAckDelay);
                }, timing.tcpPacketTravel);
            }, i * timing.tcpPacketInterval);
        }

        // UDP Animation Sequence
        let udpStepIndex = 1; // Start with first data packet after no connection setup

        // Create and send UDP packets (faster but unreliable)
        for (let i = 0; i < numPackets; i++) {
            setTimeout(() => {
                // Update step
                updateUdpStepHighlight(udpStepIndex);

                // Create UDP packet
                const udpPacket = document.createElement('div');
                udpPacket.className = 'udp-packet-animation';
                udpPacket.textContent = `${i + 1}`;
                udpPacket.style.top = '40%';
                udpPacket.style.left = '10%';

                udpContainer.appendChild(udpPacket);

                // Animate UDP packet
                setTimeout(() => {
                    // Simulate packet loss for packet #3
                    if (i === 2) {
                        // Update to packet loss step
                        udpStepIndex++;
                        updateUdpStepHighlight(udpStepIndex);

                        // Packet loss animation
                        setTimeout(() => {
                            udpPacket.style.opacity = '0.3';
                            udpPacket.textContent = 'Lost';
                            udpPacket.style.left = '50%';
                        }, timing.udpPacketTravel / 2);
                    } else {
                        udpPacket.style.left = '90%';

                        // Briefly highlight receiver when packet arrives
                        setTimeout(() => {
                            udpSender.classList.remove('highlight');
                            udpReceiver.classList.add('highlight');

                            // Return highlight to sender for next packet
                            setTimeout(() => {
                                udpReceiver.classList.remove('highlight');
                                udpSender.classList.add('highlight');
                            }, timing.udpPacketTravel / 2);
                        }, timing.udpPacketTravel / 2);
                    }

                    // Move to next step if not the last packet
                    if (i < numPackets - 1) {
                        udpStepIndex++;
                    }
                }, timing.udpPacketTravel);
            }, i * timing.udpPacketInterval);
        }

        // Complete the animation after all packets
        const completionTime = Math.max(
            numPackets * timing.tcpPacketInterval + timing.completionDelay,
            numPackets * timing.udpPacketInterval + timing.completionDelay
        );

        setTimeout(() => {
            // Reset device highlights
            tcpSender.classList.remove('highlight');
            tcpReceiver.classList.remove('highlight');
            udpSender.classList.remove('highlight');
            udpReceiver.classList.remove('highlight');

            // Update progress to 100%
            const tcpProgressBar = document.getElementById('tcp-progress-bar');
            const udpProgressBar = document.getElementById('udp-progress-bar');
            tcpProgressBar.style.width = '100%';
            tcpProgressBar.setAttribute('aria-valuenow', 100);
            udpProgressBar.style.width = '100%';
            udpProgressBar.setAttribute('aria-valuenow', 100);

            // Update current step indicators
            const currentTcpStepElement = document.getElementById('current-tcp-step');
            const currentTcpStepDescElement = document.getElementById('current-tcp-step-description');
            const currentUdpStepElement = document.getElementById('current-udp-step');
            const currentUdpStepDescElement = document.getElementById('current-udp-step-description');

            if (currentTcpStepElement && currentTcpStepDescElement) {
                currentTcpStepElement.textContent = 'Complete!';
                currentTcpStepDescElement.textContent = 'All packets successfully delivered with acknowledgments.';
            }

            if (currentUdpStepElement && currentUdpStepDescElement) {
                currentUdpStepElement.textContent = 'Complete!';
                currentUdpStepDescElement.textContent = 'Transmission completed faster but with packet loss.';
            }

            // Mark all steps as completed
            const tcpStepItems = document.querySelectorAll('#tcp-steps-list li');
            const udpStepItems = document.querySelectorAll('#udp-steps-list li');

            tcpStepItems.forEach(item => {
                item.classList.remove('active');
                item.classList.add('completed');
            });

            udpStepItems.forEach(item => {
                item.classList.remove('active');
                item.classList.add('completed');
            });

            // Add completion messages
            const tcpCompletionMsg = document.createElement('div');
            tcpCompletionMsg.className = 'alert alert-primary mt-2';
            tcpCompletionMsg.innerHTML = '<strong>TCP:</strong> All packets delivered reliably with acknowledgments. Connection-oriented protocol ensures reliability but with higher overhead.';
            document.querySelector('.tcp-animation-container').appendChild(tcpCompletionMsg);

            const udpCompletionMsg = document.createElement('div');
            udpCompletionMsg.className = 'alert alert-warning mt-2';
            udpCompletionMsg.innerHTML = '<strong>UDP:</strong> Faster transmission but packet #3 was lost with no retransmission. Connectionless protocol prioritizes speed over reliability.';
            document.querySelector('.udp-animation-container').appendChild(udpCompletionMsg);

            // Reset animation state
            protocolComparisonInProgress = false;
        }, completionTime);
    }, 500);
}

function displayProtocolSteps() {
    const tcpStepsList = document.getElementById('tcp-steps-list');
    const udpStepsList = document.getElementById('udp-steps-list');

    // Clear previous content
    tcpStepsList.innerHTML = '';
    udpStepsList.innerHTML = '';

    // Reset progress bars
    const tcpProgressBar = document.getElementById('tcp-progress-bar');
    const udpProgressBar = document.getElementById('udp-progress-bar');
    tcpProgressBar.style.width = '0%';
    tcpProgressBar.setAttribute('aria-valuenow', 0);
    udpProgressBar.style.width = '0%';
    udpProgressBar.setAttribute('aria-valuenow', 0);

    // Add TCP steps
    tcpSteps.forEach((step, index) => {
        tcpStepsList.innerHTML += `
            <li id="tcp-step-${index}" class="tcp-step">
                <strong>${step.name}</strong>
                <p>${step.description}</p>
                <div class="step-details small text-muted">${step.details}</div>
            </li>
        `;
    });

    // Add UDP steps
    udpSteps.forEach((step, index) => {
        udpStepsList.innerHTML += `
            <li id="udp-step-${index}" class="udp-step">
                <strong>${step.name}</strong>
                <p>${step.description}</p>
                <div class="step-details small text-muted">${step.details}</div>
            </li>
        `;
    });

    // Reset current step indicators
    const currentTcpStepElement = document.getElementById('current-tcp-step');
    const currentTcpStepDescElement = document.getElementById('current-tcp-step-description');
    const currentUdpStepElement = document.getElementById('current-udp-step');
    const currentUdpStepDescElement = document.getElementById('current-udp-step-description');

    if (currentTcpStepElement && currentTcpStepDescElement) {
        currentTcpStepElement.textContent = 'Not Started';
        currentTcpStepDescElement.textContent = 'Click "Start Comparison" to begin the animation.';
    }

    if (currentUdpStepElement && currentUdpStepDescElement) {
        currentUdpStepElement.textContent = 'Not Started';
        currentUdpStepDescElement.textContent = 'Click "Start Comparison" to begin the animation.';
    }
}

function displayPacketStructures() {
    const tcpStructureContainer = document.querySelector('.tcp-packet-structure .packet-structure-diagram');
    const udpStructureContainer = document.querySelector('.udp-packet-structure .packet-structure-diagram');

    // Clear previous content
    tcpStructureContainer.innerHTML = '';
    udpStructureContainer.innerHTML = '';

    // Add TCP packet structure
    tcpPacketStructure.forEach(field => {
        tcpStructureContainer.innerHTML += `
            <div class="packet-field tcp-field">
                <span class="field-name">${field.name}</span>
                <span class="field-size">${field.size}</span>
            </div>
        `;
    });

    // Add UDP packet structure
    udpPacketStructure.forEach(field => {
        udpStructureContainer.innerHTML += `
            <div class="packet-field udp-field">
                <span class="field-name">${field.name}</span>
                <span class="field-size">${field.size}</span>
            </div>
        `;
    });
}

function updateTcpStepHighlight(stepIndex) {
    // Highlight the current step in the steps list
    const steps = document.querySelectorAll('#tcp-steps-list li');
    const totalSteps = steps.length;

    if (steps && totalSteps > 0) {
        // Update progress bar
        const progressPercentage = ((stepIndex + 1) / totalSteps) * 100;
        const progressBar = document.getElementById('tcp-progress-bar');
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute('aria-valuenow', progressPercentage);

        // Update current step indicator
        const currentStepElement = document.getElementById('current-tcp-step');
        const currentStepDescElement = document.getElementById('current-tcp-step-description');
        const currentStep = steps[stepIndex];

        if (currentStepElement && currentStep) {
            const stepName = currentStep.querySelector('strong').textContent;
            const stepDescription = currentStep.querySelector('p').textContent;

            currentStepElement.textContent = `${stepIndex + 1}. ${stepName}`;
            currentStepDescElement.textContent = stepDescription;

            // Add animation to the step indicator
            const indicator = document.querySelector('.col-md-6:first-child .current-step-indicator');
            indicator.classList.add('bg-light');
            setTimeout(() => {
                indicator.classList.remove('bg-light');
            }, 300);
        }

        // Update step list items
        steps.forEach((step, index) => {
            // Remove all classes first
            step.classList.remove('active', 'completed');

            if (index === stepIndex) {
                // Current step
                step.classList.add('active');
                step.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else if (index < stepIndex) {
                // Completed steps
                step.classList.add('completed');
            }
            // Future steps remain neutral
        });
    }
}

function updateUdpStepHighlight(stepIndex) {
    // Highlight the current step in the steps list
    const steps = document.querySelectorAll('#udp-steps-list li');
    const totalSteps = steps.length;

    if (steps && totalSteps > 0) {
        // Update progress bar
        const progressPercentage = ((stepIndex + 1) / totalSteps) * 100;
        const progressBar = document.getElementById('udp-progress-bar');
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute('aria-valuenow', progressPercentage);

        // Update current step indicator
        const currentStepElement = document.getElementById('current-udp-step');
        const currentStepDescElement = document.getElementById('current-udp-step-description');
        const currentStep = steps[stepIndex];

        if (currentStepElement && currentStep) {
            const stepName = currentStep.querySelector('strong').textContent;
            const stepDescription = currentStep.querySelector('p').textContent;

            currentStepElement.textContent = `${stepIndex + 1}. ${stepName}`;
            currentStepDescElement.textContent = stepDescription;

            // Add animation to the step indicator
            const indicator = document.querySelector('.col-md-6:last-child .current-step-indicator');
            indicator.classList.add('bg-light');
            setTimeout(() => {
                indicator.classList.remove('bg-light');
            }, 300);
        }

        // Update step list items
        steps.forEach((step, index) => {
            // Remove all classes first
            step.classList.remove('active', 'completed');

            if (index === stepIndex) {
                // Current step
                step.classList.add('active');
                step.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else if (index < stepIndex) {
                // Completed steps
                step.classList.add('completed');
            }
            // Future steps remain neutral
        });
    }
}

function getComparisonAnimationTiming() {
    // Return different timing values based on slow animation setting
    if (slowComparisonAnimation) {
        return {
            tcpPacketTravel: 1500,      // Time for TCP packet to travel
            tcpAckDelay: 800,          // Delay before sending TCP ACK
            tcpPacketInterval: 3000,   // Interval between TCP packets
            udpPacketTravel: 800,      // Time for UDP packet to travel
            udpPacketInterval: 1500,   // Interval between UDP packets
            completionDelay: 2000      // Delay before showing completion message
        };
    } else {
        return {
            tcpPacketTravel: 600,       // Time for TCP packet to travel
            tcpAckDelay: 400,          // Delay before sending TCP ACK
            tcpPacketInterval: 1500,   // Interval between TCP packets
            udpPacketTravel: 400,      // Time for UDP packet to travel
            udpPacketInterval: 800,    // Interval between UDP packets
            completionDelay: 1000      // Delay before showing completion message
        };
    }
}

function resetProtocolComparison() {
    // Clear any existing packets and messages
    const tcpContainer = document.querySelector('.tcp-packets-container');
    const udpContainer = document.querySelector('.udp-packets-container');

    if (tcpContainer) {
        tcpContainer.innerHTML = '';
    }

    if (udpContainer) {
        udpContainer.innerHTML = '';
    }

    // Remove any completion messages
    const tcpCompletionMsg = document.querySelector('.tcp-animation-container .alert');
    const udpCompletionMsg = document.querySelector('.udp-animation-container .alert');

    if (tcpCompletionMsg) {
        tcpCompletionMsg.remove();
    }

    if (udpCompletionMsg) {
        udpCompletionMsg.remove();
    }

    // Reset progress bars
    const tcpProgressBar = document.getElementById('tcp-progress-bar');
    const udpProgressBar = document.getElementById('udp-progress-bar');

    if (tcpProgressBar) {
        tcpProgressBar.style.width = '0%';
        tcpProgressBar.setAttribute('aria-valuenow', 0);
    }

    if (udpProgressBar) {
        udpProgressBar.style.width = '0%';
        udpProgressBar.setAttribute('aria-valuenow', 0);
    }

    // Reset current step indicators
    const currentTcpStepElement = document.getElementById('current-tcp-step');
    const currentTcpStepDescElement = document.getElementById('current-tcp-step-description');
    const currentUdpStepElement = document.getElementById('current-udp-step');
    const currentUdpStepDescElement = document.getElementById('current-udp-step-description');

    if (currentTcpStepElement && currentTcpStepDescElement) {
        currentTcpStepElement.textContent = 'Not Started';
        currentTcpStepDescElement.textContent = 'Click "Start Comparison" to begin the animation.';
    }

    if (currentUdpStepElement && currentUdpStepDescElement) {
        currentUdpStepElement.textContent = 'Not Started';
        currentUdpStepDescElement.textContent = 'Click "Start Comparison" to begin the animation.';
    }

    // Reset step highlights
    const tcpSteps = document.querySelectorAll('#tcp-steps-list li');
    const udpSteps = document.querySelectorAll('#udp-steps-list li');

    tcpSteps.forEach(step => {
        step.classList.remove('active', 'completed');
    });

    udpSteps.forEach(step => {
        step.classList.remove('active', 'completed');
    });

    // Reset animation state
    protocolComparisonInProgress = false;
}