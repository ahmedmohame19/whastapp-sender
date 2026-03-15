import { start, getLastQr, isReady, sendBulkMessages, getSendingStatus, readPhonesFromExcel, getSheetNames } from '../services/WhatsappService.js';
import { ErrorCatch } from '../utils/ErrorCatch.js';

export const startWhatsAppService = ErrorCatch(async (req, res) => {
  try {
    start();
    res.json({ 
      success: true, 
      message: 'WhatsApp service started successfully',
      status: 'starting'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start WhatsApp service',
      error: error.message 
    });
  }
});

export const getWhatsAppQR = ErrorCatch(async (req, res) => {
  try {
    const qr = getLastQr();
    const readyState = isReady();
    
    if (readyState) {
      return res.json({ 
        success: true, 
        status: 'ready',
        message: 'WhatsApp is already authenticated and ready'
      });
    }
    
    if (!qr) {
      return res.json({ 
        success: false, 
        status: 'no_qr',
        message: 'No QR code available. Please start the service first.'
      });
    }
    
    res.json({ 
      success: true, 
      status: 'qr_available',
      qr: qr,
      message: 'QR code available for scanning'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get QR code',
      error: error.message 
    });
  }
});

export const getWhatsAppStatus = ErrorCatch(async (req, res) => {
  try {
    const readyState = isReady();
    const qr = getLastQr();
    
    res.json({ 
      success: true, 
      status: readyState ? 'ready' : (qr ? 'qr_available' : 'not_started'),
      ready: readyState,
      hasQr: !!qr,
      message: readyState ? 'WhatsApp is ready' : (qr ? 'QR code available' : 'Service not started')
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get status',
      error: error.message 
    });
  }
});

export const listSheets = ErrorCatch(async (req, res) => {
  try {
    const sheets = getSheetNames();
    res.json({
      success: true,
      sheets,
      message: `Found ${sheets.length} sheet(s). Use "sheet" parameter to select one.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to read Excel file',
      error: error.message
    });
  }
});

export const sendMessages = ErrorCatch(async (req, res) => {
  try {
    const { message, sheet, delay } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required. Send { "message": "...", "sheet": "Sheet1", "delay": 1 } in the body. Delay is in minutes.'
      });
    }

    const delayMinutes = delay && Number(delay) > 0 ? Number(delay) : 1;

    const result = await sendBulkMessages(message.trim(), sheet || null, delayMinutes);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export const sendStatus = ErrorCatch(async (req, res) => {
  const status = getSendingStatus();
  res.json({ success: true, ...status });
});

export const previewPhones = ErrorCatch(async (req, res) => {
  try {
    const sheet = req.query.sheet || null;
    const phones = readPhonesFromExcel(sheet);
    res.json({
      success: true,
      sheetName: phones.sheetName,
      totalValid: phones.valid.length,
      totalInvalid: phones.invalid.length,
      valid: phones.valid,
      invalid: phones.invalid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
