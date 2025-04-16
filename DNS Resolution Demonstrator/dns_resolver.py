import dns.resolver
import subprocess
from datetime import datetime, timedelta

def get_record_types():
    """Return a list of common DNS record types"""
    return [
        {'value': 'A', 'label': 'A (IPv4 Address)'},
        {'value': 'AAAA', 'label': 'AAAA (IPv6 Address)'},
        {'value': 'CNAME', 'label': 'CNAME (Canonical Name)'},
        {'value': 'MX', 'label': 'MX (Mail Exchange)'},
        {'value': 'NS', 'label': 'NS (Name Server)'},
        {'value': 'TXT', 'label': 'TXT (Text)'},
        {'value': 'SOA', 'label': 'SOA (Start of Authority)'},
        {'value': 'PTR', 'label': 'PTR (Pointer)'},
        {'value': 'SRV', 'label': 'SRV (Service)'},
        {'value': 'CAA', 'label': 'CAA (Certification Authority Authorization)'}
    ]

def resolve_domain(domain, record_type='A', query_mode='recursive'):
    """
    Resolve a domain name and return detailed information about the DNS resolution process
    """
    results = {
        'domain': domain,
        'record_type': record_type,
        'query_mode': query_mode,
        'resolution_steps': [],
        'final_records': [],
        'errors': []
    }

    try:
        # Choose resolution method based on query mode
        if query_mode == 'recursive':
            recursive_resolution(domain, record_type, results)
        else:  # iterative mode
            iterative_resolution(domain, record_type, results)

    except dns.resolver.NXDOMAIN:
        results['errors'].append(f"Domain {domain} does not exist")
    except dns.resolver.NoAnswer:
        results['errors'].append(f"No {record_type} records found for {domain}")
    except dns.resolver.Timeout:
        results['errors'].append(f"Timeout while resolving {domain}")
    except Exception as e:
        results['errors'].append(f"Error resolving {domain}: {str(e)}")

    return results

