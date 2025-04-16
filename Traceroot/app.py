#!/home/dewansh/Documents/CN_project/Traceroot/myenv/bin/python3
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from utils.traceroute import run_traceroute

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/api/traceroute', methods=['POST'])
def traceroute():
    """API endpoint to run traceroute"""
    try:
        data = request.get_json()

        if not data or 'destination' not in data:
            return jsonify({"error": "No destination provided"}), 400

        destination = data['destination']
        # Get the traceroute method (tcp, udp, or icmp) with tcp as default
        method = data.get('method', 'tcp')

        print(f"Running traceroute for destination: {destination} using {method} method")

        # Run traceroute with the specified method
        result = run_traceroute(destination, method=method)

        if isinstance(result, dict) and 'error' in result:
            print(f"Traceroute error: {result['error']}")
            return jsonify(result), 500

        print(f"Traceroute completed successfully with {len(result)} hops")
        return jsonify({"hops": result})
    except Exception as e:
        import traceback
        print(f"Exception in traceroute endpoint: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
