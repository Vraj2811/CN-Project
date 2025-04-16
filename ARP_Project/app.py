from flask import Flask, render_template, request, jsonify
import os
import time
import subprocess
from scapy.all import ARP, Ether, srp, conf
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)

# MAC address resolution functions
def ping_host(ip):
    """Ping the IP on Windows."""
    try:
        result = subprocess.run(["ping", "-n", "1", "-w", "2000", ip], stdout=subprocess.DEVNULL)
        return result.returncode == 0
    except Exception as e:
        print(f"Ping error: {e}")
        return False

def get_mac(ip):
    """Send ARP request and get MAC address."""
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

# In-memory ARP cache table
arp_cache = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/arp_request', methods=['POST'])
def arp_request():
    try:
        print("Received ARP request")
        data = request.get_json()
        target_ip = data.get('ip')
        print(f"Target IP: {target_ip}")

        # Check if IP already exists in cache with a resolved MAC
        for entry in arp_cache:
            if entry["ip"] == target_ip:
                if entry["mac"]:
                    print(f"Found cached MAC for {target_ip}: {entry['mac']}")
                    return jsonify({
                        "success": True,
                        "mac_address": entry["mac"],
                        "resolved": True,
                        "message": f"ARP request for {target_ip} resolved to MAC {entry['mac']} (from cache)",
                        "from_cache": True
                    })
                else:
                    print(f"IP {target_ip} exists in cache but MAC is not resolved. Running simulation.")
                    break

        # Simulate ARP request-response process
        time.sleep(1)  # Simulate network delay

        # Try to ping the IP
        print(f"Pinging {target_ip}...")
        is_reachable = ping_host(target_ip)
        print(f"Reachable: {is_reachable}")

        # Initialize variables
        mac_address = None
        message = ""
        resolved = False

        if is_reachable:
            # Try to get the actual MAC address
            print(f"Getting MAC for {target_ip}...")
            mac_address = get_mac(target_ip)
            print(f"MAC result: {mac_address}")

            if mac_address:
                # Successfully resolved MAC
                resolved = True
                message = f"ARP request for {target_ip} resolved to MAC {mac_address}"
            else:
                # Couldn't resolve MAC
                message = f"IP {target_ip} is reachable but MAC could not be resolved."
        else:
            # Not reachable - show error message
            message = f"Warning! Cannot ping the IP {target_ip}. MAC resolution cannot happen."
            mac_address = None
            resolved = False

        # Add to ARP cache
        entry = {
            "ip": target_ip,
            "mac": mac_address,
            "interface": "eth0",
            "type": "dynamic",
            "resolved": resolved,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        # Check if IP already exists in cache
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
        print(f"Error in ARP request: {e}")
        return jsonify({
            "success": False,
            "message": f"Failed to send ARP request: {str(e)}"
        })

@app.route('/get_arp_cache')
def get_arp_cache():
    return jsonify(arp_cache)

@app.route('/update_arp_entry', methods=['POST'])
def update_arp_entry():
    data = request.get_json()
    ip = data.get('ip')
    mac = data.get('mac')
    entry_type = data.get('type', 'static')

    for i, entry in enumerate(arp_cache):
        if entry["ip"] == ip:
            # Try to resolve the MAC address using ARP to see if it's a real device
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

    # If not found, add new entry
    # Try to resolve the MAC address using ARP to see if it's a real device
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

@app.route('/delete_arp_entry', methods=['POST'])
def delete_arp_entry():
    data = request.get_json()
    ip = data.get('ip')

    for i, entry in enumerate(arp_cache):
        if entry["ip"] == ip:
            del arp_cache[i]
            return jsonify({"success": True, "message": f"Deleted ARP entry for {ip}"})

    return jsonify({"success": False, "message": f"No ARP entry found for {ip}"})

if __name__ == '__main__':
    app.run(debug=True)
