from flask import Flask, render_template, request, jsonify
import os
import time
import random
import ipaddress
from datetime import datetime, timedelta

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)

# DHCP Server Configuration
dhcp_config = {
    'subnet': '192.168.1.0/24',
    'subnet_mask': '255.255.255.0',
    'gateway': '192.168.1.1',
    'dns_servers': ['8.8.8.8', '8.8.4.4'],
    'lease_time': 60,  # 1 minute  in seconds
    'server_id': '192.168.1.1',
    'start_ip': '192.168.1.100',
    'end_ip': '192.168.1.200',
    'mode': 'dynamic'  # 'dynamic' or 'static'
}

# Rogue DHCP Server Configuration (for attack simulation)
rogue_dhcp_config = {
    'subnet': '192.168.1.0/24',
    'subnet_mask': '255.255.255.0',
    'gateway': '192.168.1.254',  # Attacker's gateway
    'dns_servers': ['192.168.1.254'],  # Attacker's DNS
    'lease_time': 86400,  # 24 hours in seconds
    'server_id': '192.168.1.254',
    'start_ip': '192.168.1.50',
    'end_ip': '192.168.1.99',
    'active': False,
    'mode': 'dynamic'  # 'dynamic' or 'static'
}

# In-memory IP lease table
ip_leases = []

# Helper functions
def find_ip_for_mac(mac, is_rogue=False):
    """Find an existing IP for a MAC address or return None."""
    # First, check for static entries
    for lease in ip_leases:
        if lease['mac'] == mac and lease['type'] == 'static':
            # Static entries are always returned, regardless of active status
            return lease['ip']

    # Then, check for active dynamic entries
    for lease in ip_leases:
        if lease['mac'] == mac and lease['active'] and lease['is_rogue'] == is_rogue:
            return lease['ip']

    return None

def get_next_available_ip(server_config):
    """Get the next available IP address from the pool."""
    start_ip = int(ipaddress.IPv4Address(server_config['start_ip']))
    end_ip = int(ipaddress.IPv4Address(server_config['end_ip']))

    # Check which IPs are already leased
    leased_ips = [lease['ip'] for lease in ip_leases if lease['active']]

    # Find the first available IP
    for ip_int in range(start_ip, end_ip + 1):
        ip = str(ipaddress.IPv4Address(ip_int))
        if ip not in leased_ips:
            return ip

    return None  # No available IPs

def generate_mac_address():
    """Generate a random MAC address for simulation."""
    return ':'.join(['{:02x}'.format(random.randint(0, 255)) for _ in range(6)])

def calculate_expiry_time(lease_time):
    """Calculate the expiry time based on the lease time."""
    return datetime.now() + timedelta(seconds=lease_time)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dhcp_discover', methods=['POST'])
def dhcp_discover():
    """Handle DHCP DISCOVER message for the simulation tab (always uses legitimate server)."""
    try:
        data = request.get_json()
        client_mac = data.get('mac', generate_mac_address())
        client_hostname = data.get('hostname', f'Client-{client_mac[-5:].replace(":", "")}')

        # Always use legitimate DHCP server for the simulation tab
        server_config = dhcp_config

        # Check if this MAC already has an assigned IP
        existing_ip = find_ip_for_mac(client_mac, is_rogue=False)

        if existing_ip:
            # Use the existing IP for this MAC address
            offered_ip = existing_ip
            # Find the lease to determine if it's static
            is_static = False
            for lease in ip_leases:
                if lease['mac'] == client_mac and lease['ip'] == existing_ip:
                    is_static = (lease['type'] == 'static')
                    break
            message = f"Using {'static' if is_static else 'existing'} IP for MAC {client_mac}"
        else:
            # Get a new available IP
            offered_ip = get_next_available_ip(server_config)
            message = f"Assigning new IP for MAC {client_mac}"

            if not offered_ip:
                return jsonify({
                    "success": False,
                    "message": "No available IP addresses in the pool"
                })

        # Create DHCP OFFER response
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

        return jsonify({
            "success": True,
            "offer": offer
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing DHCP DISCOVER: {str(e)}"
        })

@app.route('/attack_dhcp_discover', methods=['POST'])
def attack_dhcp_discover():
    """Handle DHCP DISCOVER message for the attack simulation tab."""
    try:
        data = request.get_json()
        client_mac = data.get('mac', generate_mac_address())
        client_hostname = data.get('hostname', f'Client-{client_mac[-5:].replace(":", "")}')

        # Check if rogue DHCP server is active
        if rogue_dhcp_config['active']:
            # Rogue server responds faster
            server_config = rogue_dhcp_config
            is_rogue = True
        else:
            server_config = dhcp_config
            is_rogue = False

        # Check if this MAC already has an assigned IP from the appropriate server
        existing_ip = find_ip_for_mac(client_mac, is_rogue=is_rogue)

        if existing_ip:
            # Use the existing IP for this MAC address
            offered_ip = existing_ip
            # Find the lease to determine if it's static
            is_static = False
            for lease in ip_leases:
                if lease['mac'] == client_mac and lease['ip'] == existing_ip and lease['is_rogue'] == is_rogue:
                    is_static = (lease['type'] == 'static')
                    break
            message = f"Using {'static' if is_static else 'existing'} IP for MAC {client_mac}"
        else:
            # Get a new available IP
            offered_ip = get_next_available_ip(server_config)
            message = f"Assigning new IP for MAC {client_mac}"

            if not offered_ip:
                return jsonify({
                    "success": False,
                    "message": "No available IP addresses in the pool"
                })

        # Create DHCP OFFER response
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

        return jsonify({
            "success": True,
            "offer": offer
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing DHCP DISCOVER: {str(e)}"
        })

