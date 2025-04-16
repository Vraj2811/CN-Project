from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import time
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)

# OSI Model Layer Information
osi_layers = {
    7: {
        "name": "Application",
        "description": "Provides network services directly to end-users. Enables applications to access network services.",
        "protocols": ["HTTP", "SMTP", "FTP", "DNS", "DHCP", "Telnet", "SSH"],
        "devices": ["Application Gateways", "Content Filters"],
        "analogy": "The user interface and application functionality you interact with directly.",
        "tcpip_equivalent": "Application Layer (Layer 4)",
        "pdu": "Data",
        "sdu": "User Data",
        "header_info": "Application-specific headers (e.g., HTTP headers, SMTP headers)",
        "encapsulation": "Creates application-specific data format that will be passed down to the Presentation layer."
    },
    6: {
        "name": "Presentation",
        "description": "Translates data between the application layer and lower layers. Handles encryption, compression, and format conversion.",
        "protocols": ["SSL/TLS", "JPEG", "MPEG", "ASCII", "EBCDIC"],
        "devices": ["Encryption/Decryption Devices"],
        "analogy": "The translator that ensures everyone speaks the same language.",
        "tcpip_equivalent": "Application Layer (Layer 4)",
        "pdu": "Data",
        "sdu": "Application Data",
        "header_info": "Format specifiers, encryption parameters",
        "encapsulation": "Transforms data into a standardized format, may encrypt or compress the data."
    },
    5: {
        "name": "Session",
        "description": "Establishes, maintains, and terminates connections (sessions) between applications.",
        "protocols": ["NetBIOS", "RPC", "PPTP", "SAP"],
        "devices": ["Session Border Controllers"],
        "analogy": "The coordinator of conversations between different computers.",
        "tcpip_equivalent": "Application Layer (Layer 4)",
        "pdu": "Data",
        "sdu": "Presentation Data",
        "header_info": "Session identifiers, synchronization points",
        "encapsulation": "Adds session management information to control the dialogue between applications."
    },
    4: {
        "name": "Transport",
        "description": "Provides reliable data transfer, error recovery, and flow control between end systems.",
        "protocols": ["TCP", "UDP", "SCTP", "DCCP"],
        "devices": ["Load Balancers", "WAN Accelerators"],
        "analogy": "The postal service ensuring your package arrives complete and in order.",
        "tcpip_equivalent": "Transport Layer (Layer 3)",
        "pdu": "Segment (TCP) / Datagram (UDP)",
        "sdu": "Session Data",
        "header_info": "TCP: 20-60 bytes with source/destination ports, sequence numbers, flags, window size. UDP: 8 bytes with source/destination ports, length, checksum.",
        "encapsulation": "Adds transport header with port numbers for process-to-process communication, segmentation, and (for TCP) reliability mechanisms."
    },
    3: {
        "name": "Network",
        "description": "Handles routing of data packets between different networks. Manages logical addressing and path determination.",
        "protocols": ["IPv4", "IPv6", "ICMP", "OSPF", "BGP", "RIP"],
        "devices": ["Routers", "Layer 3 Switches"],
        "analogy": "The navigation system determining the best route for your journey.",
        "tcpip_equivalent": "Internet Layer (Layer 2)",
        "pdu": "Packet",
        "sdu": "Transport Segment/Datagram",
        "header_info": "IPv4: 20-60 bytes with source/destination IP addresses, TTL, protocol, checksum. IPv6: 40 bytes with source/destination IP addresses, traffic class, flow label.",
        "encapsulation": "Adds network header with logical addressing (IP addresses) for end-to-end delivery across networks."
    },
    2: {
        "name": "Data Link",
        "description": "Provides node-to-node data transfer and error detection/correction between two directly connected nodes.",
        "protocols": ["Ethernet", "PPP", "HDLC", "Frame Relay", "ATM"],
        "devices": ["Switches", "Bridges", "Wireless Access Points"],
        "analogy": "The traffic controllers ensuring orderly flow between adjacent systems.",
        "tcpip_equivalent": "Network Interface Layer (Layer 1)",
        "pdu": "Frame",
        "sdu": "Network Packet",
        "header_info": "Ethernet: 14-byte header (destination/source MAC addresses, EtherType) and 4-byte trailer (FCS)",
        "encapsulation": "Adds data link header with physical addressing (MAC addresses) for local delivery and trailer for error detection."
    },
    1: {
        "name": "Physical",
        "description": "Transmits raw bit stream over physical medium. Defines electrical, mechanical, and functional specifications.",
        "protocols": ["USB", "Bluetooth", "IEEE 802.11", "IEEE 802.3", "DSL"],
        "devices": ["Hubs", "Repeaters", "Cables", "Network Interface Cards"],
        "analogy": "The actual roads, wires, and physical infrastructure carrying the data.",
        "tcpip_equivalent": "Network Interface Layer (Layer 1)",
        "pdu": "Bits",
        "sdu": "Data Link Frame",
        "header_info": "No headers at this layer, but includes preambles, start/stop bits, and physical signaling",
        "encapsulation": "Converts frames into physical signals (electrical, light, radio) for transmission over the physical medium."
    }
}

