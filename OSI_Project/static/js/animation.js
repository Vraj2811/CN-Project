document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startAnimation');
    const packet = document.getElementById('packet');
    const explanationText = document.getElementById('explanation-text');
    const senderLayers = document.querySelectorAll('.sender .layer');
    const receiverLayers = document.querySelectorAll('.receiver .layer');

    let animationInProgress = false;
    let animationSpeed = 2000; // Animation speed in milliseconds (higher = slower)
    let timeoutIds = []; // Store timeout IDs

    // Function to calculate the Y position of a layer
    function getLayerYPosition(layerElement) {
        if (!layerElement) return 0;
        const rect = layerElement.getBoundingClientRect();
        const packetContainer = document.querySelector('.packet-container');
        const containerRect = packetContainer.getBoundingClientRect();
        return rect.top - containerRect.top + rect.height / 2;
    }

    startButton.addEventListener('click', function() {
        if (!animationInProgress) {
            animationInProgress = true;
            startButton.disabled = true;
            startAnimation();
        }
    });

    // Function to clear all timeouts
    function clearAllTimeouts() {
        timeoutIds.forEach(id => clearTimeout(id));
        timeoutIds = [];
    }

    function startAnimation() {
        // Reset animation before starting
        resetAnimation();

        // Start the animation sequence
        const initialTimeout = setTimeout(() => {
            encapsulationProcess();
        }, 500);
        timeoutIds.push(initialTimeout);
    }

    function resetAnimation() {
        // Clear all timeouts to stop any ongoing animations
        clearAllTimeouts();

        // Reset packet position and content
        packet.style.transition = 'none';
        packet.style.left = '25%';
        packet.style.top = '-270%';
        packet.style.transform = 'translate(-50%, -50%)';
        packet.style.width = '80px';
        packet.innerHTML = '<div class="packet-content">Data</div>';

        // Reset all layer highlights
        senderLayers.forEach(layer => layer.classList.remove('active'));
        receiverLayers.forEach(layer => layer.classList.remove('active'));

        // Reset explanation text
        explanationText.textContent = 'Click "Start Animation" to begin the visualization.';

        // Reset button states
        startButton.disabled = false;

        // Reset animation state variables
        animationInProgress = false;

        // Allow a brief moment for the DOM to update before allowing new animations
        setTimeout(() => {
            packet.style.transition = 'all 2s ease';
        }, 100);
    }

    // Helper function to add a header with animation
    function addHeader(headerType, headerText, headerFullName) {
        const headerElement = document.createElement('div');
        headerElement.className = `packet-header ${headerType}-header adding`;
        headerElement.textContent = headerText;
        headerElement.setAttribute('title', headerFullName);

        // Insert at the beginning
        packet.insertBefore(headerElement, packet.firstChild);

        // Remove the animation class after it completes
        setTimeout(() => {
            headerElement.classList.remove('adding');
        }, 500);

        return headerElement;
    }

    // Helper function to highlight a header before removal
    function highlightHeaderForRemoval(headerType) {
        const header = packet.querySelector(`.${headerType}-header`);
        if (header) {
            header.classList.add('removing');
            return header;
        }
        return null;
    }

    function encapsulationProcess() {
        // Step 1: Application Layer (Sender)
        senderLayers[0].classList.add('active');
        explanationText.textContent = 'Step 1: At the Application Layer, the data is prepared for transmission. This layer adds application-specific headers (HTTP, FTP, SMTP, etc).';

        const timeout1 = setTimeout(() => {
            timeoutIds.push(timeout1);
            // Add Application header with animation
            packet.style.width = '100px';
            packet.querySelector('.packet-content');
            addHeader('app', 'A', 'Application Header (HTTP, FTP, SMTP)');

            // Position packet beside the active layer
            packet.style.top = getLayerYPosition(senderLayers[0]) + 'px';

            // Step 2: Move to Transport Layer
            const timeout2 = setTimeout(() => {
                timeoutIds.push(timeout2);
                senderLayers[0].classList.remove('active');
                senderLayers[1].classList.add('active');
                packet.style.top = '30%';
                explanationText.textContent = 'Step 2: At the Transport Layer, the data is segmented and a transport header (TCP/UDP) is added. This header contains port numbers, sequence numbers, and checksum.';

                // Position packet beside the active layer
                packet.style.top = getLayerYPosition(senderLayers[1]) + 'px';

                // Add Transport header with animation
                const timeout3 = setTimeout(() => {
                    timeoutIds.push(timeout3);
                    packet.style.width = '120px';
                    addHeader('transport', 'T', 'Transport Header (TCP/UDP)');

                    // Step 3: Move to Network Layer
                    const timeout4 = setTimeout(() => {
                        timeoutIds.push(timeout4);
                        senderLayers[1].classList.remove('active');
                        senderLayers[2].classList.add('active');
                        packet.style.top = '50%';
                        explanationText.textContent = 'Step 3: At the Network Layer, an IP header is added with source and destination IP addresses. This layer handles routing through different networks.';

                        // Position packet beside the active layer
                        packet.style.top = getLayerYPosition(senderLayers[2]) + 'px';

                        // Add Network header with animation
                        const timeout5 = setTimeout(() => {
                            timeoutIds.push(timeout5);
                            packet.style.width = '140px';
                            addHeader('network', 'N', 'Network Header (IP)');

                            // Step 4: Move to Data Link Layer
                            const timeout6 = setTimeout(() => {
                                timeoutIds.push(timeout6);
                                senderLayers[2].classList.remove('active');
                                senderLayers[3].classList.add('active');
                                packet.style.top = '70%';
                                explanationText.textContent = 'Step 4: At the Data Link Layer, a frame header and trailer are added with MAC addresses. This prepares the data for transmission over the physical medium.';

                                // Position packet beside the active layer
                                packet.style.top = getLayerYPosition(senderLayers[3]) + 'px';

                                // Add Data Link header with animation
                                const timeout7 = setTimeout(() => {
                                    timeoutIds.push(timeout7);
                                    packet.style.width = '160px';
                                    addHeader('datalink', 'D', 'Data Link Header (Ethernet)');

                                    // Step 5: Move to Physical Layer
                                    const timeout8 = setTimeout(() => {
                                        timeoutIds.push(timeout8);
                                        senderLayers[3].classList.remove('active');
                                        senderLayers[4].classList.add('active');
                                        packet.style.top = '90%';
                                        explanationText.textContent = 'Step 5: At the Physical Layer, the frame is converted into bits (1s and 0s) and transmitted over the physical medium (electrical signals, light, radio waves).';

                                        // Add binary representation visual effect
                                        packet.classList.add('header-highlight');

                                        // Position packet beside the active layer
                                        packet.style.top = getLayerYPosition(senderLayers[4]) + 'px';

                                        // Move across the network
                                        const timeout9 = setTimeout(() => {
                                            timeoutIds.push(timeout9);
                                            senderLayers[4].classList.remove('active');
                                            packet.style.left = '80%';
                                            explanationText.textContent = 'The bits are transmitted across the physical medium (cables, wireless signals, etc.) to the receiving computer.';

                                            // Start decapsulation process
                                            const timeout10 = setTimeout(() => {
                                                timeoutIds.push(timeout10);
                                                packet.classList.remove('header-highlight');
                                                decapsulationProcess();
                                            }, animationSpeed * 2);
                                        }, animationSpeed);
                                    }, animationSpeed);
                                }, animationSpeed);
                            }, animationSpeed);
                        }, animationSpeed);
                    }, animationSpeed);
                }, animationSpeed);
            }, animationSpeed);
        }, animationSpeed);
    }

    function decapsulationProcess() {
        // Step 6: Physical Layer (Receiver)
        receiverLayers[4].classList.add('active');
        explanationText.textContent = 'Step 6: At the receiver\'s Physical Layer, the bits are received and converted back into a frame to be passed up to the Data Link Layer.';

        const timeout11 = setTimeout(() => {
            timeoutIds.push(timeout11);
            // Step 7: Move to Data Link Layer
            receiverLayers[4].classList.remove('active');
            receiverLayers[3].classList.add('active');
            packet.style.top = '70%';
            explanationText.textContent = 'Step 7: At the Data Link Layer, the frame is checked for errors using the frame check sequence (FCS). The Data Link header is removed after verifying the MAC addresses.';

            // Position packet beside the active layer
            packet.style.top = getLayerYPosition(receiverLayers[3]) + 'px';

            // Highlight Data Link header for removal
            const timeout12 = setTimeout(() => {
                timeoutIds.push(timeout12);
                const datalinkHeader = highlightHeaderForRemoval('datalink');

                // Remove Data Link header after highlighting
                const timeout13 = setTimeout(() => {
                    timeoutIds.push(timeout13);
                    if (datalinkHeader) datalinkHeader.remove();
                    packet.style.width = '140px';

                    // Step 8: Move to Network Layer
                    const timeout14 = setTimeout(() => {
                        timeoutIds.push(timeout14);
                        receiverLayers[3].classList.remove('active');
                        receiverLayers[2].classList.add('active');
                        packet.style.top = '50%';
                        explanationText.textContent = 'Step 8: At the Network Layer, the IP header is processed. The destination IP address is verified, and routing information is checked before the Network header is removed.';

                        // Position packet beside the active layer
                        packet.style.top = getLayerYPosition(receiverLayers[2]) + 'px';

                        // Highlight Network header for removal
                        const timeout15 = setTimeout(() => {
                            timeoutIds.push(timeout15);
                            const networkHeader = highlightHeaderForRemoval('network');

                            // Remove Network header after highlighting
                            const timeout16 = setTimeout(() => {
                                timeoutIds.push(timeout16);
                                if (networkHeader) networkHeader.remove();
                                packet.style.width = '120px';

                                // Step 9: Move to Transport Layer
                                const timeout17 = setTimeout(() => {
                                    timeoutIds.push(timeout17);
                                    receiverLayers[2].classList.remove('active');
                                    receiverLayers[1].classList.add('active');
                                    packet.style.top = '30%';
                                    explanationText.textContent = 'Step 9: At the Transport Layer, the segments are reassembled if needed. The Transport header is processed to check port numbers, sequence numbers, and ensure reliable delivery.';

                                    // Position packet beside the active layer
                                    packet.style.top = getLayerYPosition(receiverLayers[1]) + 'px';

                                    // Highlight Transport header for removal
                                    const timeout18 = setTimeout(() => {
                                        timeoutIds.push(timeout18);
                                        const transportHeader = highlightHeaderForRemoval('transport');

                                        // Remove Transport header after highlighting
                                        const timeout19 = setTimeout(() => {
                                            timeoutIds.push(timeout19);
                                            if (transportHeader) transportHeader.remove();
                                            packet.style.width = '100px';

                                            // Step 10: Move to Application Layer
                                            const timeout20 = setTimeout(() => {
                                                timeoutIds.push(timeout20);
                                                receiverLayers[1].classList.remove('active');
                                                receiverLayers[0].classList.add('active');
                                                packet.style.top = '10%';
                                                explanationText.textContent = 'Step 10: At the Application Layer, the data is processed according to the application protocol (HTTP, FTP, etc.) and made available to the receiving application.';

                                                // Position packet beside the active layer
                                                packet.style.top = getLayerYPosition(receiverLayers[0]) + 'px';

                                                // Highlight Application header for removal
                                                const timeout21 = setTimeout(() => {
                                                    timeoutIds.push(timeout21);
                                                    const appHeader = highlightHeaderForRemoval('app');

                                                    // Remove Application header after highlighting
                                                    const timeout22 = setTimeout(() => {
                                                        timeoutIds.push(timeout22);
                                                        if (appHeader) appHeader.remove();
                                                        packet.style.width = '80px';

                                                        // Animation complete
                                                        const timeout23 = setTimeout(() => {
                                                            timeoutIds.push(timeout23);
                                                            receiverLayers[0].classList.remove('active');
                                                            packet.classList.add('header-highlight');
                                                            explanationText.textContent = 'Animation complete! The data has successfully traveled from the sender to the receiver through all OSI layers, with headers added during encapsulation and removed during decapsulation.';

                                                            const timeout24 = setTimeout(() => {
                                                                timeoutIds.push(timeout24);
                                                                packet.classList.remove('header-highlight');
                                                                explanationText.textContent += ' Click "Start Animation" to watch again.';
                                                                animationInProgress = false;

                                                                // Reset button states at the end of animation
                                                                startButton.disabled = false;
                                                            }, 1000);
                                                        }, animationSpeed);
                                                    }, animationSpeed/2);
                                                }, animationSpeed/2);
                                            }, animationSpeed);
                                        }, animationSpeed/2);
                                    }, animationSpeed/2);
                                }, animationSpeed);
                            }, animationSpeed/2);
                        }, animationSpeed/2);
                    }, animationSpeed);
                }, animationSpeed/2);
            }, animationSpeed/2);
        }, animationSpeed);
    }
});
