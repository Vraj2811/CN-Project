from flask import Flask, render_template, request, jsonify
from dns_resolver import resolve_domain, get_record_types, run_nslookup

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/resolve', methods=['GET', 'POST'])
def resolve():
    if request.method == 'POST':
        domain = request.form.get('domain')
        record_type = request.form.get('record_type', 'A')
        query_mode = request.form.get('query_mode', 'recursive')
    else:  # GET
        domain = request.args.get('domain')
        record_type = request.args.get('record_type', 'A')
        query_mode = request.args.get('query_mode', 'recursive')

    if not domain:
        return jsonify({'error': 'Domain name is required'}), 400

    try:
        results = resolve_domain(domain, record_type, query_mode)
        return render_template('results.html', domain=domain, record_type=record_type, results=results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/record-types')
def record_types():
    return jsonify(get_record_types())

@app.route('/api/nslookup', methods=['POST'])
def api_nslookup():
    data = request.json
    domain = data.get('domain')
    record_type = data.get('record_type', 'A')
    query_mode = data.get('query_mode', 'recursive')

    if not domain:
        return jsonify({'error': 'Domain name is required'}), 400

    return jsonify(run_nslookup(domain, record_type, query_mode))

if __name__ == '__main__':
    app.run(port = 5000,debug=True)
