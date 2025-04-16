from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_from_directory
import os
import json
from werkzeug.utils import secure_filename
from utils.packet_analyzer import analyze_pcap, get_packet_details

app = Flask(__name__)
app.secret_key = 'packet_analyzer_secret_key'

# Configuration
UPLOAD_FOLDER = 'static/pcap_files'
ALLOWED_EXTENSIONS = {'pcap', 'pcapng'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Sample PCAP files
SAMPLE_PCAPS = {
    'temp.pcap': 'HTTP Traffic Sample'
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    # Get list of available PCAP files (both uploaded and samples)
    pcap_files = []

    # Add sample files if they exist
    for filename, description in SAMPLE_PCAPS.items():
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(file_path):
            pcap_files.append({
                'filename': filename,
                'description': description,
                'type': 'sample'
            })

    # Add user uploaded files
    for filename in os.listdir(app.config['UPLOAD_FOLDER']):
        if filename not in SAMPLE_PCAPS and allowed_file(filename):
            pcap_files.append({
                'filename': filename,
                'description': 'User uploaded file',
                'type': 'user'
            })

    return render_template('index.html', pcap_files=pcap_files)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        flash('No file part')
        return redirect(request.url)

    file = request.files['file']

    if file.filename == '':
        flash('No selected file')
        return redirect(request.url)

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        flash(f'File {filename} uploaded successfully')
        return redirect(url_for('index'))

    flash('Invalid file type. Only PCAP files are allowed.')
    return redirect(url_for('index'))

@app.route('/analyze/<filename>')
def analyze(filename):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    if not os.path.exists(file_path):
        flash(f'File {filename} not found')
        return redirect(url_for('index'))

    return render_template('analyze.html', filename=filename)

@app.route('/api/packets/<filename>')
def get_packets(filename):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    # Get filter parameters
    protocol_filter = request.args.get('protocol', None)
    ip_filter = request.args.get('ip', None)
    port_filter = request.args.get('port', None)

    # Analyze the PCAP file
    packets = analyze_pcap(file_path, protocol_filter, ip_filter, port_filter)

    return jsonify(packets)

@app.route('/api/packet_details/<filename>/<int:packet_index>')
def packet_details(filename, packet_index):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    # Get detailed information for a specific packet
    details = get_packet_details(file_path, packet_index)

    return jsonify(details)

@app.route('/download_sample/<filename>')
def download_sample(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
