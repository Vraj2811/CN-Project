# DHCP Simulator

A comprehensive DHCP (Dynamic Host Configuration Protocol) simulator built with Flask that demonstrates the DHCP protocol's operation, including the DORA process (Discover, Offer, Request, Acknowledge), IP lease management, and rogue DHCP server attack simulation.

## Features

### DHCP Protocol Simulation
- **DORA Process Animation**: Visual representation of the DHCP message exchange process
- **IP Lease Table**: Real-time tracking of IP address assignments
- **Static/Dynamic IP Modes**: Support for both static and dynamic IP address allocation
- **Lease Management**: Ability to release and renew IP leases

### Security Simulation
- **Rogue DHCP Server Attack**: Simulation of a malicious DHCP server attempting to provide false network configuration
- **Attack Visualization**: Side-by-side comparison of legitimate vs. rogue DHCP server responses
- **Security Impact**: Demonstration of how rogue DHCP servers can compromise network security

### Educational Content
- **DHCP Protocol Information**: Detailed explanation of the DHCP protocol and its importance
- **Message Format**: Visual representation of DHCP message structure
- **Security Implications**: Information about DHCP-related security threats and mitigation strategies

## Implementation

### Backend (Flask)
- **IP Lease Management**: In-memory storage of IP leases with expiration tracking
- **DHCP Message Handling**: Implementation of DHCP DISCOVER, OFFER, REQUEST, and ACK messages
- **MAC Address Generation**: Random MAC address generation for simulation purposes
- **Mode Switching**: Support for toggling between static and dynamic IP allocation modes
- **Rogue Server Simulation**: Separate configuration and handling for rogue DHCP server responses

### Frontend
- **Interactive UI**: User-friendly interface for DHCP simulation
- **Real-time Updates**: Dynamic updates of IP lease table and simulation status
- **Visual Animations**: Animated representation of DHCP message exchange
- **Tabbed Interface**: Separate tabs for authentic DHCP simulation and rogue DHCP attack simulation

## How to Use

1. Clone the repository:
   ```
   git clone https://github.com/Vraj2811/CN-Project.git
   cd DHCP_Project
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On Linux
   ```

3. **Setup**:
   ```
   pip install -r requirements.txt
   ```

4. **Run the Application**:
   ```
   python app.py
   ```

5. **Access the Simulator**:
   Open your browser and navigate to `http://localhost:5000`

6. **Simulate DHCP Process**:
   - Click "Start DHCP Process" to initiate the DORA sequence
   - Observe the animated message exchange between client and server
   - View the IP lease table updates in real-time

7. **Manage IP Leases**:
   - Release IP addresses using the "Release" button
   - Renew IP leases using the "Renew" button
   - Remove entries from the table using the "Remove" button

8. **Simulate Rogue DHCP Attack**:
   - Navigate to the "Rogue DHCP Simulation" tab
   - Toggle the rogue DHCP server on/off
   - Initiate the DHCP process to observe how the rogue server intercepts requests
   - Compare the legitimate vs. malicious server responses

9. **Switch Between Modes**:
   - Toggle between static and dynamic IP allocation modes
   - Observe how static entries behave differently (no expiration)

## Educational Value

This simulator serves as an educational tool for:
- Understanding the DHCP protocol and its operation
- Learning about IP address management in networks
- Recognizing security threats related to DHCP
- Visualizing the impact of rogue DHCP servers on network security

## Requirements

- Python 3.6+
- Flask 2.2.3
- ipaddress 1.0.23
- Modern web browser with JavaScript enabled
- Windows OS