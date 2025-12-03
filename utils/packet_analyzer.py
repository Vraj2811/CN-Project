from scapy.all import rdpcap, Ether, IP, TCP, UDP, DNS, ICMP, ARP, Raw
import json
import datetime
import socket
import os

def analyze_pcap(pcap_file, protocol_filter=None, ip_filter=None, port_filter=None):
    """
    Analyze a PCAP file and return a list of packet summaries
    
    Args:
        pcap_file (str): Path to the PCAP file
        protocol_filter (str, optional): Filter by protocol
        ip_filter (str, optional): Filter by IP address
        port_filter (str, optional): Filter by port number
        
    Returns:
        list: List of packet summaries
    """
    try:
        # Read the PCAP file
        packets = rdpcap(pcap_file)
        
        # Process packets
        packet_list = []
        
        for i, packet in enumerate(packets):
            # Basic packet info
            packet_info = {
                'index': i,
                'time': str(datetime.datetime.fromtimestamp(float(packet.time))),
                'length': len(packet),
                'protocol': 'Unknown',
                'src': '',
                'dst': '',
                'info': ''
            }
            
            # Ethernet layer
            if Ether in packet:
                packet_info['src_mac'] = packet[Ether].src
                packet_info['dst_mac'] = packet[Ether].dst
            
            # IP layer
            if IP in packet:
                packet_info['src'] = packet[IP].src
                packet_info['dst'] = packet[IP].dst
                packet_info['protocol'] = 'IP'
            
            # TCP layer
            if TCP in packet:
                packet_info['src_port'] = packet[TCP].sport
                packet_info['dst_port'] = packet[TCP].dport
                packet_info['protocol'] = 'TCP'
                
                # HTTP detection (simple heuristic)
                if packet[TCP].dport == 80 or packet[TCP].sport == 80:
                    if Raw in packet and (b'HTTP/' in packet[Raw].load or b'GET ' in packet[Raw].load or b'POST ' in packet[Raw].load):
                        packet_info['protocol'] = 'HTTP'
                        packet_info['info'] = f"HTTP {packet[TCP].sport} → {packet[TCP].dport}"
                    else:
                        packet_info['info'] = f"TCP {packet[TCP].sport} → {packet[TCP].dport}"
                # HTTPS detection
                elif packet[TCP].dport == 443 or packet[TCP].sport == 443:
                    packet_info['protocol'] = 'HTTPS'
                    packet_info['info'] = f"HTTPS {packet[TCP].sport} → {packet[TCP].dport}"
                else:
                    packet_info['info'] = f"TCP {packet[TCP].sport} → {packet[TCP].dport}"
            
            # UDP layer
            elif UDP in packet:
                packet_info['src_port'] = packet[UDP].sport
                packet_info['dst_port'] = packet[UDP].dport
                packet_info['protocol'] = 'UDP'
                packet_info['info'] = f"UDP {packet[UDP].sport} → {packet[UDP].dport}"
            
            # DNS layer
            if DNS in packet:
                packet_info['protocol'] = 'DNS'
                if packet.haslayer(DNS) and packet[DNS].qr == 0:  # DNS query
                    query_name = packet[DNS].qd.qname.decode('utf-8', errors='ignore') if packet[DNS].qd else "unknown"
                    packet_info['info'] = f"DNS Query: {query_name}"
                elif packet.haslayer(DNS) and packet[DNS].qr == 1:  # DNS response
                    query_name = packet[DNS].qd.qname.decode('utf-8', errors='ignore') if packet[DNS].qd else "unknown"
                    packet_info['info'] = f"DNS Response: {query_name}"
            
            # ICMP layer
            elif ICMP in packet:
                packet_info['protocol'] = 'ICMP'
                packet_info['info'] = f"ICMP {packet[ICMP].type}/{packet[ICMP].code}"
            
            # ARP layer
            elif ARP in packet:
                packet_info['protocol'] = 'ARP'
                if packet[ARP].op == 1:  # who-has (request)
                    packet_info['info'] = f"ARP Request: Who has {packet[ARP].pdst}? Tell {packet[ARP].psrc}"
                elif packet[ARP].op == 2:  # is-at (response)
                    packet_info['info'] = f"ARP Response: {packet[ARP].psrc} is at {packet[ARP].hwsrc}"
            
            # Apply filters
            if protocol_filter and packet_info['protocol'].lower() != protocol_filter.lower():
                continue
                
            if ip_filter and ip_filter not in packet_info.get('src', '') and ip_filter not in packet_info.get('dst', ''):
                continue
                
            if port_filter:
                port = int(port_filter)
                if ('src_port' not in packet_info or packet_info['src_port'] != port) and \
                   ('dst_port' not in packet_info or packet_info['dst_port'] != port):
                    continue
            
            packet_list.append(packet_info)
        
        return packet_list
    
    except Exception as e:
        print(f"Error analyzing PCAP file: {e}")
        return []

