import { start, getLastQr, isReady } from './src/services/WhatsappService.js';

console.log('Testing WhatsApp Service...');

// Test the service functions
console.log('Service status:', isReady());
console.log('Last QR:', getLastQr());

// Start the service
console.log('Starting WhatsApp service...');
const client = start();

// Check status after a delay
setTimeout(() => {
  console.log('Service status after start:', isReady());
  console.log('Last QR after start:', getLastQr());
}, 3000);

console.log('Test completed. Check the console for WhatsApp QR code.');
