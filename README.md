# Computer Networks Projects Collection

This repository contains a collection of six interactive web applications designed to demonstrate and teach various networking concepts. Each project focuses on a different aspect of computer networking, providing hands-on learning experiences through simulations and visualizations.

## Projects Overview

### 1. [ARP Protocol Explorer](./ARP_Project)
An interactive tool for learning about the Address Resolution Protocol (ARP), featuring:
- Dynamic ARP request-response simulations
- ARP cache table visualization
- MAC spoofing demonstration for security awareness
- Educational content about ARP packet structure and operation

### 2. [DHCP Simulator](./DHCP_Project)
A comprehensive simulator for the Dynamic Host Configuration Protocol (DHCP), including:
- DORA process animation (Discover, Offer, Request, Acknowledge)
- IP lease table with real-time tracking
- Support for static and dynamic IP allocation modes
- Rogue DHCP server attack simulation

### 3. [DNS Resolution Demonstrator](./DNS%20Resolution%20Demonstrator)
A visualization tool for understanding how DNS resolution works:
- Step-by-step domain name resolution process
- Interactive packet movement simulation
- Support for both recursive and iterative DNS resolution
- Visual representation of the DNS hierarchy

### 4. [OSI Model & TCP/IP Stack Simulator](./OSI_Project)
An educational tool for learning about network communication models:
- Layer-by-layer breakdown of OSI and TCP/IP models
- Protocol demonstrations (TCP, UDP, HTTP)
- Visualization of encapsulation and decapsulation processes
- Comparison of connection-oriented vs. connectionless protocols

### 5. [Packet Analyzer](./Packet%20Analyzer)
A web-based tool for analyzing network packet captures:
- Upload and analyze PCAP files
- Filter packets by protocol, IP address, or port
- Detailed packet inspection with header and payload analysis
- Support for multiple protocols (Ethernet, IP, TCP, UDP, DNS, HTTP, etc.)

### 6. [Traceroot - Visual Traceroute Tool](./Traceroot)
A visual traceroute analysis tool with:
- Animated packet flow on a world map
- Geolocation information for each hop
- Latency visualization with color coding
- Toggle between map and list views

## Getting Started

Each project is self-contained in its own directory with its own README file, requirements, and setup instructions. To get started with any project:

1. Navigate to the project directory
2. Follow the installation instructions in the project's README.md file
3. Run the application and access it through your web browser

## Common Requirements

While each project has its specific dependencies, most projects require:
- Python 3.6+ or 3.7+
- Flask web framework
- A modern web browser with JavaScript enabled
- Some of the apps 

## Educational Purpose

These applications are designed as educational tools to help students and networking enthusiasts understand various networking concepts through interactive visualizations and simulations. They cover fundamental protocols and processes that form the backbone of modern computer networks.

## Installation Example

Here's a general pattern for setting up any of the projects:

```bash
# Navigate to the project directory
cd [Project_Directory]

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

Then open your web browser and navigate to `http://localhost:5000` or `http://127.0.0.1:5000`.