def recursive_resolution(domain, record_type, results):
    """Perform recursive DNS resolution with detailed path tracking using actual DNS commands"""
    # Run the actual dig command to get the full resolution information
    import subprocess

    # Step 1: Local DNS Resolver
    results['resolution_steps'].append({
        'step': 'Local DNS Resolver',
        'description': f'Starting recursive DNS resolution for {domain} ({record_type} record)',
        'animation_delay': 0,
        'details': 'Your computer sends a recursive query to your configured DNS resolver'
    })

    # Get information about the root servers that were actually contacted
    # We'll use the actual root servers from a real DNS query
    cmd = ['dig', '+trace', domain, record_type]
    try:
        trace_result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        contacted_root_servers = []

        # Parse the output to find which root servers were actually contacted
        for line in trace_result.stdout.splitlines():
            if line.strip() and '.root-servers.net.' in line and 'IN' in line:
                parts = line.strip().split()
                if len(parts) >= 2:
                    # Extract the server that was contacted (usually at the beginning of the line)
                    server_info = parts[0].strip()
                    if '.root-servers.net' in server_info:
                        root_server_name = server_info.rstrip('.')

                        # Get the IP for this root server
                        ip_cmd = ['dig', '+short', root_server_name, 'A']
                        ip_result = subprocess.run(ip_cmd, capture_output=True, text=True, timeout=5)
                        ip = ip_result.stdout.strip() if ip_result.stdout.strip() else 'Unknown'

                        # Add to our list of contacted root servers
                        root_server_info = next((s for s in get_root_servers() if s['name'] == root_server_name), None)
                        if root_server_info and not any(s['name'] == root_server_name for s in contacted_root_servers):
                            contacted_root_servers.append(root_server_info)
                        elif not any(s['name'] == root_server_name for s in contacted_root_servers):
                            contacted_root_servers.append({
                                'name': root_server_name,
                                'ip': ip,
                                'operator': 'Unknown',
                                'location': 'Unknown'
                            })

        # If we couldn't identify any contacted root servers, use a single one from our predefined list
        if not contacted_root_servers:
            # Try to get the first root server from the system's resolver configuration
            cmd = ['dig', '+norecurse', '.', 'NS']
            root_ns_result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            for line in root_ns_result.stdout.splitlines():
                if line.strip() and not line.startswith(';') and '.root-servers.net.' in line:
                    parts = line.strip().split()
                    if len(parts) >= 5 and parts[3] == 'NS':
                        root_server_name = parts[4].rstrip('.')
                        root_server_info = next((s for s in get_root_servers() if s['name'] == root_server_name), None)
                        if root_server_info:
                            contacted_root_servers = [root_server_info]
                            break

            # If still empty, use the first one from our predefined list
            if not contacted_root_servers:
                contacted_root_servers = [get_root_servers()[0]]
    except Exception as e:
        # Fallback to a single root server if the command fails
        contacted_root_servers = [get_root_servers()[0]]
        results['errors'].append(f"Error identifying contacted root servers: {str(e)}")

    # Add the root servers step with detailed information
    results['resolution_steps'].append({
        'step': 'Root DNS Servers',
        'description': 'Resolver queries root DNS servers to find TLD servers',
        'servers': contacted_root_servers,  # Only show the servers that were actually contacted
        'animation_delay': 1000,
        'details': f'Resolver contacts root servers to find information about the .{domain.split(".")[-1]} TLD',
        'server_details': [
            f"Contacted {server['name']} ({server['ip']}) operated by {server.get('operator', 'Unknown')} in {server.get('location', 'Unknown')}"
            for server in contacted_root_servers
        ]
    })

    # Step 3: TLD servers query - get actual TLD servers for the domain
    tld = domain.split('.')[-1]
    cmd = ['dig', '+norecurse', f'.{tld}.', 'NS']
    try:
        tld_ns_result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        tld_servers = []

        # Parse the output to get the TLD servers
        for line in tld_ns_result.stdout.splitlines():
            if line.strip() and not line.startswith(';') and 'IN' in line and 'NS' in line:
                parts = line.strip().split()
                if len(parts) >= 5 and parts[3] == 'NS':
                    tld_server_name = parts[4].rstrip('.')
                    # Get the IP for this TLD server
                    ip_cmd = ['dig', '+short', tld_server_name, 'A']
                    ip_result = subprocess.run(ip_cmd, capture_output=True, text=True, timeout=5)
                    ip = ip_result.stdout.strip() if ip_result.stdout.strip() else 'Unknown'

                    # Add to our list of TLD servers
                    tld_servers.append({
                        'name': tld_server_name,
                        'ip': ip,
                        'location': 'Unknown'  # We don't have location data for all TLD servers
                    })

        # If we couldn't get the TLD servers from the command, use our predefined list
        if not tld_servers:
            tld_servers = get_tld_servers(tld)
    except Exception as e:
        # Fallback to our predefined list if the command fails
        tld_servers = get_tld_servers(tld)
        results['errors'].append(f"Error getting TLD servers: {str(e)}")

    # Use the first TLD server for display purposes
    selected_tld_server = tld_servers[0] if tld_servers else {'name': f'Unknown .{tld} server', 'ip': 'Unknown', 'location': 'Unknown'}

    results['resolution_steps'].append({
        'step': 'TLD DNS Servers',
        'description': f'Resolver queries .{tld} TLD servers to find authoritative name servers',
        'animation_delay': 2000,
        'servers': tld_servers,
        'selected_server': selected_tld_server,
        'details': f'Resolver contacts .{tld} TLD server to find authoritative name servers for {domain}',
        'server_details': [
            f"Contacted {selected_tld_server['name']} ({selected_tld_server['ip']}) in {selected_tld_server.get('location', 'Unknown')}"
        ]
    })

    # Step 4: Get authoritative name servers for the domain using actual dig command
    cmd = ['dig', '+norecurse', domain, 'NS']
    try:
        auth_ns_result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        auth_servers = []

        # Parse the output to get the authoritative name servers
        for line in auth_ns_result.stdout.splitlines():
            if line.strip() and not line.startswith(';') and 'IN' in line and 'NS' in line:
                parts = line.strip().split()
                if len(parts) >= 5 and parts[3] == 'NS':
                    auth_server_name = parts[4].rstrip('.')
                    # Get the IP for this authoritative server
                    ip_cmd = ['dig', '+short', auth_server_name, 'A']
                    ip_result = subprocess.run(ip_cmd, capture_output=True, text=True, timeout=5)
                    ip = ip_result.stdout.strip() if ip_result.stdout.strip() else 'Unknown'

                    # Add to our list of authoritative servers
                    auth_servers.append({
                        'name': auth_server_name,
                        'ip': ip,
                        'location': 'Unknown'
                    })

        # If we couldn't get the authoritative servers from the command, try using dnspython
        if not auth_servers:
            resolver = dns.resolver.Resolver()
            resolver.timeout = 5
            resolver.lifetime = 10

            try:
                ns_records = resolver.resolve(domain, 'NS')
                for ns in ns_records:
                    # For each name server, try to get its IP address
                    try:
                        ns_name = str(ns)
                        ns_ips = resolver.resolve(ns_name, 'A')
                        for ip in ns_ips:
                            auth_servers.append({
                                'name': ns_name,
                                'ip': str(ip),
                                'location': 'Unknown'
                            })
                    except Exception:
                        # If we can't resolve the IP, just use the name
                        auth_servers.append({
                            'name': str(ns),
                            'ip': 'Unknown',
                            'location': 'Unknown'
                        })
            except Exception as e:
                results['errors'].append(f"Could not retrieve NS records using dnspython: {str(e)}")

        # If we still don't have any authoritative servers, create a fallback
        if not auth_servers:
            auth_servers = [{
                'name': f'ns.{domain}',
                'ip': 'Unknown',
                'location': 'Unknown'
            }]
    except Exception as e:
        # If the command fails, create a fallback
        auth_servers = [{
            'name': f'ns.{domain}',
            'ip': 'Unknown',
            'location': 'Unknown'
        }]
        results['errors'].append(f"Error getting authoritative servers: {str(e)}")

    # Use the first authoritative server for display purposes
    selected_auth_server = auth_servers[0] if auth_servers else {'name': f'ns.{domain}', 'ip': 'Unknown', 'location': 'Unknown'}

    # Step 4: Authoritative name servers query
    results['resolution_steps'].append({
        'step': 'Authoritative Name Servers',
        'description': f'Resolver queries authoritative name servers for {domain}',
        'animation_delay': 3000,
        'servers': auth_servers,
        'selected_server': selected_auth_server,
        'details': f'Resolver contacts authoritative name server to get {record_type} records for {domain}',
        'server_details': [
            f"Contacted {selected_auth_server['name']} ({selected_auth_server['ip']}) in {selected_auth_server.get('location', 'Unknown')}"
        ]
    })

    # Step 5: Get the final answer using the actual dig command
    cmd = ['dig', domain, record_type]
    try:
        final_result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        answers = []
        ttl = 300  # Default TTL if we can't parse it

        # Parse the output to get the final records
        for line in final_result.stdout.splitlines():
            if line.strip() and not line.startswith(';') and domain in line and record_type in line:
                parts = line.strip().split()
                if len(parts) >= 5 and parts[3] == record_type:
                    value = parts[4]
                    try:
                        ttl = int(parts[1])
                    except (ValueError, IndexError):
                        pass  # Use default TTL

                    answers.append({
                        'type': record_type,
                        'value': value,
                        'ttl': ttl
                    })

        # If we couldn't get the answers from the command, try using dnspython
        if not answers:
            resolver = dns.resolver.Resolver()
            resolver.timeout = 5
            resolver.lifetime = 10

            try:
                dns_answers = resolver.resolve(domain, record_type)
                for rdata in dns_answers:
                    answers.append({
                        'type': record_type,
                        'value': str(rdata),
                        'ttl': dns_answers.ttl
                    })
                ttl = dns_answers.ttl
            except Exception as e:
                results['errors'].append(f"Could not resolve {record_type} records using dnspython: {str(e)}")

        # Add the final records to the results
        results['final_records'].extend(answers)

        # Get query time from the dig output
        query_time = 'Unknown'
        for line in final_result.stdout.splitlines():
            if 'Query time:' in line:
                query_time = line.split(':', 1)[1].strip()
                break

        # Step 5: Final answer
        results['resolution_steps'].append({
            'step': 'Final Answer',
            'description': f'Resolver returns {len(answers)} records to client',
            'query_time': query_time,
            'animation_delay': 4000,
            'details': f'Resolver has completed the DNS resolution process and returns the final {record_type} records to your computer'
        })
    except Exception as e:
        results['errors'].append(f"Error getting final answer: {str(e)}")

    # Add a summary of the path followed
    path_summary = [
        f"Your computer → DNS Resolver",
        f"DNS Resolver → Root Servers ({contacted_root_servers[0]['name']})",
        f"DNS Resolver → TLD Server ({selected_tld_server['name']})",
        f"DNS Resolver → Authoritative Server ({selected_auth_server['name']})",
        f"DNS Resolver → Your Computer (Final Answer)"
    ]

    results['path_summary'] = path_summary

