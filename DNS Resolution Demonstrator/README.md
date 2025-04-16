# DNS Resolution Demonstrator

A Flask web application that demonstrates how DNS resolution works by showing the step-by-step process of resolving domain names to IP addresses. This interactive tool helps users understand the DNS resolution process through visualizations and simulations.

## Features

- Lookup any domain name and see the DNS resolution process
- Interactive simulation showing packet movement between DNS servers
- Support for both recursive and iterative DNS resolution modes
- Visual representation of the DNS hierarchy
- Detailed path summary showing the exact servers contacted during resolution
- Real-time DNS lookups using actual DNS commands on your local machine

## Installation

1. Clone this repository
2. Create a virtual environment:
   ```
   python -m venv venv
   ```
3. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`
4. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Usage

1. Start the Flask application:
   ```
   python app.py
   ```
2. Open your web browser and navigate to `http://127.0.0.1:5000`
3. Enter a domain name and select a record type
4. Click "Resolve Domain" to see the DNS resolution process

## How It Works

The application uses a combination of the `dns` library of python and actual DNS commands (`dig`) to perform DNS lookups and gather information about the resolution process. When you enter a domain name, the application:

1. Executes real DNS commands on your local machine
2. Tracks the exact path followed during resolution
3. Shows which root servers, TLD servers, and authoritative servers were contacted
4. Displays the final IP address of the domain
5. Provides an interactive simulation of the DNS resolution process

The application supports two query modes:

- **Recursive Mode**: Your computer sends a query to a DNS resolver, which then handles the entire resolution process for you
- **Iterative Mode**: Your computer directly contacts each DNS server in the chain until it gets the final answer

## Requirements

- Python 3.6+
- Flask 3.1.0
- dnspython 2.7.0
- Modern web browser with JavaScript enabled
- Linux (Arch Linux)