@app.route('/dhcp_request', methods=['POST'])
def dhcp_request():
    """Handle DHCP REQUEST message."""
    try:
        data = request.get_json()
        client_mac = data.get('mac')
        requested_ip = data.get('requested_ip')
        server_id = data.get('server_id')
        transaction_id = data.get('transaction_id')
        is_rogue = data.get('is_rogue', False)

        # Determine which server configuration to use
        server_config = rogue_dhcp_config if is_rogue else dhcp_config

        # Check if the requested IP is valid
        if not requested_ip or server_id != server_config['server_id']:
            return jsonify({
                "success": False,
                "message": "Invalid DHCP REQUEST parameters"
            })

        # Create a new lease
        lease_time = server_config['lease_time']
        expiry_time = calculate_expiry_time(lease_time)

        # Determine if this is a static or dynamic assignment
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

        # Check if this MAC already has a lease and update it
        for i, lease in enumerate(ip_leases):
            if lease['mac'] == client_mac:
                ip_leases[i] = new_lease
                break
        else:
            # No existing lease, add a new one
            ip_leases.append(new_lease)

        # Create DHCP ACK response
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

        return jsonify({
            "success": True,
            "ack": ack
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing DHCP REQUEST: {str(e)}"
        })

@app.route('/get_leases')
def get_leases():
    """Get all active IP leases."""
    # Update lease status based on expiry time
    current_time = datetime.now()
    for lease in ip_leases:
        expiry_time = datetime.strptime(lease['expiry_time'], "%Y-%m-%d %H:%M:%S")
        if current_time > expiry_time:
            lease['active'] = False

    return jsonify(ip_leases)

@app.route('/release_ip', methods=['POST'])
def release_ip():
    """Release an IP address."""
    try:
        data = request.get_json()
        ip = data.get('ip')

        for i, lease in enumerate(ip_leases):
            if lease['ip'] == ip:
                ip_leases[i]['active'] = False
                return jsonify({
                    "success": True,
                    "message": f"Released IP {ip}"
                })

        return jsonify({
            "success": False,
            "message": f"No lease found for IP {ip}"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error releasing IP: {str(e)}"
        })

@app.route('/renew_ip', methods=['POST'])
def renew_ip():
    """Renew an IP lease."""
    try:
        data = request.get_json()
        ip = data.get('ip')

        for i, lease in enumerate(ip_leases):
            if lease['ip'] == ip:
                # Determine which server configuration to use
                server_config = rogue_dhcp_config if lease.get('is_rogue', False) else dhcp_config

                # Update lease time
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

        return jsonify({
            "success": False,
            "message": f"No lease found for IP {ip}"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error renewing IP: {str(e)}"
        })

@app.route('/toggle_mode', methods=['POST'])
def toggle_mode():
    """Toggle between static and dynamic IP addressing modes."""
    try:
        data = request.get_json()
        new_mode = data.get('mode')

        if new_mode in ['static', 'dynamic']:
            dhcp_config['mode'] = new_mode
            return jsonify({
                "success": True,
                "message": f"DHCP mode changed to {new_mode}",
                "mode": new_mode
            })
        else:
            return jsonify({
                "success": False,
                "message": "Invalid mode. Use 'static' or 'dynamic'."
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error toggling mode: {str(e)}"
        })

@app.route('/toggle_rogue_server', methods=['POST'])
def toggle_rogue_server():
    """Toggle the rogue DHCP server on/off."""
    try:
        data = request.get_json()
        active = data.get('active')

        rogue_dhcp_config['active'] = active

        return jsonify({
            "success": True,
            "message": f"Rogue DHCP server {'activated' if active else 'deactivated'}",
            "active": active
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error toggling rogue server: {str(e)}"
        })

@app.route('/toggle_rogue_mode', methods=['POST'])
def toggle_rogue_mode():
    """Toggle between static and dynamic IP addressing modes for the rogue server."""
    try:
        data = request.get_json()
        new_mode = data.get('mode')

        if new_mode in ['static', 'dynamic']:
            rogue_dhcp_config['mode'] = new_mode
            return jsonify({
                "success": True,
                "message": f"Rogue DHCP mode changed to {new_mode}",
                "mode": new_mode
            })
        else:
            return jsonify({
                "success": False,
                "message": "Invalid mode. Use 'static' or 'dynamic'."
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error toggling rogue mode: {str(e)}"
        })

@app.route('/get_dhcp_config')
def get_dhcp_config():
    """Get the current DHCP server configuration."""
    return jsonify({
        "legitimate": dhcp_config,
        "rogue": rogue_dhcp_config
    })

@app.route('/clear_leases', methods=['POST'])
def clear_leases():
    """Clear all IP leases."""
    try:
        global ip_leases
        ip_leases = []
        return jsonify({
            "success": True,
            "message": "All IP leases have been cleared"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error clearing leases: {str(e)}"
        })

@app.route('/delete_arp_entry', methods=['POST'])
def delete_arp_entry():
    """Delete a specific IP lease."""
    try:
        data = request.get_json()
        ip = data.get('ip')

        for i, lease in enumerate(ip_leases):
            if lease['ip'] == ip:
                del ip_leases[i]
                return jsonify({
                    "success": True,
                    "message": f"Deleted IP lease for {ip}"
                })

        return jsonify({
            "success": False,
            "message": f"No lease found for IP {ip}"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error deleting IP lease: {str(e)}"
        })

if __name__ == '__main__':
    app.run(debug=True)