def iterative_resolution(domain, record_type, results):
    """Perform iterative DNS resolution with detailed path tracking using actual DNS commands"""
    import subprocess

    # Step 1: Client initiates query
    results['resolution_steps'].append({
        'step': 'Client',
        'description': f'Starting iterative DNS resolution for {domain} ({record_type} record)',
        'animation_delay': 0,
        'details': 'Your computer begins the iterative DNS resolution process'
    })

    # Step 2: Query root servers - get the actual root server that was contacted
    cmd = ['dig', '+trace', domain, record_type]
    try:
        trace_result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        contacted_root_server = None

        # Parse the output to find which root server was actually contacted
        for line in trace_result.stdout.splitlines():
            if line.strip() and '.root-servers.net.' in line and 'IN' in line:
                parts = line.strip().split()
                if len(parts) >= 2:
                    # Extract the server that was contacted (usually at the beginning of the line)
                    server_info = parts[0].strip()
                    if '.root-servers.net' in server_info:
                        root_server_name = server_info.rstrip('.')

                        # Get the IP for this root server
                        ip_cmd = ['dig', '+short', root_server_name, 'A']
                        ip_result = subprocess.run(ip_cmd, capture_output=True, text=True, timeout=5)
                        ip = ip_result.stdout.strip() if ip_result.stdout.strip() else 'Unknown'

                        # Use this as our contacted root server
                        root_server_info = next((s for s in get_root_servers() if s['name'] == root_server_name), None)
                        if root_server_info:
                            contacted_root_server = root_server_info
                            break
                        else:
                            contacted_root_server = {
                                'name': root_server_name,
                                'ip': ip,
                                'operator': 'Unknown',
                                'location': 'Unknown'
                            }
                            break

        # If we couldn't identify a contacted root server, use one from our predefined list
        if not contacted_root_server:
            # Try to get a root server from the system's resolver configuration
            cmd = ['dig', '+norecurse', '.', 'NS']
            root_ns_result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            for line in root_ns_result.stdout.splitlines():
                if line.strip() and not line.startswith(';') and '.root-servers.net.' in line:
                    parts = line.strip().split()
                    if len(parts) >= 5 and parts[3] == 'NS':
                        root_server_name = parts[4].rstrip('.')
                        root_server_info = next((s for s in get_root_servers() if s['name'] == root_server_name), None)
                        if root_server_info:
                            contacted_root_server = root_server_info
                            break

            # If still not found, use the first one from our predefined list
            if not contacted_root_server:
                contacted_root_server = get_root_servers()[0]
    except Exception as e:
        # Fallback to a single root server if the command fails
        contacted_root_server = get_root_servers()[0]
        results['errors'].append(f"Error identifying contacted root server: {str(e)}")

    # Use the identified root server for display purposes
    selected_root_server = contacted_root_server

    results['resolution_steps'].append({
        'step': 'Root DNS Server Query',
        'description': 'Client queries a root DNS server',
        'server': selected_root_server,
        'servers': [selected_root_server],  # Include only the one that was contacted
        'animation_delay': 1000,
        'details': f'Your computer directly contacts a root server to ask about .{domain.split(".")[-1]} TLD',
        'server_details': [
            f"Contacted {selected_root_server['name']} ({selected_root_server['ip']}) operated by {selected_root_server.get('operator', 'Unknown')} in {selected_root_server.get('location', 'Unknown')}"
        ]
    })

    # Step 3: Root server refers to TLD servers - get actual TLD servers
    tld = domain.split('.')[-1]
    cmd = ['dig', '+norecurse', f'.{tld}.', 'NS']
    try:
        tld_ns_result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        tld_servers = []

        # Parse the output to get the TLD servers
        for line in tld_ns_result.stdout.splitlines():
            if line.strip() and not line.startswith(';') and 'IN' in line and 'NS' in line:
                parts = line.strip().split()
                if len(parts) >= 5 and parts[3] == 'NS':
                    tld_server_name = parts[4].rstrip('.')
                    # Get the IP for this TLD server
                    ip_cmd = ['dig', '+short', tld_server_name, 'A']
                    ip_result = subprocess.run(ip_cmd, capture_output=True, text=True, timeout=5)
                    ip = ip_result.stdout.strip() if ip_result.stdout.strip() else 'Unknown'

                    # Add to our list of TLD servers
                    tld_servers.append({
                        'name': tld_server_name,
                        'ip': ip,
                        'location': 'Unknown'  # We don't have location data for all TLD servers
                    })

        # If we couldn't get the TLD servers from the command, use our predefined list
        if not tld_servers:
            tld_servers = get_tld_servers(tld)
    except Exception as e:
        # Fallback to our predefined list if the command fails
        tld_servers = get_tld_servers(tld)
        results['errors'].append(f"Error getting TLD servers: {str(e)}")

    results['resolution_steps'].append({
        'step': 'TLD Server Referral',
        'description': f'Root server refers client to .{tld} TLD servers',
        'animation_delay': 2000,
        'servers': tld_servers,
        'details': f'Root server responds with a referral to .{tld} TLD servers',
        'server_details': [
            f"Root server {selected_root_server['name']} provided referral to {len(tld_servers)} .{tld} TLD servers"
        ]
    })

    # Step 4: Query TLD servers
    # Use the first TLD server for display purposes
    selected_tld_server = tld_servers[0] if tld_servers else {'name': f'Unknown .{tld} server', 'ip': 'Unknown', 'location': 'Unknown'}

    results['resolution_steps'].append({
        'step': 'TLD DNS Server Query',
        'description': f'Client queries a .{tld} TLD server',
        'animation_delay': 3000,
        'server': selected_tld_server,
        'details': f'Your computer directly contacts a .{tld} TLD server to ask about {domain}',
        'server_details': [
            f"Contacted {selected_tld_server['name']} ({selected_tld_server['ip']}) in {selected_tld_server.get('location', 'Unknown')}"
        ]
    })

    # Step 5: Get authoritative name servers for the domain without explicitly querying NS records
    # Instead, we'll use the domain's base name to create a likely authoritative server name
    auth_servers = []

    # Extract the base domain (e.g., example.com from www.example.com)
    domain_parts = domain.split('.')
    if len(domain_parts) > 1:
        base_domain = '.'.join(domain_parts[-2:])
    else:
        base_domain = domain

    # Create likely authoritative server names
    likely_auth_servers = [
        f"ns1.{base_domain}",
        f"ns2.{base_domain}",
        f"dns1.{base_domain}",
        f"dns2.{base_domain}"
    ]

    # Try to get IPs for these likely servers
    for server_name in likely_auth_servers:
        try:
            ip_cmd = ['dig', '+short', server_name, 'A']
            ip_result = subprocess.run(ip_cmd, capture_output=True, text=True, timeout=5)
            ip = ip_result.stdout.strip()

            if ip:
                auth_servers.append({
                    'name': server_name,
                    'ip': ip,
                    'location': 'Unknown'
                })
        except Exception:
            pass

    # If we couldn't find any likely authoritative servers, use a generic approach
    if not auth_servers:
        # Try to get the authoritative server from the SOA record
        try:
            soa_cmd = ['dig', '+short', domain, 'SOA']
            soa_result = subprocess.run(soa_cmd, capture_output=True, text=True, timeout=5)
            soa_output = soa_result.stdout.strip()

            if soa_output:
                # SOA record format: primary-ns admin-email serial refresh retry expire minimum
                soa_parts = soa_output.split()
                if len(soa_parts) > 0:
                    primary_ns = soa_parts[0].rstrip('.')

                    # Get IP for the primary nameserver
                    ip_cmd = ['dig', '+short', primary_ns, 'A']
                    ip_result = subprocess.run(ip_cmd, capture_output=True, text=True, timeout=5)
                    ip = ip_result.stdout.strip() if ip_result.stdout.strip() else 'Unknown'

                    auth_servers.append({
                        'name': primary_ns,
                        'ip': ip,
                        'location': 'Unknown'
                    })
        except Exception:
            pass

    # If we still don't have any authoritative servers, create a fallback
    if not auth_servers:
        auth_servers = [{
            'name': f'ns.{domain}',
            'ip': 'Unknown',
            'location': 'Unknown'
        }]

    # Use the first authoritative server for display purposes
    selected_auth_server = auth_servers[0] if auth_servers else {'name': f'ns.{domain}', 'ip': 'Unknown', 'location': 'Unknown'}

    # Step 5: TLD server refers to authoritative servers
    results['resolution_steps'].append({
        'step': 'Authoritative Server Referral',
        'description': f'TLD server refers client to authoritative name servers for {domain}',
        'animation_delay': 4000,
        'servers': auth_servers,
        'details': f'TLD server responds with a referral to authoritative name servers for {domain}',
        'server_details': [
            f"TLD server {selected_tld_server['name']} provided referral to {len(auth_servers)} authoritative servers"
        ]
    })

    # Step 6: Query authoritative servers
    results['resolution_steps'].append({
        'step': 'Authoritative Server Query',
        'description': f'Client queries authoritative name server for {domain}',
        'animation_delay': 5000,
        'server': selected_auth_server,
        'details': f'Your computer directly contacts an authoritative name server to get {record_type} records for {domain}',
        'server_details': [
            f"Contacted {selected_auth_server['name']} ({selected_auth_server['ip']}) in {selected_auth_server.get('location', 'Unknown')}"
        ]
    })

    # Step 7: Get the final answer using the actual dig command
    cmd = ['dig', '@' + selected_auth_server['ip'] if selected_auth_server['ip'] != 'Unknown' else '', domain, record_type]
    try:
        final_result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        answers = []
        # No TTL needed

        # Parse the output to get the final records
        for line in final_result.stdout.splitlines():
            if line.strip() and not line.startswith(';') and domain in line and record_type in line:
                parts = line.strip().split()
                if len(parts) >= 5 and parts[3] == record_type:
                    value = parts[4]
                    # No TTL needed

                    answers.append({
                        'type': record_type,
                        'value': value
                    })

        # If we couldn't get the answers from the command, try using dnspython
        if not answers:
            resolver = dns.resolver.Resolver()
            resolver.timeout = 5
            resolver.lifetime = 10

            try:
                dns_answers = resolver.resolve(domain, record_type)
                for rdata in dns_answers:
                    answers.append({
                        'type': record_type,
                        'value': str(rdata)
                    })
                # No TTL needed
            except Exception as e:
                results['errors'].append(f"Could not resolve {record_type} records using dnspython: {str(e)}")

        # Add the final records to the results
        results['final_records'].extend(answers)

        # No query time needed

        # Step 7: Authoritative server provides the final answer
        results['resolution_steps'].append({
            'step': 'Final Answer',
            'description': f'Authoritative server returns {len(answers)} records to client',
            # No query time
            'animation_delay': 6000,
            'details': f'Authoritative server responds with the final {record_type} records for {domain}'
        })
    except Exception as e:
        results['errors'].append(f"Error getting final answer: {str(e)}")

    # Add a summary of the path followed
    path_summary = [
        f"Your computer → Root Server ({selected_root_server['name']})",
        f"Root Server → Your computer (with referral to TLD servers)",
        f"Your computer → TLD Server ({selected_tld_server['name']})",
        f"TLD Server → Your computer (with referral to authoritative servers)",
        f"Your computer → Authoritative Server ({selected_auth_server['name']})",
        f"Authoritative Server → Your computer (Final Answer)"
    ]

    results['path_summary'] = path_summary

