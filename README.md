# Computer Networks Project Hub

A comprehensive web-based application that consolidates six different networking projects into a single unified interface. This tool is designed to demonstrate and visualize various computer networking concepts, protocols, and models.

## Overview

This application serves as a hub for exploring:
1.  **ARP (Address Resolution Protocol)**
2.  **DHCP (Dynamic Host Configuration Protocol)**
3.  **DNS (Domain Name System)**
4.  **OSI & TCP/IP Models**
5.  **Packet Analysis**
6.  **Traceroute**

The project is built using Python (Flask) and provides an interactive web interface for each module.

## Modules

### 1. ARP Project
Visualizes the Address Resolution Protocol.
-   **Features**:
    -   Simulate ARP requests and responses.
    -   View and manage the ARP cache.
    -   Visualize the mapping between IP and MAC addresses.

### 2. DHCP Project
Simulates DHCP server operations and security scenarios.
-   **Features**:
    -   Simulate DHCP Discover, Offer, Request, and Ack (DORA) process.
    -   Manage IP leases (static and dynamic).
    -   **Rogue DHCP Server**: Simulate a rogue server attack and visualize the conflict.

### 3. DNS Resolution Demonstrator
Demonstrates how DNS resolution works.
-   **Features**:
    -   Perform DNS lookups for domains.
    -   Visualize Recursive vs. Iterative queries.
    -   Inspect different DNS record types (A, AAAA, MX, CNAME, etc.).

### 4. OSI Project
An interactive guide to network models.
-   **Features**:
    -   Detailed information on all 7 layers of the OSI model.
    -   Comparison with the TCP/IP model.
    -   **Packet Animation**: Visual demonstration of packet encapsulation and decapsulation as data flows through layers.
    -   TCP Handshake and Data Transfer visualizations.

### 5. Packet Analyzer
A web-based tool for analyzing network traffic.
-   **Features**:
    -   Upload and analyze `.pcap` files.
    -   Filter packets by protocol, IP, or port.
    -   View detailed packet headers and payload information.

### 6. Traceroute
Visualizes the path packets take to a destination.
-   **Features**:
    -   Run traceroute to any domain or IP.
    -   Support for different methods: TCP, UDP, and ICMP.
    -   Map visualization of hops (requires geolocation data).
    -   **Note**: Some methods (TCP/ICMP) may require root/admin privileges.

## Getting Started

### Prerequisites
-   Python 3.7+
-   `pip` (Python package manager)
-   `sudo` privileges (recommended for full Traceroute/Ping functionality)

### Installation

1.  Clone the repository.
2.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### Usage

1.  Run the application:
    ```bash
    sudo python3 app.py
    ```
    *Note: `sudo` is recommended to allow raw socket operations for Traceroute and Ping. If running without sudo, some features may fall back to limited modes.*

2.  Open your web browser and navigate to:
    ```
    http://localhost:5004
    ```

3.  Use the main dashboard to navigate between the different networking tools.

## Technology Stack
-   **Backend**: Python, Flask
-   **Frontend**: HTML, CSS, JavaScript
-   **Networking Libraries**: Scapy, Dnspython, Requests
