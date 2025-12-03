// Helper functions for ARP packet visualization
function getRequesterMacPlaceholder() {
    // Instead of generating a random MAC, use a descriptive placeholder
    return 'requester-mac';
}

function getRequesterIpPlaceholder() {
    // Instead of using a specific IP, use a descriptive placeholder
    return 'requester-ip';
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tabs
    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            if (event.target.id === 'cache-tab') {
                refreshArpCache();
            }
        });
    });

    // ARP Request-Response Simulation
    const sendArpRequestBtn = document.getElementById('sendArpRequest');
    if (sendArpRequestBtn) {
        sendArpRequestBtn.addEventListener('click', sendArpRequest);
    }

    // Automatically refresh the ARP cache when the page loads
    refreshArpCache();

    // ARP Cache Table
    const refreshArpCacheBtn = document.getElementById('refreshArpCache');
    if (refreshArpCacheBtn) {
        refreshArpCacheBtn.addEventListener('click', refreshArpCache);
    }

    const addArpEntryBtn = document.getElementById('addArpEntry');
    if (addArpEntryBtn) {
        addArpEntryBtn.addEventListener('click', () => {
            // Clear form
            document.getElementById('entryIp').value = '';
            document.getElementById('entryMac').value = '';
            document.getElementById('entryType').value = 'dynamic';

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('arpEntryModal'));
            modal.show();
        });
    }

    const saveArpEntryBtn = document.getElementById('saveArpEntry');
    if (saveArpEntryBtn) {
        saveArpEntryBtn.addEventListener('click', saveArpEntry);
    }



    // MAC Spoofing Demonstration Animation
    const startAnimationBtn = document.getElementById('startAnimation');
    const resetAnimationBtn = document.getElementById('resetAnimation');

    if (startAnimationBtn) {
        startAnimationBtn.addEventListener('click', startMacSpoofingAnimation);
    }

    if (resetAnimationBtn) {
        resetAnimationBtn.addEventListener('click', resetMacSpoofingAnimation);
    }
});