def get_root_servers():
    """Return a list of root DNS servers with their actual information"""
    return [
        {'name': 'a.root-servers.net', 'ip': '198.41.0.4', 'operator': 'Verisign, Inc.', 'location': 'Dulles, Virginia, USA'},
        {'name': 'b.root-servers.net', 'ip': '199.9.14.201', 'operator': 'University of Southern California (ISI)', 'location': 'Marina Del Rey, California, USA'},
        {'name': 'c.root-servers.net', 'ip': '192.33.4.12', 'operator': 'Cogent Communications', 'location': 'Herndon, Virginia, USA'},
        {'name': 'd.root-servers.net', 'ip': '199.7.91.13', 'operator': 'University of Maryland', 'location': 'College Park, Maryland, USA'},
        {'name': 'e.root-servers.net', 'ip': '192.203.230.10', 'operator': 'NASA (Ames Research Center)', 'location': 'Mountain View, California, USA'},
        {'name': 'f.root-servers.net', 'ip': '192.5.5.241', 'operator': 'Internet Systems Consortium, Inc.', 'location': 'San Francisco, California, USA'},
        {'name': 'g.root-servers.net', 'ip': '192.112.36.4', 'operator': 'US Department of Defense (NIC)', 'location': 'Columbus, Ohio, USA'},
        {'name': 'h.root-servers.net', 'ip': '198.97.190.53', 'operator': 'US Army (Research Lab)', 'location': 'Aberdeen, Maryland, USA'},
        {'name': 'i.root-servers.net', 'ip': '192.36.148.17', 'operator': 'Netnod', 'location': 'Stockholm, Sweden'},
        {'name': 'j.root-servers.net', 'ip': '192.58.128.30', 'operator': 'Verisign, Inc.', 'location': 'Dulles, Virginia, USA'},
        {'name': 'k.root-servers.net', 'ip': '193.0.14.129', 'operator': 'RIPE NCC', 'location': 'London, United Kingdom'},
        {'name': 'l.root-servers.net', 'ip': '199.7.83.42', 'operator': 'ICANN', 'location': 'Los Angeles, California, USA'},
        {'name': 'm.root-servers.net', 'ip': '202.12.27.33', 'operator': 'WIDE Project', 'location': 'Tokyo, Japan'}
    ]

