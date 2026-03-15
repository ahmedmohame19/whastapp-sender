# WhatsApp Service Setup Guide

## Quick Fix for Chrome Error

The error you're seeing is because WhatsApp Web.js can't find Chrome. Here are the solutions:

### Option 1: Install Google Chrome (Recommended)
1. Download and install Google Chrome from https://www.google.com/chrome/
2. Make sure it's added to your system PATH
3. Restart your terminal/command prompt
4. Try running the service again

### Option 2: Set Chrome Path Manually
1. Find your Chrome installation path (usually `C:\Program Files\Google\Chrome\Application\chrome.exe`)
2. Create a `.env` file in the project root with:
   ```
   CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
   PORT=3001
   AUTO_START_WHATSAPP=true
   ```

### Option 3: Use System Chrome
If Chrome is already installed but not in PATH:
1. Open Command Prompt as Administrator
2. Run: `where chrome` to find Chrome path
3. Add that path to your system PATH environment variable
4. Restart terminal and try again

## Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=3001

# Database Configuration (if needed)
MONGODB_URI=mongodb://127.0.0.1:27017/gp-doctor

# JWT Configuration
secretkey=your-secret-key-here

# Main Project API Configuration
MAIN_PROJECT_API_URL=http://localhost:3000/api
WHATSAPP_API_TOKEN=your-default-token

# Chrome Configuration (set this if Chrome is not in PATH)
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe

# Auto-start WhatsApp service
AUTO_START_WHATSAPP=true
```

## API Integration

The WhatsApp service communicates with your main project via these API endpoints:

### Required API Endpoints in Your Main Project:

1. **Find Student by Phone**
   - `GET /api/students?mobileNo={phone}`
   - Headers: `Authorization: Bearer {WHATSAPP_API_TOKEN}`

2. **Find Student Verification**
   - `GET /api/student-verifications?studentId={id}`
   - Headers: `Authorization: Bearer {WHATSAPP_API_TOKEN}`

3. **Update Student**
   - `PUT /api/students/{id}`
   - Headers: `Authorization: Bearer {WHATSAPP_API_TOKEN}`
   - Body: `{ "phoneVerified": true }`

4. **Update Student Verification**
   - `PUT /api/student-verifications/{id}`
   - Headers: `Authorization: Bearer {WHATSAPP_API_TOKEN}`
   - Body: `{ "verificationStatus": "verified", "verifiedAt": "2024-01-01T00:00:00.000Z" }`

5. **Find Verified Students by Phone**
   - `GET /api/verified-students?mobileNo={phone}&phoneVerified=true&excludeId={id}`
   - Headers: `Authorization: Bearer {WHATSAPP_API_TOKEN}`

## Testing the Service

1. Start the service: `npm start`
2. Check the console for QR code
3. Scan QR code with WhatsApp
4. Test API endpoints:
   - `GET http://localhost:3001/api/whatsapp/status`
   - `GET http://localhost:3001/api/whatsapp/qr`

## Troubleshooting

### Common Issues:
1. **Chrome not found**: Install Chrome or set CHROME_PATH
2. **Permission denied**: Run as administrator
3. **Antivirus blocking**: Temporarily disable antivirus
4. **Port already in use**: Change PORT in .env file
5. **API connection failed**: Check MAIN_PROJECT_API_URL and WHATSAPP_API_TOKEN

### Alternative Solutions:
- Use a different browser executable
- Run in non-headless mode for debugging
- Check Windows Defender settings