# TCP/IP Model Layer Information
tcpip_layers = {
    5: {
        "name": "Application",
        "description": "Combines the functionality of OSI's Application, Presentation, and Session layers.",
        "protocols": ["HTTP", "SMTP", "FTP", "DNS", "DHCP", "Telnet", "SSH"],
        "osi_equivalent": [7, 6, 5],
        "pdu": "Data",
        "sdu": "User Data",
        "headers": [
            {"name": "HTTP Header", "description": "Contains request/response metadata like method, status code, content type"},
            {"name": "SMTP Header", "description": "Contains email routing information and message metadata"},
            {"name": "FTP Commands", "description": "Control commands for file operations"}
        ],
        "header_function": "Identifies the specific application protocol and contains application-specific control information."
    },
    4: {
        "name": "Transport",
        "description": "Equivalent to OSI's Transport layer. Provides end-to-end communication services.",
        "protocols": ["TCP", "UDP", "SCTP"],
        "osi_equivalent": [4],
        "pdu": "Segment (TCP) / Datagram (UDP)",
        "sdu": "Application Data",
        "headers": [
            {"name": "TCP Header", "description": "20-60 bytes: Source/Destination Ports, Sequence Number, Acknowledgment Number, Flags, Window Size, Checksum"},
            {"name": "UDP Header", "description": "8 bytes: Source/Destination Ports, Length, Checksum"}
        ],
        "header_function": "Enables process-to-process communication through port numbers, provides error detection, and (for TCP) ensures reliable, ordered delivery."
    },
    3: {
        "name": "Network",
        "description": "Equivalent to OSI's Network layer. Handles routing of packets across networks.",
        "protocols": ["IPv4", "IPv6", "ICMP", "ARP", "IGMP"],
        "osi_equivalent": [3],
        "pdu": "Packet",
        "sdu": "Transport Segment/Datagram",
        "headers": [
            {"name": "IPv4 Header", "description": "20-60 bytes: Version, IHL, ToS, Total Length, ID, Flags, Fragment Offset, TTL, Protocol, Checksum, Source/Destination IP Addresses"},
            {"name": "IPv6 Header", "description": "40 bytes: Version, Traffic Class, Flow Label, Payload Length, Next Header, Hop Limit, Source/Destination IP Addresses"}
        ],
        "header_function": "Provides logical addressing (IP addresses) for global routing across networks, handles fragmentation and reassembly of packets."
    },
    2: {
        "name": "Data Link",
        "description": "Equivalent to OSI's Data Link layer. Provides node-to-node data transfer and error detection/correction.",
        "protocols": ["Ethernet", "Wi-Fi", "PPP", "HDLC", "Frame Relay"],
        "osi_equivalent": [2],
        "pdu": "Frame",
        "sdu": "Network Packet",
        "headers": [
            {"name": "Ethernet Header", "description": "14 bytes: Destination MAC, Source MAC, EtherType/Length"},
            {"name": "Ethernet Trailer", "description": "4 bytes: Frame Check Sequence (FCS) for error detection"}
        ],
        "header_function": "Provides physical addressing (MAC addresses) for local network communication and handles media access control."
    },
    1: {
        "name": "Physical",
        "description": "Equivalent to OSI's Physical layer. Transmits raw bit stream over physical medium.",
        "protocols": ["USB", "Bluetooth", "IEEE 802.11", "IEEE 802.3", "DSL"],
        "osi_equivalent": [1],
        "pdu": "Bits",
        "sdu": "Data Link Frame",
        "headers": [
            {"name": "Physical Signaling", "description": "Electrical, optical, or radio signals representing bits"}
        ],
        "header_function": "Converts frames into physical signals (electrical, light, radio) for transmission over the physical medium."
    }
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/packet_animation')
def packet_animation():
    return render_template('packet_animation.html')

@app.route('/get_osi_layer/<int:layer_id>')
def get_osi_layer(layer_id):
    if layer_id in osi_layers:
        return jsonify({
            "success": True,
            "layer": osi_layers[layer_id]
        })
    else:
        return jsonify({
            "success": False,
            "message": f"Layer {layer_id} not found"
        })

@app.route('/get_tcpip_layer/<int:layer_id>')
def get_tcpip_layer(layer_id):
    if layer_id in tcpip_layers:
        return jsonify({
            "success": True,
            "layer": tcpip_layers[layer_id]
        })
    else:
        return jsonify({
            "success": False,
            "message": f"Layer {layer_id} not found"
        })

@app.route('/get_all_layers')
def get_all_layers():
    return jsonify({
        "osi": osi_layers,
        "tcpip": tcpip_layers
    })

@app.route('/tcp_handshake')
def tcp_handshake():
    # Simulate TCP handshake process
    return jsonify({
        "success": True,
        "steps": [
            {
                "name": "SYN",
                "description": "Client sends SYN packet with initial sequence number",
                "from": "client",
                "to": "server",
                "seq": 100,
                "ack": 0,
                "flags": ["SYN"],
                "details": "Client initiates connection by sending a SYN (synchronize) packet with a random sequence number."
            },
            {
                "name": "SYN-ACK",
                "description": "Server responds with SYN-ACK packet",
                "from": "server",
                "to": "client",
                "seq": 300,
                "ack": 101,
                "flags": ["SYN", "ACK"],
                "details": "Server acknowledges client's SYN and sends its own SYN with a different sequence number. The ACK value is client's sequence number + 1."
            },
            {
                "name": "ACK",
                "description": "Client acknowledges with ACK packet",
                "from": "client",
                "to": "server",
                "seq": 101,
                "ack": 301,
                "flags": ["ACK"],
                "details": "Client acknowledges server's SYN. The connection is now established and ready for data transfer."
            }
        ]
    })

@app.route('/tcp_communication')
def tcp_communication():
    # Simulate complete TCP communication lifecycle
    return jsonify({
        "success": True,
        "phases": [
            {
                "name": "Connection Establishment",
                "description": "Three-way handshake to establish a reliable connection",
                "steps": [
                    {
                        "name": "SYN",
                        "description": "Client sends SYN packet with initial sequence number",
                        "from": "client",
                        "to": "server",
                        "seq": 100,
                        "ack": 0,
                        "flags": ["SYN"],
                        "details": "Client initiates connection by sending a SYN (synchronize) packet with a random sequence number."
                    },
                    {
                        "name": "SYN-ACK",
                        "description": "Server responds with SYN-ACK packet",
                        "from": "server",
                        "to": "client",
                        "seq": 300,
                        "ack": 101,
                        "flags": ["SYN", "ACK"],
                        "details": "Server acknowledges client's SYN and sends its own SYN with a different sequence number. The ACK value is client's sequence number + 1."
                    },
                    {
                        "name": "ACK",
                        "description": "Client acknowledges with ACK packet",
                        "from": "client",
                        "to": "server",
                        "seq": 101,
                        "ack": 301,
                        "flags": ["ACK"],
                        "details": "Client acknowledges server's SYN. The connection is now established and ready for data transfer."
                    }
                ]
            },
            {
                "name": "Data Transfer",
                "description": "Reliable data exchange between client and server",
                "steps": [
                    {
                        "name": "DATA",
                        "description": "Client sends data packet to server",
                        "from": "client",
                        "to": "server",
                        "seq": 101,
                        "ack": 301,
                        "data_size": 200,
                        "flags": ["ACK", "PSH"],
                        "details": "Client sends data with PSH flag to ensure immediate delivery to the application layer. Sequence number continues from the last ACK."
                    },
                    {
                        "name": "ACK",
                        "description": "Server acknowledges received data",
                        "from": "server",
                        "to": "client",
                        "seq": 301,
                        "ack": 301,
                        "flags": ["ACK"],
                        "details": "Server acknowledges receipt of data. The ACK number is the next byte expected (client's sequence + data size)."
                    },
                    {
                        "name": "DATA",
                        "description": "Server sends response data to client",
                        "from": "server",
                        "to": "client",
                        "seq": 301,
                        "ack": 301,
                        "data_size": 150,
                        "flags": ["ACK", "PSH"],
                        "details": "Server sends response data to client with its own sequence number."
                    },
                    {
                        "name": "ACK",
                        "description": "Client acknowledges server's data",
                        "from": "client",
                        "to": "server",
                        "seq": 301,
                        "ack": 451,
                        "flags": ["ACK"],
                        "details": "Client acknowledges receipt of server's data. The ACK number is server's sequence + data size."
                    }
                ]
            },
            {
                "name": "Connection Termination",
                "description": "Four-way handshake to gracefully close the connection",
                "steps": [
                    {
                        "name": "FIN",
                        "description": "Client initiates connection termination",
                        "from": "client",
                        "to": "server",
                        "seq": 301,
                        "ack": 451,
                        "flags": ["FIN", "ACK"],
                        "details": "Client sends FIN (finish) flag to indicate it has no more data to send."
                    },
                    {
                        "name": "ACK",
                        "description": "Server acknowledges client's FIN",
                        "from": "server",
                        "to": "client",
                        "seq": 451,
                        "ack": 302,
                        "flags": ["ACK"],
                        "details": "Server acknowledges client's FIN. Client-to-server half of the connection is now closed."
                    },
                    {
                        "name": "FIN",
                        "description": "Server initiates its own connection termination",
                        "from": "server",
                        "to": "client",
                        "seq": 451,
                        "ack": 302,
                        "flags": ["FIN", "ACK"],
                        "details": "Server sends its own FIN when it's ready to close the connection."
                    },
                    {
                        "name": "ACK",
                        "description": "Client acknowledges server's FIN",
                        "from": "client",
                        "to": "server",
                        "seq": 302,
                        "ack": 452,
                        "flags": ["ACK"],
                        "details": "Client acknowledges server's FIN. The connection is now fully closed."
                    }
                ]
            }
        ],
        "packet_structure": {
            "header_fields": [
                {"name": "Source Port", "size": "16 bits", "description": "Identifies the sending port"},
                {"name": "Destination Port", "size": "16 bits", "description": "Identifies the receiving port"},
                {"name": "Sequence Number", "size": "32 bits", "description": "Identifies the position of the sender's byte in the data stream"},
                {"name": "Acknowledgment Number", "size": "32 bits", "description": "Next sequence number the sender expects to receive"},
                {"name": "Data Offset", "size": "4 bits", "description": "Size of the TCP header in 32-bit words"},
                {"name": "Reserved", "size": "3 bits", "description": "Reserved for future use"},
                {"name": "Flags", "size": "9 bits", "description": "Control flags (URG, ACK, PSH, RST, SYN, FIN)"},
                {"name": "Window Size", "size": "16 bits", "description": "Flow control window size"},
                {"name": "Checksum", "size": "16 bits", "description": "Error checking for header and data"},
                {"name": "Urgent Pointer", "size": "16 bits", "description": "Points to urgent data"},
                {"name": "Options", "size": "Variable", "description": "Optional fields like MSS, window scaling, etc."}
            ],
            "flag_descriptions": [
                {"flag": "SYN", "description": "Synchronize sequence numbers to initiate a connection"},
                {"flag": "ACK", "description": "Acknowledges received data"},
                {"flag": "FIN", "description": "No more data from sender (used to close a connection)"},
                {"flag": "RST", "description": "Reset the connection"},
                {"flag": "PSH", "description": "Push data to the receiving application without buffering"},
                {"flag": "URG", "description": "Urgent data present"}
            ]
        }
    })

@app.route('/udp_communication')
def udp_communication():
    # Simulate UDP communication
    return jsonify({
        "success": True,
        "steps": [
            {
                "name": "UDP Datagram",
                "description": "Client sends UDP datagram to server",
                "from": "client",
                "to": "server",
                "data": "Hello Server!",
                "port": {"source": 12345, "destination": 53}
            },
            {
                "name": "UDP Response",
                "description": "Server sends UDP response to client (optional)",
                "from": "server",
                "to": "client",
                "data": "Hello Client!",
                "port": {"source": 53, "destination": 12345}
            }
        ]
    })

@app.route('/http_request_response')
def http_request_response():
    # Simulate HTTP request-response cycle
    return jsonify({
        "success": True,
        "steps": [
            {
                "name": "DNS Resolution",
                "description": "Client resolves domain name to IP address",
                "details": "example.com → 93.184.216.34"
            },
            {
                "name": "TCP Handshake",
                "description": "Client establishes TCP connection with server",
                "details": "Three-way handshake: SYN → SYN-ACK → ACK"
            },
            {
                "name": "HTTP Request",
                "description": "Client sends HTTP request to server",
                "details": "GET / HTTP/1.1\nHost: example.com\nUser-Agent: Mozilla/5.0\nAccept: text/html"
            },
            {
                "name": "Server Processing",
                "description": "Server processes the request",
                "details": "Server generates or retrieves the requested resource"
            },
            {
                "name": "HTTP Response",
                "description": "Server sends HTTP response to client",
                "details": "HTTP/1.1 200 OK\nContent-Type: text/html\nContent-Length: 1256\n\n<!DOCTYPE html>..."
            },
            {
                "name": "Connection Close",
                "description": "TCP connection is closed",
                "details": "FIN → ACK → FIN → ACK"
            }
        ]
    })

@app.route('/tcp_vs_udp')
def tcp_vs_udp():
    # Provide TCP vs UDP comparison data
    return jsonify({
        "success": True,
        "comparison": {
            "tcp": {
                "name": "Transmission Control Protocol",
                "connection": "Connection-oriented",
                "reliability": "Reliable - guarantees delivery",
                "ordering": "Maintains packet order",
                "error_checking": "Extensive error checking and recovery",
                "retransmission": "Retransmits lost packets",
                "flow_control": "Has flow control mechanisms",
                "congestion_control": "Has congestion control",
                "overhead": "Higher overhead",
                "speed": "Generally slower due to overhead",
                "use_cases": ["Web browsing (HTTP/HTTPS)", "Email (SMTP)", "File transfers (FTP)", "Remote access (SSH)"]
            },
            "udp": {
                "name": "User Datagram Protocol",
                "connection": "Connectionless",
                "reliability": "Unreliable - no delivery guarantee",
                "ordering": "No packet ordering",
                "error_checking": "Basic error checking, no recovery",
                "retransmission": "No retransmission of lost packets",
                "flow_control": "No flow control",
                "congestion_control": "No congestion control",
                "overhead": "Lower overhead",
                "speed": "Generally faster due to less overhead",
                "use_cases": ["Streaming media", "Online gaming", "VoIP", "DNS lookups", "DHCP"]
            }
        },
        "steps": {
            "tcp": [
                {
                    "name": "Connection Establishment",
                    "description": "TCP establishes a connection before data transfer",
                    "details": "Three-way handshake (SYN, SYN-ACK, ACK) creates a reliable connection"
                },
                {
                    "name": "Data Packet 1 Sent",
                    "description": "Sender transmits first data packet",
                    "details": "Packet includes sequence number for ordering and tracking"
                },
                {
                    "name": "Acknowledgment 1",
                    "description": "Receiver acknowledges receipt of packet 1",
                    "details": "ACK confirms successful delivery and includes next expected sequence number"
                },
                {
                    "name": "Data Packet 2 Sent",
                    "description": "Sender transmits second data packet",
                    "details": "Transmission continues only after previous packet was acknowledged"
                },
                {
                    "name": "Acknowledgment 2",
                    "description": "Receiver acknowledges receipt of packet 2",
                    "details": "Continuous acknowledgment ensures reliability"
                },
                {
                    "name": "Data Packet 3 Sent",
                    "description": "Sender transmits third data packet",
                    "details": "Flow control may adjust transmission rate based on network conditions"
                },
                {
                    "name": "Acknowledgment 3",
                    "description": "Receiver acknowledges receipt of packet 3",
                    "details": "Ordered delivery is guaranteed by sequence numbers"
                },
                {
                    "name": "Data Packet 4 Sent",
                    "description": "Sender transmits fourth data packet",
                    "details": "Congestion control may adjust window size to prevent network overload"
                },
                {
                    "name": "Acknowledgment 4",
                    "description": "Receiver acknowledges receipt of packet 4",
                    "details": "Reliable delivery confirmed for all packets"
                },
                {
                    "name": "Data Packet 5 Sent",
                    "description": "Sender transmits fifth data packet",
                    "details": "Final packet in this transmission sequence"
                },
                {
                    "name": "Acknowledgment 5",
                    "description": "Receiver acknowledges receipt of packet 5",
                    "details": "All data has been successfully received and acknowledged"
                }
            ],
            "udp": [
                {
                    "name": "No Connection Setup",
                    "description": "UDP begins sending data immediately",
                    "details": "No handshake required, reducing initial latency"
                },
                {
                    "name": "Data Packet 1 Sent",
                    "description": "Sender transmits first data packet",
                    "details": "Packet includes destination port but minimal header information"
                },
                {
                    "name": "Data Packet 2 Sent",
                    "description": "Sender transmits second data packet",
                    "details": "Sent immediately without waiting for acknowledgment of previous packet"
                },
                {
                    "name": "Data Packet 3 Sent",
                    "description": "Sender transmits third data packet",
                    "details": "This packet will be lost in transit (simulating network issues)"
                },
                {
                    "name": "Packet 3 Lost",
                    "description": "Third packet is lost during transmission",
                    "details": "UDP provides no recovery mechanism for lost packets"
                },
                {
                    "name": "Data Packet 4 Sent",
                    "description": "Sender transmits fourth data packet",
                    "details": "Continues transmission regardless of packet loss"
                },
                {
                    "name": "Data Packet 5 Sent",
                    "description": "Sender transmits fifth data packet",
                    "details": "Transmission completes faster but with data loss"
                }
            ]
        },
        "packet_structures": {
            "tcp": [
                {"name": "Source Port", "size": "16 bits"},
                {"name": "Destination Port", "size": "16 bits"},
                {"name": "Sequence Number", "size": "32 bits"},
                {"name": "Acknowledgment Number", "size": "32 bits"},
                {"name": "Header Length", "size": "4 bits"},
                {"name": "Reserved", "size": "6 bits"},
                {"name": "Control Flags", "size": "6 bits"},
                {"name": "Window Size", "size": "16 bits"},
                {"name": "Checksum", "size": "16 bits"},
                {"name": "Urgent Pointer", "size": "16 bits"},
                {"name": "Options", "size": "Variable"},
                {"name": "Data", "size": "Variable"}
            ],
            "udp": [
                {"name": "Source Port", "size": "16 bits"},
                {"name": "Destination Port", "size": "16 bits"},
                {"name": "Length", "size": "16 bits"},
                {"name": "Checksum", "size": "16 bits"},
                {"name": "Data", "size": "Variable"}
            ]
        }
    })

if __name__ == '__main__':
    app.run(debug=True)
