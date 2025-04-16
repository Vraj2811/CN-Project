import subprocess
import re
import socket
import platform
import shlex
from .geolocation import get_ip_geolocation

def run_traceroute(destination, method='tcp'):
    """
    Run traceroute command and parse the results

    Args:
        destination (str): The destination domain or IP address
        method (str): The traceroute method to use ('tcp', 'udp', or 'icmp')

    Returns:
        list: A list of dictionaries containing hop information
    """
    try:
        # Resolve domain to IP if needed
        try:
            socket.inet_aton(destination)
            # It's already an IP address
            ip_address = destination
        except socket.error:
            # It's a domain name, resolve it
            ip_address = socket.gethostbyname(destination)

        # Determine the appropriate traceroute command based on the OS and method
        system = platform.system().lower()

        # Normalize method to lowercase
        method = method.lower()
        if method not in ['tcp', 'udp', 'icmp']:
            method = 'tcp'  # Default to TCP if invalid method

        print(f"Using {method.upper()} traceroute method")

        if system == 'windows':
            # Windows doesn't support different protocols easily
            cmd = ['tracert', '-d', '-h', '30', destination]
        elif system == 'darwin':  # macOS
            if method == 'tcp':
                # TCP traceroute on macOS (port 80 is HTTP)
                cmd = ['traceroute', '-n', '-m', '30', '-P', 'tcp', '-p', '80', destination]
            elif method == 'icmp':
                cmd = ['traceroute', '-n', '-m', '30', '-I', destination]
            else:  # UDP
                cmd = ['traceroute', '-n', '-m', '30', destination]
        else:  # Linux and others
            # Try different traceroute options based on method
            if subprocess.run(['which', 'traceroute'], stdout=subprocess.PIPE, stderr=subprocess.PIPE).returncode == 0:
                # Check if we can run traceroute with sudo
                sudo_test = subprocess.run(['sudo', '-n', 'true'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

                if sudo_test.returncode == 0:  # We can use sudo without password
                    if method == 'tcp':
                        # TCP traceroute (port 80 is HTTP)
                        cmd = ['sudo', 'traceroute', '-T', '-n', '-m', '30', '-p', '80', destination]
                    elif method == 'icmp':
                        cmd = ['sudo', 'traceroute', '-I', '-n', '-m', '30', destination]
                    else:  # UDP
                        cmd = ['sudo', 'traceroute', '-n', '-m', '30', destination]
                else:  # Try without sudo
                    if method == 'tcp':
                        cmd = ['traceroute', '-T', '-n', '-m', '30', '-p', '80', destination]
                    elif method == 'icmp':
                        cmd = ['traceroute', '-I', '-n', '-m', '30', destination]
                    else:  # UDP
                        cmd = ['traceroute', '-n', '-m', '30', destination]
            # Fallback to tracepath if traceroute is not available
            elif subprocess.run(['which', 'tracepath'], stdout=subprocess.PIPE, stderr=subprocess.PIPE).returncode == 0:
                cmd = ['tracepath', '-n', '-m', '30', destination]
            else:
                # Last resort
                cmd = ['ping', '-c', '30', '-t', '30', destination]

        print(f"Running command: {' '.join(cmd)}")

        # Run traceroute command
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        stdout, stderr = process.communicate()

        print(f"Command output: {stdout[:200]}...")
        print(f"Command error (if any): {stderr}")

        # If the command failed and we're using TCP or ICMP, try falling back to UDP
        if process.returncode != 0:
            if (method == 'tcp' or method == 'icmp') and 'privileges' in stderr:
                print(f"{method.upper()} traceroute failed due to privileges, falling back to UDP")
                # Fall back to UDP traceroute
                if system == 'darwin':  # macOS
                    fallback_cmd = ['traceroute', '-n', '-m', '30', destination]
                else:  # Linux
                    fallback_cmd = ['traceroute', '-n', '-m', '30', destination]

                print(f"Running fallback command: {' '.join(fallback_cmd)}")

                fallback_process = subprocess.Popen(
                    fallback_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )

                stdout, stderr = fallback_process.communicate()

                print(f"Fallback command output: {stdout[:200]}...")
                print(f"Fallback command error (if any): {stderr}")

                if fallback_process.returncode != 0:
                    return {"error": f"Traceroute failed: {stderr}"}
            else:
                return {"error": f"Traceroute failed: {stderr}"}

        # Parse the output
        hops = []

        # Different patterns for different traceroute tools
        traceroute_pattern = re.compile(r'^\s*(\d+)\s+(?:\*\s+\*\s+\*|(?:(\d+\.\d+) ms\s+)?(?:(\d+\.\d+) ms\s+)?(?:(\d+\.\d+) ms\s+)?(\d+\.\d+\.\d+\.\d+))')
        tracepath_pattern = re.compile(r'^\s*(\d+):\s+(\S+)\s+(?:\(\d+\.\d+\.\d+\.\d+\)\s+)?(?:(\d+\.\d+)ms|asymm \d+)?')
        ping_pattern = re.compile(r'(\d+) bytes from (\d+\.\d+\.\d+\.\d+): icmp_seq=(\d+) ttl=(\d+) time=(\d+\.\d+) ms')

        lines = stdout.strip().split('\n')

        # Try to determine which tool was used based on the output
        if 'ping' in cmd[0]:
            # Parse ping output
            ip = None
            rtt_sum = 0.0
            rtt_count = 0

            for line in lines:
                match = ping_pattern.match(line)
                if match:
                    ip = match.group(2)  # IP address
                    rtt = float(match.group(5))  # RTT in ms
                    rtt_sum += rtt
                    rtt_count += 1

            if ip and rtt_count > 0:
                # Get geolocation data
                geo_data = get_ip_geolocation(ip)

                # Add a single hop for ping
                hops.append({
                    "hop": 1,
                    "ip": ip,
                    "rtt": rtt_sum / rtt_count,
                    "location": geo_data,
                    "timeout": False
                })
        elif 'tracepath' in cmd[0]:
            # Parse tracepath output
            for line in lines:
                match = tracepath_pattern.match(line)
                if match:
                    hop_num = int(match.group(1))
                    host = match.group(2)

                    # Check if this is a timeout hop
                    if host == 'no' or host == 'reply':
                        hops.append({
                            "hop": hop_num,
                            "ip": None,
                            "rtt": None,
                            "location": None,
                            "timeout": True
                        })
                        continue

                    # Extract IP address
                    ip_match = re.search(r'\d+\.\d+\.\d+\.\d+', host)
                    ip = ip_match.group(0) if ip_match else host

                    # Extract RTT
                    rtt = float(match.group(3)) if match.group(3) else None

                    # Get geolocation data
                    geo_data = get_ip_geolocation(ip) if re.match(r'\d+\.\d+\.\d+\.\d+', ip) else None

                    hops.append({
                        "hop": hop_num,
                        "ip": ip,
                        "rtt": rtt,
                        "location": geo_data,
                        "timeout": False
                    })
        else:
            # Parse standard traceroute output
            for line in lines[1:]:  # Skip the first line (header)
                match = traceroute_pattern.match(line)
                if match:
                    hop_num = int(match.group(1))

                    # Check if this is a timeout hop
                    if '*' in line and not match.group(5):
                        hops.append({
                            "hop": hop_num,
                            "ip": None,
                            "rtt": None,
                            "location": None,
                            "timeout": True
                        })
                        continue

                    # Get the IP address
                    ip = match.group(5)

                    # Calculate average RTT from available values
                    rtts = [float(match.group(i)) for i in [2, 3, 4] if match.group(i)]
                    avg_rtt = sum(rtts) / len(rtts) if rtts else None

                    # Get geolocation data
                    geo_data = get_ip_geolocation(ip)

                    hops.append({
                        "hop": hop_num,
                        "ip": ip,
                        "rtt": avg_rtt,
                        "location": geo_data,
                        "timeout": False
                    })

        # If we couldn't parse any hops, try a more advanced fallback approach
        if not hops:
            print("Using fallback parsing method")

            # Try to extract hop number, IP and RTT using more flexible patterns
            hop_line_pattern = re.compile(r'\b(\d+)\b.*?(\d+\.\d+\.\d+\.\d+|\*+).*?(?:(\d+\.\d+)\s*ms)?')

            hop_num = 1
            current_line = 0

            while current_line < len(lines):
                line = lines[current_line]

                # Skip header lines and empty lines
                if not line.strip() or 'traceroute to' in line.lower() or 'tracepath to' in line.lower():
                    current_line += 1
                    continue

                # Try to match the line with our pattern
                match = hop_line_pattern.search(line)

                if match:
                    # Extract hop number if available, otherwise use sequential
                    hop_num = int(match.group(1)) if match.group(1) else hop_num

                    # Check if this is a timeout hop
                    if match.group(2) == '*' or '*' in match.group(2):
                        hops.append({
                            "hop": hop_num,
                            "ip": None,
                            "rtt": None,
                            "location": None,
                            "timeout": True
                        })
                    else:
                        # Extract IP address
                        ip = match.group(2)

                        # Extract RTT if available
                        rtt = float(match.group(3)) if match.group(3) else None

                        # If no RTT in this match, look for ms values in the line
                        if rtt is None:
                            rtt_matches = re.findall(r'(\d+\.\d+)\s*ms', line)
                            rtt = sum(float(r) for r in rtt_matches) / len(rtt_matches) if rtt_matches else None

                        # Get geolocation data
                        geo_data = get_ip_geolocation(ip)

                        hops.append({
                            "hop": hop_num,
                            "ip": ip,
                            "rtt": rtt,
                            "location": geo_data,
                            "timeout": False
                        })
                else:
                    # If no match but line contains an IP address, try to extract it
                    ip_match = re.search(r'(\d+\.\d+\.\d+\.\d+)', line)
                    if ip_match:
                        ip = ip_match.group(1)

                        # Look for ms values
                        rtt_matches = re.findall(r'(\d+\.\d+)\s*ms', line)
                        avg_rtt = sum(float(rtt) for rtt in rtt_matches) / len(rtt_matches) if rtt_matches else None

                        # Get geolocation data
                        geo_data = get_ip_geolocation(ip)

                        hops.append({
                            "hop": hop_num,
                            "ip": ip,
                            "rtt": avg_rtt,
                            "location": geo_data,
                            "timeout": False
                        })
                    elif '*' in line and 'ms' not in line:
                        # This is likely a timeout
                        hops.append({
                            "hop": hop_num,
                            "ip": None,
                            "rtt": None,
                            "location": None,
                            "timeout": True
                        })

                hop_num += 1
                current_line += 1

            # If we still have no hops, try one last approach - just extract all IPs from the output
            if not hops:
                print("Using last resort parsing method - extracting all IPs")
                all_ips = re.findall(r'(\d+\.\d+\.\d+\.\d+)', stdout)

                # Remove duplicates while preserving order
                unique_ips = []
                for ip in all_ips:
                    if ip not in unique_ips:
                        unique_ips.append(ip)

                for i, ip in enumerate(unique_ips):
                    # Get geolocation data
                    geo_data = get_ip_geolocation(ip)

                    hops.append({
                        "hop": i + 1,
                        "ip": ip,
                        "rtt": None,  # We don't know the RTT in this case
                        "location": geo_data,
                        "timeout": False
                    })

        return hops

    except Exception as e:
        return {"error": f"Error running traceroute: {str(e)}"}