def get_packet_details(pcap_file, packet_index):
    """
    Get detailed information for a specific packet
    
    Args:
        pcap_file (str): Path to the PCAP file
        packet_index (int): Index of the packet
        
    Returns:
        dict: Detailed packet information
    """
    try:
        # Read the PCAP file
        packets = rdpcap(pcap_file)
        
        if packet_index < 0 or packet_index >= len(packets):
            return {'error': 'Packet index out of range'}
        
        packet = packets[packet_index]
        
        # Create a detailed packet representation
        details = {
            'index': packet_index,
            'time': str(datetime.datetime.fromtimestamp(float(packet.time))),
            'length': len(packet),
            'layers': []
        }
        
        # Ethernet layer
        if Ether in packet:
            details['layers'].append({
                'name': 'Ethernet',
                'fields': {
                    'Source MAC': packet[Ether].src,
                    'Destination MAC': packet[Ether].dst,
                    'Type': hex(packet[Ether].type)
                }
            })
        
        # IP layer
        if IP in packet:
            details['layers'].append({
                'name': 'Internet Protocol',
                'fields': {
                    'Version': packet[IP].version,
                    'IHL': packet[IP].ihl,
                    'Total Length': packet[IP].len,
                    'TTL': packet[IP].ttl,
                    'Protocol': packet[IP].proto,
                    'Source IP': packet[IP].src,
                    'Destination IP': packet[IP].dst
                }
            })
        
        # TCP layer
        if TCP in packet:
            details['layers'].append({
                'name': 'Transmission Control Protocol',
                'fields': {
                    'Source Port': packet[TCP].sport,
                    'Destination Port': packet[TCP].dport,
                    'Sequence Number': packet[TCP].seq,
                    'Acknowledgment Number': packet[TCP].ack,
                    'Data Offset': packet[TCP].dataofs,
                    'Flags': {
                        'FIN': packet[TCP].flags.F,
                        'SYN': packet[TCP].flags.S,
                        'RST': packet[TCP].flags.R,
                        'PSH': packet[TCP].flags.P,
                        'ACK': packet[TCP].flags.A,
                        'URG': packet[TCP].flags.U
                    },
                    'Window Size': packet[TCP].window
                }
            })
        
        # UDP layer
        elif UDP in packet:
            details['layers'].append({
                'name': 'User Datagram Protocol',
                'fields': {
                    'Source Port': packet[UDP].sport,
                    'Destination Port': packet[UDP].dport,
                    'Length': packet[UDP].len
                }
            })
        
        # DNS layer
        if DNS in packet:
            dns_info = {
                'name': 'Domain Name System',
                'fields': {
                    'Transaction ID': packet[DNS].id,
                    'Type': 'Query' if packet[DNS].qr == 0 else 'Response',
                    'Opcode': packet[DNS].opcode,
                    'Flags': {
                        'QR': packet[DNS].qr,
                        'AA': packet[DNS].aa,
                        'TC': packet[DNS].tc,
                        'RD': packet[DNS].rd,
                        'RA': packet[DNS].ra
                    }
                },
                'queries': [],
                'answers': []
            }
            
            # Extract queries
            if packet[DNS].qd:
                for i in range(packet[DNS].qdcount):
                    try:
                        qd = packet[DNS].qd
                        query = {
                            'name': qd.qname.decode('utf-8', errors='ignore'),
                            'type': qd.qtype,
                            'class': qd.qclass
                        }
                        dns_info['queries'].append(query)
                    except:
                        pass
            
            # Extract answers
            if packet[DNS].an:
                for i in range(packet[DNS].ancount):
                    try:
                        an = packet[DNS].an[i]
                        answer = {
                            'name': an.rrname.decode('utf-8', errors='ignore'),
                            'type': an.type,
                            'class': an.rclass,
                            'ttl': an.ttl,
                            'data': str(an.rdata)
                        }
                        dns_info['answers'].append(answer)
                    except:
                        pass
            
            details['layers'].append(dns_info)
        
        # ICMP layer
        elif ICMP in packet:
            details['layers'].append({
                'name': 'Internet Control Message Protocol',
                'fields': {
                    'Type': packet[ICMP].type,
                    'Code': packet[ICMP].code,
                    'Checksum': packet[ICMP].chksum
                }
            })
        
        # ARP layer
        elif ARP in packet:
            details['layers'].append({
                'name': 'Address Resolution Protocol',
                'fields': {
                    'Hardware Type': packet[ARP].hwtype,
                    'Protocol Type': packet[ARP].ptype,
                    'Hardware Size': packet[ARP].hwlen,
                    'Protocol Size': packet[ARP].plen,
                    'Operation': 'Request' if packet[ARP].op == 1 else 'Reply',
                    'Sender MAC': packet[ARP].hwsrc,
                    'Sender IP': packet[ARP].psrc,
                    'Target MAC': packet[ARP].hwdst,
                    'Target IP': packet[ARP].pdst
                }
            })
        
        # Raw payload
        if Raw in packet:
            try:
                raw_data = packet[Raw].load
                # Try to decode as text
                try:
                    text_data = raw_data.decode('utf-8', errors='replace')
                    details['layers'].append({
                        'name': 'Payload (Text)',
                        'data': text_data
                    })
                except:
                    # If decoding fails, show as hex
                    hex_data = raw_data.hex()
                    details['layers'].append({
                        'name': 'Payload (Hex)',
                        'data': hex_data
                    })
            except:
                pass
        
        return details
    
    except Exception as e:
        print(f"Error getting packet details: {e}")
        return {'error': str(e)}