// ARP Request-Response Simulation Functions
function sendArpRequest() {
    const ipAddress = document.getElementById('ipAddress').value;
    if (!ipAddress) {
        alert('Please enter an IP address');
        return;
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (!ipRegex.test(ipAddress)) {
        alert('Please enter a valid IP address (e.g., 192.168.1.1)');
        return;
    }

    // Disable the Send ARP Request button
    const sendArpRequestBtn = document.getElementById('sendArpRequest');
    if (sendArpRequestBtn) {
        sendArpRequestBtn.disabled = true;
    }

    // Add the Try New Query button if it doesn't exist
    if (!document.getElementById('tryNewQueryBtn')) {
        const queryBtnContainer = document.getElementById('queryBtnContainer');
        const tryNewQueryBtn = document.createElement('button');
        tryNewQueryBtn.id = 'tryNewQueryBtn';
        tryNewQueryBtn.className = 'btn btn-success mt-2 ms-2';
        tryNewQueryBtn.textContent = 'Try New Query';
        tryNewQueryBtn.addEventListener('click', function() {
            // Reload the page to start fresh
            window.location.reload();
        });
        queryBtnContainer.appendChild(tryNewQueryBtn);
    }

    // Update UI to show request in progress
    document.getElementById('arpResult').innerHTML = '<p>Sending ARP request...</p>';
    document.getElementById('targetIp').textContent = ipAddress;

    // Use placeholder values for requester information
    const requesterMac = getRequesterMacPlaceholder();
    const requesterIp = getRequesterIpPlaceholder();

    // Prepare ARP request packet content
    const requestContent = `Source IP: ${requesterIp}
Source MAC: ${requesterMac}
Target IP: ${ipAddress}
Target MAC: ??:??:??:??:??:?? (unknown)

This request is encapsulated in an Ethernet frame with:
Destination MAC: FF:FF:FF:FF:FF:FF (broadcast to all)
EtherType: 0x0806 (ARP)`;

    // Update and show the ARP request card
    document.getElementById('arpRequestContent').textContent = requestContent;
    document.getElementById('arpRequestCard').style.display = 'block';
    document.getElementById('arpReplyCard').style.display = 'none';

    // Always restore the animation container to ensure it's in the correct state
    // This fixes the issue where subsequent queries get stuck after a cache retrieval
    const animationContainer = document.getElementById('animationContainer');

    // Restore the original animation container content
    animationContainer.innerHTML = `
        <div class="device" id="sourceDevice">
            <div class="device-icon">💻</div>
            <div class="device-label">Your Computer</div>
        </div>
        <div class="network-line">
            <div id="arpPacket" class="packet">ARP</div>
        </div>
        <div class="device" id="targetDevice">
            <div class="device-icon">🖥️</div>
            <div class="device-label">Target Device</div>
            <div class="device-ip" id="targetIp">${ipAddress}</div>
        </div>
    `;

    // Get a fresh reference to the packet element after restoring the container
    const packet = document.getElementById('arpPacket');
    packet.textContent = 'ARP Request';
    packet.style.opacity = '1';
    packet.style.animation = 'moveRight 2s forwards';

    // Send request to server
    fetch('/arp/arp_request', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip: ipAddress }),
    })
    .then(response => response.json())
    .then(data => {
        // Check if the data was retrieved from cache
        if (data.from_cache) {
            // If from cache, don't animate packets, just show the result immediately
            // Reset the request packet animation if it exists
            const packetElement = document.getElementById('arpPacket');
            if (packetElement) {
                packetElement.style.opacity = '0';
                packetElement.style.animation = '';
            }

            // Hide both packet content cards since no packets are exchanged
            document.getElementById('arpRequestCard').style.display = 'none';
            document.getElementById('arpReplyCard').style.display = 'none';

            // Create a message in the animation container
            const animationContainer = document.getElementById('animationContainer');
            const cacheMessage = document.createElement('div');
            cacheMessage.className = 'cache-message';
            cacheMessage.innerHTML = '<div class="alert alert-info text-center">Retrieved from cache table<br>No packet flow needed</div>';

            // Clear the animation container and add the message
            animationContainer.innerHTML = '';
            animationContainer.appendChild(cacheMessage);

            // Update the result immediately
            document.getElementById('arpResult').innerHTML = `
                <div class="alert alert-success">
                    <strong>Success!</strong> ${data.message}
                </div>
                <div class="mt-2">
                    <strong>IP Address:</strong> ${ipAddress}<br>
                    <strong>MAC Address:</strong> ${data.mac_address || 'Not resolved'}<br>
                    <strong>Resolution Method:</strong> ${data.from_cache ? 'Retrieved from cache' : (data.resolved ? 'Resolved through ARP' : 'Not resolved')}
                </div>
            `;

            // Don't refresh the cache table since we're just reading from it
            return;
        }

        // For non-cache retrievals, continue with normal animation
        // After 2 seconds (when request animation completes), show response
        setTimeout(() => {
            // Prepare ARP reply packet content if MAC was resolved
            if (data.success && data.resolved) {
                const requesterMac = getRequesterMacPlaceholder();
                const requesterIp = getRequesterIpPlaceholder();

                const replyContent = `Source IP: ${ipAddress}
Source MAC: ${data.mac_address}
Target IP: ${requesterIp}
Target MAC: ${requesterMac}

This reply is encapsulated in an Ethernet frame with:
Destination MAC: ${requesterMac}
EtherType: 0x0806 (ARP)`;

                // Update and show the ARP reply card
                document.getElementById('arpReplyContent').textContent = replyContent;
                document.getElementById('arpReplyCard').style.display = 'block';
            }

            // Animate ARP response packet
            // Get a fresh reference to the packet element
            const packetElement = document.getElementById('arpPacket');
            if (packetElement) {
                packetElement.textContent = 'ARP Reply';
                packetElement.style.animation = 'moveLeft 2s forwards';
            }

            // After response animation completes, update result
            setTimeout(() => {
                if (data.success) {
                    document.getElementById('arpResult').innerHTML = `
                        <div class="alert ${data.resolved ? 'alert-success' : 'alert-warning'}">
                            <strong>${data.resolved ? 'Success!' : 'Warning!'}</strong> ${data.message}
                        </div>
                        <div class="mt-2">
                            <strong>IP Address:</strong> ${ipAddress}<br>
                            <strong>MAC Address:</strong> ${data.mac_address || 'Not resolved'}<br>
                            <strong>Resolution Method:</strong> ${data.from_cache ? 'Retrieved from cache' : (data.resolved ? 'Resolved through ARP' : 'Not resolved')}
                        </div>
                        ${data.resolved && !data.from_cache ? '<div class="alert alert-info mt-2">Note: This MAC might correspond to your router. It only corresponds to the actual IP if you are on the same LAN.</div>' : ''}
                    `;
                } else {
                    document.getElementById('arpResult').innerHTML = `
                        <div class="alert alert-danger">
                            <strong>Error!</strong> ${data.message}
                        </div>
                    `;
                }

                // Automatically refresh the ARP cache table if it exists and we're not retrieving from cache
                if (document.getElementById('arpCacheTable') && !data.from_cache) {
                    refreshArpCache();
                }

                // Reset animation
                const packetElement = document.getElementById('arpPacket');
                if (packetElement) {
                    packetElement.style.opacity = '0';
                    packetElement.style.animation = '';
                }

                // Keep the packet content cards visible for reference
            }, 2000);
        }, 2000);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('arpResult').innerHTML = `
            <div class="alert alert-danger">
                <strong>Error!</strong> Failed to send ARP request.
            </div>
        `;

        // Reset animation
        packet.style.opacity = '0';
        packet.style.animation = '';
    });
}

