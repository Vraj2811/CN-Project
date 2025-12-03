/**
 * Map visualization for traceroute results
 */

class TracerouteMap {
    constructor(mapElementId) {
        this.mapElementId = mapElementId;
        this.map = null;
        this.markers = [];
        this.paths = [];
        this.sourceMarker = null;
        this.destinationMarker = null;
        this.animationInterval = null;
        this.packetMarker = null;
        
        // Initialize the map
        this.initMap();
    }
    
    /**
     * Initialize the Leaflet map
     */
    initMap() {
        // Create the map
        this.map = L.map(this.mapElementId).setView([20, 0], 2);
        
        // Add the tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(this.map);
        
        // Add a scale control
        L.control.scale().addTo(this.map);
    }
    
    /**
     * Clear all markers and paths from the map
     */
    clearMap() {
        // Clear existing markers
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
        
        // Clear existing paths
        this.paths.forEach(path => path.remove());
        this.paths = [];
        
        // Clear source and destination markers
        if (this.sourceMarker) {
            this.sourceMarker.remove();
            this.sourceMarker = null;
        }
        
        if (this.destinationMarker) {
            this.destinationMarker.remove();
            this.destinationMarker = null;
        }
        
        // Stop any ongoing animation
        this.stopAnimation();
    }
    
    /**
     * Visualize traceroute hops on the map
     * @param {Array} hops - Array of hop objects
     */
    visualizeHops(hops) {
        // Clear the map first
        this.clearMap();
        
        // Filter out hops with valid locations
        const validHops = hops.filter(hop => 
            hop.location && 
            hop.location.loc && 
            hop.location.loc !== "0,0" &&
            !hop.timeout
        );
        
        if (validHops.length === 0) {
            console.error("No valid hop locations found");
            return;
        }
        
        // Get source and destination
        const source = validHops[0];
        const destination = validHops[validHops.length - 1];
        
        // Add markers for each hop
        validHops.forEach((hop, index) => {
            const [lat, lng] = hop.location.loc.split(',').map(parseFloat);
            
            // Skip invalid coordinates
            if (isNaN(lat) || isNaN(lng)) {
                return;
            }
            
            // Determine marker class based on latency
            let markerClass = 'hop-marker ';
            if (hop.timeout) {
                markerClass += 'timeout';
            } else if (hop.rtt < 50) {
                markerClass += 'low-latency';
            } else if (hop.rtt < 150) {
                markerClass += 'medium-latency';
            } else {
                markerClass += 'high-latency';
            }
            
            // Create custom marker
            const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: markerClass,
                    html: `<div class="hop-marker-inner"></div>`,
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                })
            });
            
            // Add popup with hop information
            const popupContent = `
                <div class="hop-popup">
                    <h5>Hop #${hop.hop}</h5>
                    <p><strong>IP:</strong> ${hop.ip}</p>
                    <p><strong>Location:</strong> ${hop.location.city || 'Unknown'}, ${hop.location.country || 'Unknown'}</p>
                    <p><strong>Latency:</strong> ${hop.rtt ? hop.rtt.toFixed(2) + ' ms' : 'N/A'}</p>
                    <p><strong>Organization:</strong> ${hop.location.org || 'Unknown'}</p>
                </div>
            `;
            marker.bindPopup(popupContent);
            
            // Add marker to the map
            marker.addTo(this.map);
            this.markers.push(marker);
            
            // Connect to previous hop with a line
            if (index > 0) {
                const prevHop = validHops[index - 1];
                const [prevLat, prevLng] = prevHop.location.loc.split(',').map(parseFloat);
                
                // Create a path between the hops
                const path = L.polyline([[prevLat, prevLng], [lat, lng]], {
                    color: '#007bff',
                    weight: 3,
                    opacity: 0.7,
                    dashArray: '5, 5'
                }).addTo(this.map);
                
                this.paths.push(path);
            }
        });
        
        // Add special markers for source and destination
        if (source && source.location && source.location.loc) {
            const [srcLat, srcLng] = source.location.loc.split(',').map(parseFloat);
            this.sourceMarker = L.marker([srcLat, srcLng], {
                icon: L.divIcon({
                    className: 'hop-marker source',
                    html: `<div class="hop-marker-inner"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })
            });
            
            this.sourceMarker.bindPopup('<strong>Source</strong>').addTo(this.map);
        }
        
        if (destination && destination.location && destination.location.loc) {
            const [destLat, destLng] = destination.location.loc.split(',').map(parseFloat);
            this.destinationMarker = L.marker([destLat, destLng], {
                icon: L.divIcon({
                    className: 'hop-marker destination',
                    html: `<div class="hop-marker-inner"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })
            });
            
            this.destinationMarker.bindPopup('<strong>Destination</strong>').addTo(this.map);
        }
        
        // Fit the map to show all markers
        const allMarkers = [...this.markers];
        if (this.sourceMarker) allMarkers.push(this.sourceMarker);
        if (this.destinationMarker) allMarkers.push(this.destinationMarker);
        
        if (allMarkers.length > 0) {
            const group = L.featureGroup(allMarkers);
            this.map.fitBounds(group.getBounds(), { padding: [30, 30] });
        }
        
        // Start animation
        this.animatePacket(validHops);
    }
    
    /**
     * Animate a packet traveling through the hops
     * @param {Array} hops - Array of hop objects with valid locations
     */
    animatePacket(hops) {
        // Stop any existing animation
        this.stopAnimation();
        
        // Filter hops with valid locations
        const validHops = hops.filter(hop => 
            hop.location && 
            hop.location.loc && 
            hop.location.loc !== "0,0" &&
            !hop.timeout
        );
        
        if (validHops.length < 2) {
            return; // Not enough valid hops for animation
        }
        
        // Create a packet marker
        this.packetMarker = L.circleMarker([0, 0], {
            radius: 6,
            fillColor: '#007bff',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
        }).addTo(this.map);
        
        // Create an array of points for the animation
        const points = validHops.map(hop => {
            const [lat, lng] = hop.location.loc.split(',').map(parseFloat);
            return L.latLng(lat, lng);
        });
        
        let currentSegment = 0;
        let step = 0;
        const stepsPerSegment = 50; // Number of steps to animate between two points
        
        // Start the animation
        this.animationInterval = setInterval(() => {
            if (currentSegment >= points.length - 1) {
                // Animation complete, restart from the beginning
                currentSegment = 0;
                step = 0;
            }
            
            const p1 = points[currentSegment];
            const p2 = points[currentSegment + 1];
            
            // Calculate the current position
            const lat = p1.lat + (p2.lat - p1.lat) * (step / stepsPerSegment);
            const lng = p1.lng + (p2.lng - p1.lng) * (step / stepsPerSegment);
            
            // Update the packet position
            this.packetMarker.setLatLng([lat, lng]);
            
            // Increment step
            step++;
            
            // Move to the next segment if we've completed this one
            if (step > stepsPerSegment) {
                currentSegment++;
                step = 0;
            }
        }, 50); // Update every 50ms
    }
    
    /**
     * Stop the packet animation
     */
    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        
        if (this.packetMarker) {
            this.packetMarker.remove();
            this.packetMarker = null;
        }
    }
    
    /**
     * Resize the map when the container size changes
     */
    resize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }
}
