# OSI Model & TCP/IP Stack Simulator

An interactive educational tool built with Flask that visualizes the OSI (Open Systems Interconnection) model and TCP/IP protocol stack, demonstrating network communication processes through animated simulations.

## Features

### OSI & TCP/IP Model Visualization
- **Layer-by-Layer Breakdown**: Detailed information about each layer of both models
- **Interactive Layer Selection**: Click on any layer to view comprehensive details
- **OSI to TCP/IP Mapping**: Visual representation of how OSI layers map to TCP/IP layers
- **PDU & SDU Concepts**: Explanation of Protocol Data Units and Service Data Units
- **Encapsulation Process**: Visualization of how data is encapsulated as it moves down the layers

### Protocol Demonstrations
- **TCP Communication**: Complete lifecycle simulation including three-way handshake, data transfer, and connection termination
- **UDP Communication**: Visualization of connectionless communication with optional packet loss simulation
- **HTTP Request-Response Cycle**: Step-by-step animation of a complete HTTP transaction
- **TCP vs UDP Comparison**: Side-by-side comparison of both transport protocols

### TCP/IP Layer Animation
- **Packet Flow Visualization**: Dedicated animation showing how data packets move through TCP/IP layers
- **Encapsulation & Decapsulation**: Visual representation of headers being added and removed
- **Educational Content**: Detailed explanations of each layer's function and protocols

## Technical Details

### OSI Model Layers
1. **Physical Layer**: Transmission of raw bit streams
2. **Data Link Layer**: Node-to-node data transfer and error detection
3. **Network Layer**: Routing and logical addressing
4. **Transport Layer**: End-to-end communication and flow control
5. **Session Layer**: Session establishment, maintenance, and termination
6. **Presentation Layer**: Data translation, encryption, and compression
7. **Application Layer**: Network services for applications

### TCP/IP Stack Layers
1. **Physical Layer**: Physical transmission medium
2. **Data Link Layer**: Physical addressing and media access
3. **Network Layer**: Logical addressing and routing
4. **Transport Layer**: End-to-end communication
5. **Application Layer**: Application services and protocols

## Implementation

### Backend (Flask)
- **Layer Information**: Comprehensive data about each layer of both models
- **Protocol Simulation**: Backend logic for simulating various network protocols
- **API Endpoints**: JSON responses for dynamic content updates

### Frontend
- **Interactive UI**: User-friendly interface with tabbed navigation
- **Animated Visualizations**: Dynamic animations of network processes
- **Responsive Design**: Bootstrap-based layout for various screen sizes
- **Real-time Updates**: JavaScript-powered updates during simulations

## How to Use

1. Clone the repository:
   ```
   git clone <repository-url>
   cd OSI_Project
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On macOS/Linux

3. **Setup**:
   ```
   pip install -r requirements.txt
   ```

4. **Run the Application**:
   ```
   python app.py
   ```

5. **Access the Simulator**:
   Open your browser and navigate to `http://localhost:5000`

6. **Explore the OSI & TCP/IP Models**:
   - Click on any layer to view detailed information
   - Examine the mapping between OSI and TCP/IP models
   - Learn about PDUs, SDUs, and the encapsulation process

7. **View TCP/IP Layer Animation**:
   - Click the link in the OSI Model tab to open the dedicated animation
   - Start the animation to watch data flow through the layers
   - Observe the encapsulation and decapsulation processes

8. **Simulate TCP Communication**:
   - Navigate to the TCP Communication tab
   - Click "Start TCP Communication" to begin the animation
   - Observe the three-way handshake, data transfer, and connection termination
   - View sequence numbers and TCP packet structure

9. **Explore Other Protocols**:
   - Try the UDP Communication simulation
   - View the HTTP Request-Response cycle
   - Compare TCP and UDP side-by-side

## Educational Value

This simulator serves as an educational tool for:
- Understanding the OSI model and TCP/IP stack
- Visualizing network communication processes
- Learning about various network protocols
- Comprehending encapsulation and decapsulation
- Comparing connection-oriented vs. connectionless protocols

## Requirements

- Python 3.6+
- Flask 2.3.3
- Flask-WTF 1.1.1
- python-dotenv 1.0.0
- Werkzeug 2.3.7
- Modern web browser with JavaScript enabled
- Windows OS

## License

This project is created for educational purposes as part of a computer networks course.