// ARP Cache Table Functions
function refreshArpCache() {
    fetch('/arp/get_arp_cache')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('arpCacheTable');
            if (!tableBody) {
                console.error('ARP cache table not found in the DOM');
                return;
            }

            tableBody.innerHTML = '';

            if (!Array.isArray(data)) {
                console.error('Invalid data format received from server:', data);
                return;
            }

            data.forEach(entry => {
                const row = document.createElement('tr');

                // Add class for poisoned entries (for demonstration)
                if (entry.mac && entry.mac.toLowerCase() === 'ee:ff:00:11:22:33') {
                    row.classList.add('poisoned-entry');
                }

                // Safely handle potentially undefined values
                const ip = entry.ip || 'Unknown';
                const mac = entry.mac || 'Not resolved';
                const interface = entry.interface || 'eth0';
                const type = entry.type || 'dynamic';
                const resolved = entry.resolved === true;
                const timestamp = entry.timestamp || new Date().toLocaleString();

                row.innerHTML = `
                    <td>${ip}</td>
                    <td>${mac}</td>
                    <td>${interface}</td>
                    <td>${type}</td>
                    <td>${resolved ? '<span class="badge bg-success">ARP Resolved</span>' : '<span class="badge bg-warning">Not resolved</span>'}</td>
                    <td>${timestamp}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-entry" data-ip="${ip}" data-mac="${mac || ''}" data-type="${type}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-entry" data-ip="${ip}">Delete</button>
                    </td>
                `;

                tableBody.appendChild(row);
            });

            // Add event listeners to edit and delete buttons
            document.querySelectorAll('.edit-entry').forEach(button => {
                button.addEventListener('click', function() {
                    const ip = this.getAttribute('data-ip');
                    const mac = this.getAttribute('data-mac');
                    const type = this.getAttribute('data-type');

                    document.getElementById('entryIp').value = ip;
                    document.getElementById('entryMac').value = mac;
                    document.getElementById('entryType').value = type;

                    const modal = new bootstrap.Modal(document.getElementById('arpEntryModal'));
                    modal.show();
                });
            });

            document.querySelectorAll('.delete-entry').forEach(button => {
                button.addEventListener('click', function() {
                    const ip = this.getAttribute('data-ip');
                    if (confirm(`Are you sure you want to delete the ARP entry for ${ip}?`)) {
                        deleteArpEntry(ip);
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error refreshing ARP cache:', error);
            // Don't show alert to avoid annoying the user, just log to console
            const tableBody = document.getElementById('arpCacheTable');
            if (tableBody) {
                // Show error message in the table instead of an alert
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-danger">
                            <i class="bi bi-exclamation-triangle"></i>
                            Failed to load ARP cache data. Please try again.
                        </td>
                    </tr>
                `;
            }
        });
}

function saveArpEntry() {
    const ip = document.getElementById('entryIp').value;
    const mac = document.getElementById('entryMac').value;
    const type = document.getElementById('entryType').value;

    if (!ip || !mac) {
        alert('Please enter both IP and MAC address');
        return;
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (!ipRegex.test(ip)) {
        alert('Please enter a valid IP address (e.g., 192.168.1.1)');
        return;
    }

    // Validate MAC address format
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(mac)) {
        alert('Please enter a valid MAC address (e.g., 00:1A:2B:3C:4D:5E)');
        return;
    }

    fetch('/arp/update_arp_entry', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip, mac, type }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close modal
            const modalElement = document.getElementById('arpEntryModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();

            // Refresh ARP cache table
            refreshArpCache();
        } else {
            alert(`Error: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to save ARP entry');
    });
}

function deleteArpEntry(ip) {
    fetch('/arp/delete_arp_entry', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            refreshArpCache();
        } else {
            alert(`Error: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to delete ARP entry');
    });
}

// MAC Spoofing Animation Functions
function startMacSpoofingAnimation() {
    // Disable start button and enable reset button
    document.getElementById('startAnimation').disabled = true;
    document.getElementById('resetAnimation').disabled = false;

    // Animation sequence
    setTimeout(() => animateInitialArpRequest(), 500);
}

function resetMacSpoofingAnimation() {
    // Enable start button and disable reset button
    document.getElementById('startAnimation').disabled = false;
    document.getElementById('resetAnimation').disabled = true;

    // Reset all animations
    resetAllAnimations();
}

function resetAllAnimations() {
    // Reset each section's animation
    resetInitialAnimation();
    resetNormalAnimation();
    resetAttackAnimation();

    // Make sure buttons are in correct state
    document.getElementById('startAnimation').disabled = false;
    document.getElementById('resetAnimation').disabled = true;

    // Don't reset attacker visibility once it has appeared
    const attacker = document.getElementById('attacker');
    if (attacker) {
        attacker.style.animation = '';
    }

    // Reset communication blocker
    const blocker = document.getElementById('communicationBlocker');
    if (blocker) {
        blocker.style.opacity = '0';
    }

    // Explicitly reset all ARP table entries
    document.getElementById('normalVictimArpEntry').textContent = '';
    document.getElementById('normalGatewayArpEntry').textContent = '';
    document.getElementById('attackVictimArpEntry').textContent = '';
    document.getElementById('attackGatewayArpEntry').textContent = '';
}

// Initial Network State - No Animation
function animateInitialArpRequest() {
    // Reset any previous animation state
    resetInitialAnimation();

    // Just proceed to normal communication animation after a short delay
    setTimeout(() => {
        animateNormalCommunication();
    }, 1000);
}

// Reset the initial animation state
function resetInitialAnimation() {
    // Reset all packet animations
    const packets = [
        'initialArpRequest',
        'initialArpReply'
    ];

    packets.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.opacity = '0';
            element.style.animation = '';
        }
    });

    // Reset all device highlights
    const devices = [
        'initialVictim',
        'initialGateway'
    ];

    devices.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('highlight');
        }
    });
}

// Normal Communication Animation
function animateNormalCommunication() {
    // Reset any previous animation state
    resetNormalAnimation();

    // Highlight victim device
    document.getElementById('normalVictim').classList.add('highlight');

    // Show ARP request packet
    const requestPacket = document.getElementById('normalArpRequest');
    requestPacket.style.opacity = '1';
    requestPacket.style.left = '0%';
    requestPacket.style.animation = 'moveRight 2s forwards';

    // After request reaches gateway
    setTimeout(() => {
        // Remove request packet when it reaches gateway
        requestPacket.style.opacity = '0';
        requestPacket.style.animation = '';
        const gatewayArpEntry = document.getElementById('normalGatewayArpEntry');
        gatewayArpEntry.textContent = '192.168.1.5 → AA:BB:CC:11:22:33';
        gatewayArpEntry.style.animation = 'blink 1s 2';

        // Highlight gateway device
        document.getElementById('normalGateway').classList.add('highlight');
        document.getElementById('normalVictim').classList.remove('highlight');

        // Show ARP reply packet
        const replyPacket = document.getElementById('normalArpReply');
        replyPacket.style.opacity = '1';
        replyPacket.style.left = '100%';
        replyPacket.style.animation = 'moveLeft 2s forwards';

        // After reply reaches victim
        setTimeout(() => {
            // Remove reply packet when it reaches victim
            replyPacket.style.opacity = '0';
            replyPacket.style.animation = '';

            // Show ARP tables being updated
            const victimArpEntry = document.getElementById('normalVictimArpEntry');


            // Add entries to the ARP tables
            victimArpEntry.textContent = '192.168.1.1 → 00:1A:2B:3C:4D:5E';


            // Highlight the new entries
            victimArpEntry.style.animation = 'blink 1s 2';


            document.getElementById('normalVictim').classList.add('highlight');
            document.getElementById('normalGateway').classList.remove('highlight');

            // Show data packet
            setTimeout(() => {
                // Stop the blinking effect
                victimArpEntry.style.animation = '';
                gatewayArpEntry.style.animation = '';

                const dataPacket = document.getElementById('normalDataPacket');
                dataPacket.style.opacity = '1';
                dataPacket.style.left = '0%';
                dataPacket.style.animation = 'moveRight 2s forwards';

                // After data packet reaches gateway
                setTimeout(() => {
                    // Remove data packet when it reaches gateway
                    dataPacket.style.opacity = '0';
                    dataPacket.style.animation = '';

                    document.getElementById('normalVictim').classList.remove('highlight');
                    document.getElementById('normalGateway').classList.add('highlight');

                    // Move to attack animation
                    setTimeout(() => {
                        document.getElementById('normalGateway').classList.remove('highlight');
                        animateAttack();
                    }, 1000);
                }, 2000);
            }, 1500);
        }, 2000);
    }, 2000);
}

// Reset the normal communication animation state
function resetNormalAnimation() {
    // Reset all packet animations
    const packets = [
        'normalArpRequest',
        'normalArpReply',
        'normalDataPacket'
    ];

    packets.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.opacity = '0';
            element.style.animation = '';
        }
    });

    // Reset all device highlights
    const devices = [
        'normalVictim',
        'normalGateway'
    ];

    devices.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('highlight');
        }
    });

    // Reset ARP table entries
    const arpEntries = [
        'normalVictimArpEntry',
        'normalGatewayArpEntry'
    ];

    arpEntries.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.animation = '';
        }
    });
}

// Attack Animation
function animateAttack() {
    // Reset any previous animation state
    resetAttackAnimation();

    // Step 1: Victim initiates an ARP request
    document.getElementById('attackVictim').classList.add('highlight');
    // Show the X at the intersection
    document.getElementById('communicationBlocker').style.opacity = '1';
    // Make the attacker appear with a fade-in effect and stay visible
    const attacker = document.getElementById('attacker');
    attacker.style.opacity = '1';

    // Show the vertical connection line
    document.getElementById('intersectionToAttackerLine').style.backgroundColor = '#dc3545';
    document.getElementById('intersectionToAttackerLine').style.border = '2px dashed #dc3545';

    // Show the ARP request packet moving from victim toward intersection
    const arpRequest = document.getElementById('attackArpRequest');
    arpRequest.style.opacity = '1';
    arpRequest.style.left = '140px';
    arpRequest.style.top = '60px';
    arpRequest.style.animation = 'moveRightHalf 2s forwards';


    // Step 2: ARP request reaches intersection and is intercepted
    setTimeout(() => {





        // Show vertical connection line from intersection to attacker
        setTimeout(() => {


            // Show the diverted ARP request moving down to attacker
            const divertedRequest = document.getElementById('divertedArpRequest');
            divertedRequest.style.opacity = '1';
            divertedRequest.style.left = '50%';
            divertedRequest.style.animation = 'moveDown 1.5s forwards';

            // Remove the original ARP request
            arpRequest.style.opacity = '0';
            arpRequest.style.display = 'none';

            // After diverted request reaches attacker
            setTimeout(() => {
                // Remove diverted request when it reaches attacker
                divertedRequest.style.opacity = '0';
                divertedRequest.style.display = 'none';

                // Highlight attacker
                document.getElementById('attackVictim').classList.remove('highlight');
                attacker.classList.add('highlight');

                // Step 3: Attacker sends his own ARP request to the gateway
                setTimeout(() => {
                    // Show attacker's request moving up to intersection
                    const attackerRequest = document.getElementById('attackerArpRequest');
                    attackerRequest.style.opacity = '1';
                    attackerRequest.style.left = '50%';
                    attackerRequest.style.animation = 'moveVerticalUp 1.5s forwards';

                    // After attacker's request reaches intersection
                    setTimeout(() => {
                        // Move attacker's request from intersection to gateway
                        attackerRequest.style.top = '60px';
                        attackerRequest.style.animation = 'moveRightHalf2 2s forwards';

                        // After attacker's request reaches gateway
                        setTimeout(() => {
                            // Remove attacker's request when it reaches gateway
                            attackerRequest.style.opacity = '0';
                            attackerRequest.style.display = 'none';
                            // Add poisoned entry to gateway's ARP table
                            const gatewayArpEntry = document.getElementById('attackGatewayArpEntry');
                            gatewayArpEntry.textContent = '192.168.1.5 → EE:FF:00:11:22:33';

                            // Highlight gateway responding
                            document.getElementById('attackGateway').classList.add('highlight');
                            document.getElementById('attacker').classList.remove('highlight');

                            // Gateway sends ARP reply to attacker (via intersection)
                            const gatewayReply = document.getElementById('gatewayArpReply');
                            gatewayReply.style.opacity = '1';
                            gatewayReply.style.top = '60px';
                            gatewayReply.style.animation = 'moveLeftHalf 2s forwards';

                            // After gateway reply reaches intersection
                            setTimeout(() => {
                                gatewayReply.style.opacity = '0';
                                gatewayReply.style.display = 'none';

                                const divertedgatewayReply = document.getElementById('divertedgatewayArpReply');
                                divertedgatewayReply.style.opacity = '1';
                                divertedgatewayReply.style.left = '50%';
                                // Move gateway reply down to attacker
                                divertedgatewayReply.style.animation = 'moveDown 1.5s forwards';

                                // After gateway reply reaches attacker
                                setTimeout(() => {
                                    // Remove gateway reply when it reaches attacker
                                    divertedgatewayReply.style.opacity = '0';
                                    divertedgatewayReply.style.display = 'none';

                                    // Highlight attacker again
                                    document.getElementById('attackGateway').classList.remove('highlight');
                                    document.getElementById('attacker').classList.add('highlight');



                                    // Step 4: Attacker sends spoofed ARP reply to victim
                                    setTimeout(() => {
                                        // Show spoofed reply moving up to intersection
                                        const spoofedReply = document.getElementById('spoofedArpReply');
                                        spoofedReply.style.opacity = '1';
                                        spoofedReply.style.left = '50%';
                                        spoofedReply.style.animation = 'moveVerticalUp 1.5s forwards';

                                        // After spoofed reply reaches intersection
                                        setTimeout(() => {
                                            // Move spoofed reply from intersection to victim
                                            spoofedReply.style.top = '60px';
                                            spoofedReply.style.animation = 'moveLeftHalf2 2s forwards';


                                            // After spoofed reply reaches victim
                                            setTimeout(() => {
                                                // Remove spoofed reply when it reaches victim
                                                spoofedReply.style.opacity = '0';
                                                spoofedReply.style.display = 'none';

                                                // Show ARP tables being updated (blink effect)
                                                const victimArpEntry = document.getElementById('attackVictimArpEntry');

                                                // Add poisoned entry to victim's ARP table
                                                victimArpEntry.textContent = '192.168.1.1 → EE:FF:00:11:22:33';

                                                // Highlight victim receiving the spoofed reply
                                                document.getElementById('attackVictim').classList.add('highlight');
                                                document.getElementById('attacker').classList.remove('highlight');



                                                // After ARP tables are poisoned
                                                setTimeout(() => {
                                                    // Stop the blinking effect
                                                    victimArpEntry.style.animation = '';

                                                    // Step 5: Victim sends data to what it thinks is the gateway
                                                    const victimData = document.getElementById('victimDataPacket');
                                                    victimData.style.opacity = '1';
                                                    victimData.style.left = '140px';
                                                    victimData.style.top = '60px';
                                                    victimData.style.animation = 'moveRightHalf 2s forwards';

                                                    // After data packet reaches intersection
                                                    setTimeout(() => {

                                                        // Show diverted data packet moving down to attacker
                                                        const divertedData = document.getElementById('divertedDataPacket');
                                                        divertedData.style.opacity = '1';
                                                        divertedData.style.left = '50%';
                                                        divertedData.style.animation = 'moveDown 1.5s forwards';

                                                        // Remove the original data packet
                                                        victimData.style.opacity = '0';
                                                        victimData.style.display = 'none';

                                                        // After diverted data reaches attacker
                                                        setTimeout(() => {
                                                            // Remove diverted data when it reaches attacker
                                                            divertedData.style.opacity = '0';
                                                            divertedData.style.display = 'none';

                                                            // Highlight attacker intercepting the data
                                                            document.getElementById('attackVictim').classList.remove('highlight');
                                                            document.getElementById('attacker').classList.add('highlight');
                                                            attacker.style.animation = 'blink 1s 2';

                                                            // Step 6: Attacker modifies data and forwards to gateway
                                                            setTimeout(() => {
                                                                // Show modified data moving up to intersection
                                                                const modifiedData = document.getElementById('modifiedDataPacket');
                                                                modifiedData.style.opacity = '1';
                                                                modifiedData.style.left = '50%';
                                                                modifiedData.style.animation = 'moveVerticalUp 1.5s forwards';

                                                                // After modified data reaches intersection
                                                                setTimeout(() => {
                                                                    // Move modified data from intersection to gateway
                                                                    modifiedData.style.top = '60px';
                                                                    modifiedData.style.left = '50%';
                                                                    modifiedData.style.animation = 'moveRightHalf2 2s forwards';

                                                                    // After modified data reaches gateway
                                                                    setTimeout(() => {
                                                                        // Remove modified data when it reaches gateway
                                                                        modifiedData.style.opacity = '0';
                                                                        modifiedData.style.display = 'none';

                                                                        // Highlight gateway receiving the modified data
                                                                        document.getElementById('attackGateway').classList.add('highlight');
                                                                        document.getElementById('attacker').classList.remove('highlight');

                                                                        // End of animation
                                                                        setTimeout(() => {
                                                                            document.getElementById('attackGateway').classList.remove('highlight');
                                                                            document.getElementById('resetAnimation').disabled = false;
                                                                        }, 1000);
                                                                    }, 2000);
                                                                }, 1500);
                                                            }, 1500);
                                                        }, 1500);
                                                    }, 2000);
                                                }, 1000);
                                            }, 2000);
                                        }, 1500);
                                    }, 1000);
                                }, 1500);
                            }, 2000);
                        }, 2000);
                    }, 1500);
                }, 1000);
            }, 1500);
        }, 1000);
    }, 2000);
}

// Reset the attack animation state
function resetAttackAnimation() {
    // Reset all packet animations
    const packets = [
        'attackArpRequest',
        'divertedArpRequest',
        'attackerArpRequest',
        'gatewayArpReply',
        'spoofedArpReply',
        'victimDataPacket',
        'divertedDataPacket',
        'modifiedDataPacket',
        'divertedgatewayArpReply'
    ];

    packets.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.opacity = '0';
            element.style.animation = '';
            element.style.left = '';
            element.style.top = '';
            element.style.display = '';
        }
    });

    // Reset all device highlights
    const devices = [
        'attackVictim',
        'attackGateway',
        'attacker'
    ];

    devices.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('highlight');
            element.style.animation = '';
        }
    });

    // Reset connection lines
    document.getElementById('intersectionToAttackerLine').style.backgroundColor = 'transparent';
    document.getElementById('intersectionToAttackerLine').style.border = 'none';

    // Don't reset the attacker's visibility once it has appeared
    const attacker = document.getElementById('attacker');
    attacker.style.animation = '';

    // Reset the communication blocker
    document.getElementById('communicationBlocker').style.opacity = '0';

    // Reset ARP table entries
    const victimArpEntry = document.getElementById('attackVictimArpEntry');
    const gatewayArpEntry = document.getElementById('attackGatewayArpEntry');
    victimArpEntry.textContent = '';
    gatewayArpEntry.textContent = '';
    victimArpEntry.style.animation = '';
    gatewayArpEntry.style.animation = '';
}
