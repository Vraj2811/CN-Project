import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment variables
IPINFO_API_KEY = os.getenv('IPINFO_API_KEY', '')

def get_ip_geolocation(ip_address):
    """
    Get geolocation data for an IP address using ipinfo.io API
    
    Args:
        ip_address (str): The IP address to geolocate
    
    Returns:
        dict: A dictionary containing geolocation data
    """
    if not ip_address:
        return None
    
    # Skip private IP addresses
    if (ip_address.startswith('10.') or 
        ip_address.startswith('172.16.') or 
        ip_address.startswith('192.168.') or 
        ip_address == '127.0.0.1'):
        return {
            "ip": ip_address,
            "city": "Private Network",
            "region": "Local",
            "country": "Local",
            "loc": "0,0",  # Default location for private IPs
            "org": "Private Network",
            "postal": "",
            "timezone": "",
            "is_private": True
        }
    
    try:
        # Use ipinfo.io API
        url = f"https://ipinfo.io/{ip_address}/json"
        params = {}
        if IPINFO_API_KEY:
            params['token'] = IPINFO_API_KEY
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            # Add is_private flag
            data['is_private'] = False
            return data
        else:
            # Fallback to a default response if API fails
            return {
                "ip": ip_address,
                "city": "Unknown",
                "region": "Unknown",
                "country": "Unknown",
                "loc": "0,0",
                "org": "Unknown",
                "postal": "",
                "timezone": "",
                "is_private": False,
                "error": f"API Error: {response.status_code}"
            }
    
    except Exception as e:
        return {
            "ip": ip_address,
            "city": "Unknown",
            "region": "Unknown",
            "country": "Unknown",
            "loc": "0,0",
            "org": "Unknown",
            "postal": "",
            "timezone": "",
            "is_private": False,
            "error": str(e)
        }
