/**
 * Traceroute functionality for the frontend
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map
    const tracerouteMap = new TracerouteMap('map');

    // DOM elements
    const tracerouteForm = document.getElementById('traceroute-form');
    const destinationInput = document.getElementById('destination');
    const methodSelect = document.getElementById('traceroute-method');
    const submitBtn = document.getElementById('submit-btn');
    const loadingIndicator = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const resultsContainer = document.getElementById('results-container');
    const mapViewBtn = document.getElementById('map-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const mapView = document.getElementById('map-view');
    const listView = document.getElementById('list-view');
    const hopList = document.getElementById('hop-list');
    const totalHopsElement = document.getElementById('total-hops');
    const avgLatencyElement = document.getElementById('avg-latency');
    const timeoutCountElement = document.getElementById('timeout-count');

    // Handle form submission
    tracerouteForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const destination = destinationInput.value.trim();

        if (!destination) {
            showError('Please enter a destination domain or IP address.');
            return;
        }

        // Show loading indicator
        loadingIndicator.classList.remove('d-none');
        errorMessage.classList.add('d-none');
        resultsContainer.classList.add('d-none');
        submitBtn.disabled = true;

        // Get the selected traceroute method
        const method = methodSelect.value;

        // Run traceroute with the selected method
        runTraceroute(destination, method);
    });

    // Toggle between map and list views
    mapViewBtn.addEventListener('click', function() {
        mapViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        mapView.classList.remove('d-none');
        listView.classList.add('d-none');

        // Resize the map to fit the container
        tracerouteMap.resize();
    });

    listViewBtn.addEventListener('click', function() {
        listViewBtn.classList.add('active');
        mapViewBtn.classList.remove('active');
        listView.classList.remove('d-none');
        mapView.classList.add('d-none');
    });

    /**
     * Run traceroute for the given destination
     * @param {string} destination - The destination domain or IP address
     * @param {string} method - The traceroute method to use (tcp, udp, or icmp)
     */
    function runTraceroute(destination, method = 'tcp') {
        // Show the method being used in the loading message
        document.querySelector('#loading p').textContent =
            `Running traceroute using ${method.toUpperCase()} method... This may take a minute.`;

        fetch('/traceroot/api/traceroute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ destination, method })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Hide loading indicator
            loadingIndicator.classList.add('d-none');
            submitBtn.disabled = false;

            if (data.error) {
                showError(data.error);
                return;
            }

            // Display the results
            displayResults(data.hops, destination);
        })
        .catch(error => {
            // Hide loading indicator
            loadingIndicator.classList.add('d-none');
            submitBtn.disabled = false;

            // Show error message
            showError(`Error running traceroute: ${error.message}`);
        });
    }

    /**
     * Display traceroute results
     * @param {Array} hops - Array of hop objects
     * @param {string} destination - The destination domain or IP
     */
    function displayResults(hops, destination) {
        if (!hops || hops.length === 0) {
            showError('No traceroute results found.');
            return;
        }

        // Show results container
        resultsContainer.classList.remove('d-none');

        // Visualize hops on the map
        tracerouteMap.visualizeHops(hops);

        // Populate the list view
        populateHopList(hops);

        // Update summary statistics
        updateSummaryStats(hops);
    }

    /**
     * Populate the hop list table
     * @param {Array} hops - Array of hop objects
     */
    function populateHopList(hops) {
        // Clear existing rows
        hopList.innerHTML = '';

        // Add a row for each hop
        hops.forEach(hop => {
            const row = document.createElement('tr');

            // Determine latency class
            let latencyClass = '';
            let latencyText = '';

            if (hop.timeout) {
                latencyClass = 'latency-timeout';
                latencyText = 'Timeout';
            } else if (hop.rtt === null) {
                latencyClass = 'latency-timeout';
                latencyText = 'N/A';
            } else if (hop.rtt < 50) {
                latencyClass = 'latency-low';
                latencyText = `${hop.rtt.toFixed(2)} ms`;
            } else if (hop.rtt < 150) {
                latencyClass = 'latency-medium';
                latencyText = `${hop.rtt.toFixed(2)} ms`;
            } else {
                latencyClass = 'latency-high';
                latencyText = `${hop.rtt.toFixed(2)} ms`;
            }

            // Create location text
            let locationText = 'Unknown';
            if (hop.location) {
                const city = hop.location.city || 'Unknown';
                const country = hop.location.country || '';
                locationText = country ? `${city}, ${country}` : city;

                if (hop.location.is_private) {
                    locationText = 'Private Network';
                }
            }

            // Create status icon
            let statusIcon = '';
            if (hop.timeout) {
                statusIcon = '<i class="fas fa-times-circle text-danger"></i> Timed Out';
            } else {
                statusIcon = '<i class="fas fa-check-circle text-success"></i> Success';
            }

            // Set row content
            row.innerHTML = `
                <td>${hop.hop}</td>
                <td>${hop.ip || 'N/A'}</td>
                <td>${locationText}</td>
                <td><span class="badge ${latencyClass}">${latencyText}</span></td>
                <td>${statusIcon}</td>
            `;

            hopList.appendChild(row);
        });
    }

    /**
     * Update summary statistics
     * @param {Array} hops - Array of hop objects
     */
    function updateSummaryStats(hops) {
        // Total hops
        totalHopsElement.textContent = hops.length;

        // Average latency
        const validLatencies = hops
            .filter(hop => hop.rtt !== null && !hop.timeout)
            .map(hop => hop.rtt);

        let avgLatency = 0;
        if (validLatencies.length > 0) {
            avgLatency = validLatencies.reduce((sum, rtt) => sum + rtt, 0) / validLatencies.length;
        }

        avgLatencyElement.textContent = `${avgLatency.toFixed(2)} ms`;

        // Timeout count
        const timeoutCount = hops.filter(hop => hop.timeout).length;
        timeoutCountElement.textContent = timeoutCount;
    }

    /**
     * Show an error message
     * @param {string} message - The error message to display
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
        resultsContainer.classList.add('d-none');
    }
});
