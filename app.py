from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, flash
import os
import time
import subprocess
import random
import ipaddress
import json
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from flask_cors import CORS

# Import utils
from utils.dns_resolver import resolve_domain, get_record_types, run_nslookup
from utils.packet_analyzer import analyze_pcap, get_packet_details
from utils.traceroute import run_traceroute

# Scapy imports for ARP
from scapy.all import ARP, Ether, srp, conf

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
CORS(app)

# Configuration for Packet Analyzer
UPLOAD_FOLDER = 'static/packet/pcap_files'
ALLOWED_EXTENSIONS = {'pcap', 'pcapng'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# --- ARP Project Globals ---
arp_cache = []

# --- DHCP Project Globals ---
dhcp_config = {
    'subnet': '192.168.1.0/24',
    'subnet_mask': '255.255.255.0',
    'gateway': '192.168.1.1',
    'dns_servers': ['8.8.8.8', '8.8.4.4'],
    'lease_time': 60,
    'server_id': '192.168.1.1',
    'start_ip': '192.168.1.100',
    'end_ip': '192.168.1.200',
    'mode': 'dynamic'
}
rogue_dhcp_config = {
    'subnet': '192.168.1.0/24',
    'subnet_mask': '255.255.255.0',
    'gateway': '192.168.1.254',
    'dns_servers': ['192.168.1.254'],
    'lease_time': 86400,
    'server_id': '192.168.1.254',
    'start_ip': '192.168.1.50',
    'end_ip': '192.168.1.99',
    'active': False,
    'mode': 'dynamic'
}
ip_leases = []

# --- OSI Project Globals ---
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

# --- Packet Analyzer Globals ---
SAMPLE_PCAPS = {
    'temp.pcap': 'HTTP Traffic Sample'
}

# --- Helper Functions ---

# ARP Helpers
def ping_host(ip):
    try:
        result = subprocess.run(["ping", "-c", "1", "-W", "2", ip], stdout=subprocess.DEVNULL)
        return result.returncode == 0
    except Exception as e:
        print(f"Ping error: {e}")
        return False

def get_mac(ip):
    try:
        conf.verb = 0
        arp = ARP(pdst=ip)
        ether = Ether(dst="ff:ff:ff:ff:ff:ff")
        packet = ether / arp
        result = srp(packet, timeout=2, iface_hint=ip)[0]
        if result:
            return result[0][1].hwsrc
        return None
    except Exception as e:
        print(f"Error resolving MAC: {e}")
        return None

# DHCP Helpers
def find_ip_for_mac(mac, is_rogue=False):
    for lease in ip_leases:
        if lease['mac'] == mac and lease['type'] == 'static':
            return lease['ip']
    for lease in ip_leases:
        if lease['mac'] == mac and lease['active'] and lease.get('is_rogue', False) == is_rogue:
            return lease['ip']
    return None

def get_next_available_ip(server_config):
    start_ip = int(ipaddress.IPv4Address(server_config['start_ip']))
    end_ip = int(ipaddress.IPv4Address(server_config['end_ip']))
    leased_ips = [lease['ip'] for lease in ip_leases if lease['active']]
    for ip_int in range(start_ip, end_ip + 1):
        ip = str(ipaddress.IPv4Address(ip_int))
        if ip not in leased_ips:
            return ip
    return None

def generate_mac_address():
    return ':'.join(['{:02x}'.format(random.randint(0, 255)) for _ in range(6)])

def calculate_expiry_time(lease_time):
    return datetime.now() + timedelta(seconds=lease_time)

# Packet Analyzer Helpers
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')

# --- ARP Routes ---
@app.route('/arp/')
def arp_index():
    return render_template('arp/index.html')

@app.route('/arp/arp_request', methods=['POST'])
def arp_request():
    try:
        data = request.get_json()
        target_ip = data.get('ip')
        
        for entry in arp_cache:
            if entry["ip"] == target_ip:
                if entry["mac"]:
                    return jsonify({
                        "success": True,
                        "mac_address": entry["mac"],
                        "resolved": True,
                        "message": f"ARP request for {target_ip} resolved to MAC {entry['mac']} (from cache)",
                        "from_cache": True
                    })
                else:
                    break
        
        time.sleep(1)
        is_reachable = ping_host(target_ip)
        mac_address = None
        message = ""
        resolved = False
        
        if is_reachable:
            mac_address = get_mac(target_ip)
            if mac_address:
                resolved = True
                message = f"ARP request for {target_ip} resolved to MAC {mac_address}"
            else:
                message = f"IP {target_ip} is reachable but MAC could not be resolved."
        else:
            message = f"Warning! Cannot ping the IP {target_ip}. MAC resolution cannot happen."
            mac_address = None
            resolved = False
            
        entry = {
            "ip": target_ip,
            "mac": mac_address,
            "interface": "eth0",
            "type": "dynamic",
            "resolved": resolved,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        for i, item in enumerate(arp_cache):
            if item["ip"] == target_ip:
                arp_cache[i] = entry
                break
        else:
            arp_cache.append(entry)
            
        return jsonify({
            "success": True,
            "mac_address": mac_address,
            "resolved": resolved,
            "message": message
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to send ARP request: {str(e)}"})

@app.route('/arp/get_arp_cache')
def get_arp_cache():
    return jsonify(arp_cache)

@app.route('/arp/update_arp_entry', methods=['POST'])
def update_arp_entry():
    data = request.get_json()
    ip = data.get('ip')
    mac = data.get('mac')
    entry_type = data.get('type', 'static')
    
    for i, entry in enumerate(arp_cache):
        if entry["ip"] == ip:
            resolved = False
            if ping_host(ip):
                resolved_mac = get_mac(ip)
                if resolved_mac and resolved_mac.lower() == mac.lower():
                    resolved = True
            arp_cache[i]["mac"] = mac
            arp_cache[i]["type"] = entry_type
            arp_cache[i]["resolved"] = resolved
            arp_cache[i]["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return jsonify({"success": True, "message": f"Updated ARP entry for {ip}"})
            
    resolved = False
    if ping_host(ip):
        resolved_mac = get_mac(ip)
        if resolved_mac and resolved_mac.lower() == mac.lower():
            resolved = True
            
    new_entry = {
        "ip": ip,
        "mac": mac,
        "interface": "eth0",
        "type": entry_type,
        "resolved": resolved,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    arp_cache.append(new_entry)
    return jsonify({"success": True, "message": f"Added new ARP entry for {ip}"})

@app.route('/arp/delete_arp_entry', methods=['POST'])
def delete_arp_entry_arp():
    data = request.get_json()
    ip = data.get('ip')
    for i, entry in enumerate(arp_cache):
        if entry["ip"] == ip:
            del arp_cache[i]
            return jsonify({"success": True, "message": f"Deleted ARP entry for {ip}"})
    return jsonify({"success": False, "message": f"No ARP entry found for {ip}"})

# --- DHCP Routes ---
@app.route('/dhcp/')
def dhcp_index():
    return render_template('dhcp/index.html')

@app.route('/dhcp/dhcp_discover', methods=['POST'])
def dhcp_discover():
    try:
        data = request.get_json()
        client_mac = data.get('mac', generate_mac_address())
        server_config = dhcp_config
        existing_ip = find_ip_for_mac(client_mac, is_rogue=False)
        
        if existing_ip:
            offered_ip = existing_ip
            is_static = False
            for lease in ip_leases:
                if lease['mac'] == client_mac and lease['ip'] == existing_ip:
                    is_static = (lease['type'] == 'static')
                    break
            message = f"Using {'static' if is_static else 'existing'} IP for MAC {client_mac}"
        else:
            offered_ip = get_next_available_ip(server_config)
            message = f"Assigning new IP for MAC {client_mac}"
            if not offered_ip:
                return jsonify({"success": False, "message": "No available IP addresses in the pool"})
                
        offer = {
            "message_type": "DHCP_OFFER",
            "transaction_id": random.randint(1000000, 9999999),
            "client_mac": client_mac,
            "offered_ip": offered_ip,
            "subnet_mask": server_config['subnet_mask'],
            "router": server_config['gateway'],
            "dns_servers": server_config['dns_servers'],
            "lease_time": server_config['lease_time'],
            "server_id": server_config['server_id'],
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "is_rogue": False,
            "message": message
        }
        return jsonify({"success": True, "offer": offer})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error processing DHCP DISCOVER: {str(e)}"})

@app.route('/dhcp/attack_dhcp_discover', methods=['POST'])
def attack_dhcp_discover():
    try:
        data = request.get_json()
        client_mac = data.get('mac', generate_mac_address())
        
        if rogue_dhcp_config['active']:
            server_config = rogue_dhcp_config
            is_rogue = True
        else:
            server_config = dhcp_config
            is_rogue = False
            
        existing_ip = find_ip_for_mac(client_mac, is_rogue=is_rogue)
        
        if existing_ip:
            offered_ip = existing_ip
            is_static = False
            for lease in ip_leases:
                if lease['mac'] == client_mac and lease['ip'] == existing_ip and lease.get('is_rogue', False) == is_rogue:
                    is_static = (lease['type'] == 'static')
                    break
            message = f"Using {'static' if is_static else 'existing'} IP for MAC {client_mac}"
        else:
            offered_ip = get_next_available_ip(server_config)
            message = f"Assigning new IP for MAC {client_mac}"
            if not offered_ip:
                return jsonify({"success": False, "message": "No available IP addresses in the pool"})
                
        offer = {
            "message_type": "DHCP_OFFER",
            "transaction_id": random.randint(1000000, 9999999),
            "client_mac": client_mac,
            "offered_ip": offered_ip,
            "subnet_mask": server_config['subnet_mask'],
            "router": server_config['gateway'],
            "dns_servers": server_config['dns_servers'],
            "lease_time": server_config['lease_time'],
            "server_id": server_config['server_id'],
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "is_rogue": is_rogue,
            "message": message
        }
        return jsonify({"success": True, "offer": offer})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error processing DHCP DISCOVER: {str(e)}"})

@app.route('/dhcp/dhcp_request', methods=['POST'])
def dhcp_request():
    try:
        data = request.get_json()
        client_mac = data.get('mac')
        requested_ip = data.get('requested_ip')
        server_id = data.get('server_id')
        transaction_id = data.get('transaction_id')
        is_rogue = data.get('is_rogue', False)
        
        server_config = rogue_dhcp_config if is_rogue else dhcp_config
        
        if not requested_ip or server_id != server_config['server_id']:
            return jsonify({"success": False, "message": "Invalid DHCP REQUEST parameters"})
            
        lease_time = server_config['lease_time']
        expiry_time = calculate_expiry_time(lease_time)
        assignment_type = 'static' if server_config['mode'] == 'static' else 'dynamic'
        
        new_lease = {
            "ip": requested_ip,
            "mac": client_mac,
            "type": assignment_type,
            "lease_time": lease_time,
            "expiry_time": expiry_time.strftime("%Y-%m-%d %H:%M:%S"),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_id": transaction_id,
            "active": True,
            "is_rogue": is_rogue
        }
        
        for i, lease in enumerate(ip_leases):
            if lease['mac'] == client_mac:
                ip_leases[i] = new_lease
                break
        else:
            ip_leases.append(new_lease)
            
        ack = {
            "message_type": "DHCP_ACK",
            "transaction_id": transaction_id,
            "client_mac": client_mac,
            "assigned_ip": requested_ip,
            "subnet_mask": server_config['subnet_mask'],
            "router": server_config['gateway'],
            "dns_servers": server_config['dns_servers'],
            "lease_time": lease_time,
            "server_id": server_config['server_id'],
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "is_rogue": is_rogue,
            "type": assignment_type
        }
        return jsonify({"success": True, "ack": ack})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error processing DHCP REQUEST: {str(e)}"})

@app.route('/dhcp/get_leases')
def get_leases():
    current_time = datetime.now()
    for lease in ip_leases:
        expiry_time = datetime.strptime(lease['expiry_time'], "%Y-%m-%d %H:%M:%S")
        if current_time > expiry_time:
            lease['active'] = False
    return jsonify(ip_leases)

@app.route('/dhcp/release_ip', methods=['POST'])
def release_ip():
    try:
        data = request.get_json()
        ip = data.get('ip')
        for i, lease in enumerate(ip_leases):
            if lease['ip'] == ip:
                ip_leases[i]['active'] = False
                return jsonify({"success": True, "message": f"Released IP {ip}"})
        return jsonify({"success": False, "message": f"No lease found for IP {ip}"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error releasing IP: {str(e)}"})

@app.route('/dhcp/renew_ip', methods=['POST'])
def renew_ip():
    try:
        data = request.get_json()
        ip = data.get('ip')
        for i, lease in enumerate(ip_leases):
            if lease['ip'] == ip:
                server_config = rogue_dhcp_config if lease.get('is_rogue', False) else dhcp_config
                lease_time = server_config['lease_time']
                expiry_time = calculate_expiry_time(lease_time)
                ip_leases[i]['lease_time'] = lease_time
                ip_leases[i]['expiry_time'] = expiry_time.strftime("%Y-%m-%d %H:%M:%S")
                ip_leases[i]['active'] = True
                return jsonify({
                    "success": True,
                    "message": f"Renewed IP {ip}",
                    "new_expiry": expiry_time.strftime("%Y-%m-%d %H:%M:%S")
                })
        return jsonify({"success": False, "message": f"No lease found for IP {ip}"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error renewing IP: {str(e)}"})

@app.route('/dhcp/toggle_mode', methods=['POST'])
def toggle_mode():
    try:
        data = request.get_json()
        new_mode = data.get('mode')
        if new_mode in ['static', 'dynamic']:
            dhcp_config['mode'] = new_mode
            return jsonify({"success": True, "message": f"DHCP mode changed to {new_mode}", "mode": new_mode})
        return jsonify({"success": False, "message": "Invalid mode"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error toggling mode: {str(e)}"})

@app.route('/dhcp/toggle_rogue_server', methods=['POST'])
def toggle_rogue_server():
    try:
        data = request.get_json()
        active = data.get('active')
        rogue_dhcp_config['active'] = active
        return jsonify({"success": True, "message": f"Rogue DHCP server {'activated' if active else 'deactivated'}", "active": active})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error toggling rogue server: {str(e)}"})

@app.route('/dhcp/toggle_rogue_mode', methods=['POST'])
def toggle_rogue_mode():
    try:
        data = request.get_json()
        new_mode = data.get('mode')
        if new_mode in ['static', 'dynamic']:
            rogue_dhcp_config['mode'] = new_mode
            return jsonify({"success": True, "message": f"Rogue DHCP mode changed to {new_mode}", "mode": new_mode})
        return jsonify({"success": False, "message": "Invalid mode"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error toggling rogue mode: {str(e)}"})

@app.route('/dhcp/get_dhcp_config')
def get_dhcp_config():
    return jsonify({"legitimate": dhcp_config, "rogue": rogue_dhcp_config})

@app.route('/dhcp/clear_leases', methods=['POST'])
def clear_leases():
    global ip_leases
    ip_leases = []
    return jsonify({"success": True, "message": "All IP leases have been cleared"})

@app.route('/dhcp/delete_lease', methods=['POST'])
def delete_lease():
    data = request.get_json()
    ip = data.get('ip')
    for i, lease in enumerate(ip_leases):
        if lease['ip'] == ip:
            del ip_leases[i]
            return jsonify({"success": True, "message": f"Deleted IP lease for {ip}"})
    return jsonify({"success": False, "message": f"No lease found for IP {ip}"})

# --- DNS Routes ---
@app.route('/dns/')
def dns_index():
    return render_template('dns/index.html')

@app.route('/dns/resolve', methods=['GET', 'POST'])
def dns_resolve():
    if request.method == 'POST':
        domain = request.form.get('domain')
        record_type = request.form.get('record_type', 'A')
        query_mode = request.form.get('query_mode', 'recursive')
    else:
        domain = request.args.get('domain')
        record_type = request.args.get('record_type', 'A')
        query_mode = request.args.get('query_mode', 'recursive')

    if not domain:
        return jsonify({'error': 'Domain name is required'}), 400

    try:
        results = resolve_domain(domain, record_type, query_mode)
        return render_template('dns/results.html', domain=domain, record_type=record_type, results=results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/dns/api/record-types')
def dns_record_types():
    return jsonify(get_record_types())

@app.route('/dns/api/nslookup', methods=['POST'])
def dns_api_nslookup():
    data = request.json
    domain = data.get('domain')
    record_type = data.get('record_type', 'A')
    query_mode = data.get('query_mode', 'recursive')

    if not domain:
        return jsonify({'error': 'Domain name is required'}), 400

    return jsonify(run_nslookup(domain, record_type, query_mode))

# --- OSI Routes ---
@app.route('/osi/')
def osi_index():
    return render_template('osi/index.html')

@app.route('/osi/packet_animation')
def osi_packet_animation():
    return render_template('osi/packet_animation.html')

@app.route('/osi/get_osi_layer/<int:layer_id>')
def get_osi_layer(layer_id):
    if layer_id in osi_layers:
        return jsonify({"success": True, "layer": osi_layers[layer_id]})
    return jsonify({"success": False, "message": f"Layer {layer_id} not found"})

@app.route('/osi/get_tcpip_layer/<int:layer_id>')
def get_tcpip_layer(layer_id):
    if layer_id in tcpip_layers:
        return jsonify({"success": True, "layer": tcpip_layers[layer_id]})
    return jsonify({"success": False, "message": f"Layer {layer_id} not found"})

@app.route('/osi/get_all_layers')
def get_all_layers():
    return jsonify({"osi": osi_layers, "tcpip": tcpip_layers})

@app.route('/osi/tcp_handshake')
def tcp_handshake():
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

@app.route('/osi/tcp_communication')
def tcp_communication():
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

@app.route('/osi/udp_communication')
def udp_communication():
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

@app.route('/osi/http_request_response')
def http_request_response():
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

@app.route('/osi/tcp_vs_udp')
def tcp_vs_udp():
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

# --- Packet Analyzer Routes ---
@app.route('/packet/')
def packet_index():
    pcap_files = []
    for filename, description in SAMPLE_PCAPS.items():
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(file_path):
            pcap_files.append({
                'filename': filename,
                'description': description,
                'type': 'sample'
            })
    
    if os.path.exists(app.config['UPLOAD_FOLDER']):
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            if filename not in SAMPLE_PCAPS and allowed_file(filename):
                pcap_files.append({
                    'filename': filename,
                    'description': 'User uploaded file',
                    'type': 'user'
                })
    return render_template('packet/index.html', pcap_files=pcap_files)

@app.route('/packet/upload', methods=['POST'])
def packet_upload_file():
    if 'file' not in request.files:
        flash('No file part')
        return redirect(url_for('packet_index'))
    file = request.files['file']
    if file.filename == '':
        flash('No selected file')
        return redirect(url_for('packet_index'))
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        flash(f'File {filename} uploaded successfully')
        return redirect(url_for('packet_index'))
    flash('Invalid file type. Only PCAP files are allowed.')
    return redirect(url_for('packet_index'))

@app.route('/packet/analyze/<filename>')
def packet_analyze(filename):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(file_path):
        flash(f'File {filename} not found')
        return redirect(url_for('packet_index'))
    return render_template('packet/analyze.html', filename=filename)

@app.route('/packet/api/packets/<filename>')
def packet_get_packets(filename):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    protocol_filter = request.args.get('protocol', None)
    ip_filter = request.args.get('ip', None)
    port_filter = request.args.get('port', None)
    packets = analyze_pcap(file_path, protocol_filter, ip_filter, port_filter)
    return jsonify(packets)

@app.route('/packet/api/packet_details/<filename>/<int:packet_index>')
def packet_details(filename, packet_index):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    details = get_packet_details(file_path, packet_index)
    return jsonify(details)

@app.route('/packet/download_sample/<filename>')
def packet_download_sample(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

# --- Traceroot Routes ---
@app.route('/traceroot/')
def traceroot_index():
    return render_template('traceroot/index.html')

@app.route('/traceroot/api/traceroute', methods=['POST'])
def traceroot_run():
    try:
        data = request.get_json()
        if not data or 'destination' not in data:
            return jsonify({"error": "No destination provided"}), 400
        destination = data['destination']
        method = data.get('method', 'tcp')
        result = run_traceroute(destination, method=method)
        if isinstance(result, dict) and 'error' in result:
            return jsonify(result), 500
        return jsonify({"hops": result})
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host ='0.0.0.0' ,port=5004)
