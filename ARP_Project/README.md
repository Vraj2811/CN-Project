# ARP Protocol Explorer: Learn, Simulate & Visualize

A Flask-based web application for learning about the Address Resolution Protocol (ARP), featuring interactive simulations, ARP cache visualization, and security demonstrations. This educational tool helps users understand how IP addresses are mapped to MAC addresses in local networks.

## Features

1. **Comprehensive ARP Educational Content**
   - Detailed explanations of what ARP is and why it's needed
   - Step-by-step breakdown of how the ARP protocol works
   - Information about ARP packet structure, cache, and security concerns

2. **Dynamic ARP Request-Response Simulation**
   - Enter an IP address and see an animated ARP request-response process
   - Visualize how MAC addresses are resolved dynamically
   - View detailed ARP request and reply packet contents in real-time
   - Intelligent caching system that mimics real ARP implementations

3. **ARP Cache Table Visualization**
   - View, add, edit, and delete ARP cache entries
   - Automatic cache updates when new ARP resolutions occur
   - Clear indication of resolved vs. unresolved MAC addresses

4. **MAC Spoofing Demonstration**
   - Educational visualization of how attackers manipulate ARP tables in MITM attacks
   - Before and after attack state comparison
   - Visual explanation of the security vulnerabilities in ARP

## Installation

1. Clone the repository:
   ```
   git clone git@gitlab.com:cn5415516/computer-networks-project.git
   cd ARP_Project
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   venv\Scripts\activate  # On Windows
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Usage

1. Start the Flask application:
   ```
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

3. Navigate through the tabs to explore different features:
   - **Home**: Learn about ARP concepts, packet structure, and security concerns
   - **ARP Simulation**: Enter an IP address to see the ARP resolution process in action
   - **MAC Spoofing**: Explore how ARP poisoning attacks work

4. In the ARP Simulation tab:
   - Enter an IP address and click "Send ARP Request"
   - Watch the animated packet flow and view packet contents
   - See the resolved MAC address (if successful)
   - Use "Try New Query" to start a new simulation
   - The ARP cache table automatically updates with new entries

## Requirements

- Python 3.7+
- Flask 2.3.3
- Flask-WTF 1.1.1
- Scapy 2.5.0
- python-dotenv 1.0.0
- Werkzeug 2.3.7
- Modern web browser with JavaScript enabled
- Linux (Arch Linux)

## Educational Purpose

This application is designed as an educational tool to help students and networking enthusiasts understand the ARP protocol and its security implications. The key educational goals include:

- Providing a clear understanding of how IP addresses are mapped to MAC addresses
- Demonstrating the ARP request-response process with visual animations
- Explaining how ARP caching improves network efficiency
- Raising awareness about security vulnerabilities in the ARP protocol

The MAC spoofing demonstration is included solely to illustrate security concepts and should never be replicated for malicious purposes in real networks.
