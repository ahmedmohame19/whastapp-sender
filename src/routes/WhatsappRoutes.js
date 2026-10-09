import express from 'express';

import { 
import { createRequire } from 'module';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var module = { exports: {} };

const require = createRequire(import.meta.url);

  startWhatsAppService, 

  getWhatsAppQR, 

  getWhatsAppStatus,

  listSheets,

  sendMessages,

  sendStatus,

  previewPhones

} from '../controllers/WhatsappController.js';



const router = express.Router();



// Start WhatsApp service

router.post('/start', startWhatsAppService);



// Get QR code for authentication

router.get('/qr', getWhatsAppQR);



// Get service status

router.get('/status', getWhatsAppStatus);



// List available sheets in the Excel file

router.get('/sheets', listSheets);



// Preview phone numbers from Excel (?sheet=SheetName)

router.get('/preview-phones', previewPhones);



// Send bulk messages ({ "message": "...", "sheet": "SheetName" })

router.post('/send-messages', sendMessages);



// Get bulk-send progress

router.get('/send-status', sendStatus);



export default router;