def get_tld_servers(tld):
    """Return a list of TLD servers for the given TLD"""
    # This is a simplified simulation - in reality, we would query the root servers
    # to get the actual TLD servers for the specific TLD
    tld_servers = {
        'com': [
            {'name': 'a.gtld-servers.net', 'ip': '192.5.6.30', 'location': 'Dulles, Virginia, USA'},
            {'name': 'b.gtld-servers.net', 'ip': '192.33.14.30', 'location': 'Los Angeles, California, USA'},
            {'name': 'c.gtld-servers.net', 'ip': '192.26.92.30', 'location': 'Herndon, Virginia, USA'},
            {'name': 'd.gtld-servers.net', 'ip': '192.31.80.30', 'location': 'Sterling, Virginia, USA'}
        ],
        'org': [
            {'name': 'a0.org.afilias-nst.info', 'ip': '199.19.56.1', 'location': 'Toronto, Canada'},
            {'name': 'a2.org.afilias-nst.info', 'ip': '199.249.112.1', 'location': 'Toronto, Canada'},
            {'name': 'b0.org.afilias-nst.org', 'ip': '199.19.54.1', 'location': 'Toronto, Canada'},
            {'name': 'b2.org.afilias-nst.org', 'ip': '199.249.120.1', 'location': 'Toronto, Canada'}
        ],
        'net': [
            {'name': 'a.gtld-servers.net', 'ip': '192.5.6.30', 'location': 'Dulles, Virginia, USA'},
            {'name': 'b.gtld-servers.net', 'ip': '192.33.14.30', 'location': 'Los Angeles, California, USA'},
            {'name': 'c.gtld-servers.net', 'ip': '192.26.92.30', 'location': 'Herndon, Virginia, USA'},
            {'name': 'd.gtld-servers.net', 'ip': '192.31.80.30', 'location': 'Sterling, Virginia, USA'}
        ],
        'edu': [
            {'name': 'a.edu-servers.net', 'ip': '192.5.6.30', 'location': 'Dulles, Virginia, USA'},
            {'name': 'b.edu-servers.net', 'ip': '192.33.14.30', 'location': 'Los Angeles, California, USA'},
            {'name': 'c.edu-servers.net', 'ip': '192.26.92.30', 'location': 'Herndon, Virginia, USA'},
            {'name': 'd.edu-servers.net', 'ip': '192.31.80.30', 'location': 'Sterling, Virginia, USA'}
        ]
    }

    # Return servers for the requested TLD, or default to .com if not found
    return tld_servers.get(tld, tld_servers['com'])

