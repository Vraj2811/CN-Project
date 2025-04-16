# Packet Analyzer

A web-based tool for analyzing network packet captures (PCAP files) to learn about different network protocols and packet structures.

## Features

- Upload your own PCAP files or use provided samples
- View packet details including headers and payloads
- Filter packets by protocol, IP address, or port
- Search for specific content within packets
- Educational resources about network protocols and the OSI model

## Supported Protocols

- Ethernet, IP, ARP
- TCP, UDP, ICMP
- HTTP, HTTPS, DNS
- And more...

## Requirements

- Python 3.6+
- Flask 3.1.0
- Werkzeug 3.0.1
- Scapy 2.5.0
- Linux (Arch Linux)

## Installation

1. Clone the repository:
   ```
   git clone git@gitlab.com:cn5415516/computer-networks-project.git
   cd Packet-Analyzer
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the application:
   ```
   python app.py
   ```

4. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

1. **Home Page**: Upload your own PCAP files or select from available samples
2. **Analysis Page**: View packet list, apply filters, and examine packet details
3. **Learning Resources**: Read about network protocols and packet structures

## How It Works

1. The application uses Scapy to read and parse PCAP files
2. Packet data is processed and converted to JSON format
3. The web interface displays packet information in a user-friendly way
4. Users can filter and search through packets to find specific information

## Educational Purpose

This tool is designed for educational purposes to help users understand:
- How network protocols work
- The structure of different types of packets
- How to interpret packet data
- The OSI model and network layers

## Ethical Considerations

Packet sniffing should only be performed:
- On networks you own or have explicit permission to monitor
- For legitimate purposes like troubleshooting or security analysis
- In compliance with applicable laws and regulations
- With respect for privacy and confidentiality