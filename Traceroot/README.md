# Traceroot - Visual Traceroute Tool

Traceroot is a web-based tool that provides visual traceroute analysis with animated packet flow on a world map.

## Features

- Run traceroute for any domain or IP address
- Visualize traceroute hops on a world map
- Animate packet flow between hops
- Display latency information with color coding
- Toggle between map view and list view
- Show geolocation information for each hop
- Handle packet loss and unreachable hops

## Requirements

- Python 3.7+
- Flask 3.1.0
- Flask-CORS 4.0.0
- Requests 2.31.0
- Python-dotenv 1.0.0
- Internet connection for IP geolocation
- Windows OS

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/Vraj2811/CN-Project.git
   cd traceroot
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your API keys:
   ```
   FLASK_APP=app.py
   FLASK_ENV=development
   FLASK_DEBUG=1
   IPINFO_API_KEY=your_ipinfo_api_key  # Optional but recommended
   ```

## Usage

1. Start the Flask server:
   ```
   python app.py
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

3. Enter a domain or IP address and click "Run Traceroute"

## Notes

- The traceroute command requires root privileges on some systems. You may need to run the application with sudo or adjust your system's permissions.
- IP geolocation data is approximate and may not be 100% accurate.
- The application works best with a valid IPinfo.io API key for geolocation data.