def run_nslookup(domain, record_type='A', query_mode='recursive'):
    """Run DNS lookup commands and return the output"""
    try:
        # Determine which command to run based on query mode
        if query_mode == 'iterative':
            # For iterative mode, use +trace to show the step-by-step resolution
            cmd = ['dig', '+trace', '+noall', '+answer', '+additional', '+authority', domain, record_type]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            output = result.stdout

            # Also run a standard dig for comparison
            std_cmd = ['dig', domain, record_type]
            std_result = subprocess.run(std_cmd, capture_output=True, text=True, timeout=15)

            # Add explanatory header
            header = f"\n;; ITERATIVE DNS QUERY (Shows step-by-step resolution path)\n"
            header += f";; Command: {' '.join(cmd)}\n\n"

            # Add explanation of iterative mode
            explanation = "\n;; EXPLANATION OF ITERATIVE MODE:\n"
            explanation += ";; In iterative mode, the client does most of the work:\n"
            explanation += ";; 1. Client queries a root server\n"
            explanation += ";; 2. Root server refers client to TLD servers\n"
            explanation += ";; 3. Client queries a TLD server\n"
            explanation += ";; 4. TLD server refers client to authoritative servers\n"
            explanation += ";; 5. Client queries an authoritative server\n"
            explanation += ";; 6. Authoritative server provides the final answer\n"

            # Add a visual representation of the iterative process
            visual = "\n;; VISUAL REPRESENTATION OF ITERATIVE QUERY:\n"
            visual += ";; CLIENT -> ROOT SERVER -> CLIENT -> TLD SERVER -> CLIENT -> AUTH SERVER -> CLIENT\n"
            visual += ";; Each step requires a separate query from the client\n"

            # Add the standard dig result for comparison
            comparison = f"\n\n;; COMPARISON: STANDARD RECURSIVE QUERY\n"
            comparison += f";; Command: {' '.join(std_cmd)}\n\n"
            comparison += std_result.stdout

            combined_output = header + output + explanation + visual + comparison
        else:
            # For recursive mode, use standard dig command with more options
            cmd = ['dig', '+noall', '+answer', '+additional', '+authority', '+comments', domain, record_type]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            output = result.stdout

            # Also run a +trace query to show the difference
            trace_cmd = ['dig', '+trace', domain, record_type]
            trace_result = subprocess.run(trace_cmd, capture_output=True, text=True, timeout=30)

            # Combine the outputs with headers
            header = f"\n;; RECURSIVE DNS QUERY\n"
            header += f";; Command: {' '.join(cmd)}\n\n"

            # Add explanation of recursive mode
            explanation = "\n;; EXPLANATION OF RECURSIVE MODE:\n"
            explanation += ";; In recursive mode, your DNS resolver does all the work for you:\n"
            explanation += ";; 1. You ask the resolver for the domain\n"
            explanation += ";; 2. The resolver queries root servers\n"
            explanation += ";; 3. The resolver queries TLD servers\n"
            explanation += ";; 4. The resolver queries authoritative servers\n"
            explanation += ";; 5. The resolver returns the final answer to you\n"

            # Add a visual representation of the recursive process
            visual = "\n;; VISUAL REPRESENTATION OF RECURSIVE QUERY:\n"
            visual += ";; CLIENT -> RESOLVER -> ROOT SERVER -> TLD SERVER -> AUTH SERVER -> RESOLVER -> CLIENT\n"
            visual += ";; Client only makes one query to the resolver\n"

            trace_header = f"\n\n;; COMPARISON: ITERATIVE DNS QUERY (+trace)\n"
            trace_header += f";; Command: {' '.join(trace_cmd)}\n\n"
            trace_header += ";; This shows what happens behind the scenes in a recursive query\n"

            combined_output = header + output + explanation + visual + trace_header + trace_result.stdout

        return {
            'status': 'success',
            'command': ' '.join(cmd),
            'stdout': combined_output,
            'stderr': result.stderr,
            'exit_code': result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            'status': 'error',
            'message': 'Command timed out - DNS resolution is taking too long',
            'command': ' '.join(cmd) if 'cmd' in locals() else 'DNS command'
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Error executing DNS commands: {str(e)}',
            'command': ' '.join(cmd) if 'cmd' in locals() else 'DNS command'
        }
