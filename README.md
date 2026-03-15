# WhatsApp Verification Service

This is a standalone WhatsApp service that handles phone number verification for your main project. It communicates with your main project via REST APIs.

## Features

- WhatsApp Web.js integration for automated messaging
- Phone number verification via WhatsApp
- REST API endpoints for service management
- QR code generation for WhatsApp authentication
- Integration with main project via APIs

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3001

# Database Configuration (if needed)
MONGODB_URI=mongodb://127.0.0.1:27017/gp-doctor

# JWT Configuration
secretkey=your-secret-key-here

# Main Project API Configuration
MAIN_PROJECT_API_URL=http://localhost:3000/api
MAIN_PROJECT_API_TOKEN=your-api-token-here

# WhatsApp Web.js Configuration (optional)
WWEBJS_EXECUTABLE_PATH=/path/to/chrome/executable
```

### 3. Main Project API Endpoints

Your main project should expose the following API endpoints:

- `GET /api/students?mobileNo={phone}` - Find student by phone number
- `GET /api/student-verifications?studentId={id}` - Get student verification record
- `PUT /api/students/{id}` - Update student information
- `PUT /api/student-verifications/{id}` - Update verification record

### 4. Start the Service

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

## API Endpoints

### WhatsApp Service Management

- `POST /api/whatsapp/start` - Start the WhatsApp service
- `GET /api/whatsapp/qr` - Get QR code for WhatsApp authentication
- `GET /api/whatsapp/status` - Get service status

## Usage

1. **Start the service**: Call `POST /api/whatsapp/start`
2. **Get QR code**: Call `GET /api/whatsapp/qr` and scan the QR code with WhatsApp
3. **Check status**: Call `GET /api/whatsapp/status` to verify the service is ready
4. **Automatic verification**: The service will automatically handle incoming verification codes

## How It Works

1. When a user requests verification in your main app, create a verification record
2. The WhatsApp service monitors for incoming messages
3. When a user sends a verification code via WhatsApp, the service:
   - Validates the code format
   - Checks if the user exists in your main project
   - Verifies the code matches and hasn't expired
   - Updates the verification status via API
   - Sends confirmation message back to user

## Error Handling

The service includes comprehensive error handling:
- Invalid phone numbers
- Expired verification codes
- Missing user accounts
- API communication failures
- WhatsApp connection issues

## Security

- All API calls to your main project require authentication
- Phone numbers are validated and normalized
- Verification codes have a 30-minute expiration
- Duplicate phone number verification is prevented

## Troubleshooting

### Common Issues

1. **QR Code not appearing**: Make sure the service is started and check the logs
2. **API connection failed**: Verify the `MAIN_PROJECT_API_URL` and `MAIN_PROJECT_API_TOKEN`
3. **WhatsApp disconnection**: The service will automatically reconnect
4. **Chrome executable issues**: Set `WWEBJS_EXECUTABLE_PATH` if needed

### Logs

Check the console output for detailed logs about:
- WhatsApp connection status
- QR code generation
- Message processing
- API communication
- Error details
