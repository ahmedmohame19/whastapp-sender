import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import dotenv from 'dotenv';
import qrcode from 'qrcode-terminal';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Egyptian phone number regex:
// Accepts: +201XXXXXXXXX, 201XXXXXXXXX, 01XXXXXXXXX, 1XXXXXXXXX
// Second digit after 01 must be 0, 1, 2, or 5 (Vodafone, Etisalat, Orange, WE)
const EGYPT_PHONE_REGEX = /^(?:\+?2?0?)(1[0125]\d{8})$/;

function normalizeEgyptianNumber(raw) {
  const cleaned = String(raw).replace(/[\s\-().]/g, '');
  const match = cleaned.match(EGYPT_PHONE_REGEX);
  if (!match) return null;
  return `+20${match[1]}`;
}

let client;
let lastQr = null;
let ready = false;
let sendingInProgress = false;
let sendingStatus = { total: 0, sent: 0, failed: 0, errors: [], current: null };

function start() {
  if (client) {
    console.log('[DEBUG] WhatsApp client already exists, returning existing instance');
    return client;
  }

  console.log('[DEBUG] Creating new WhatsApp client...');
  console.log('[DEBUG] CHROME_PATH from env:', process.env.CHROME_PATH);

  const puppeteerConfig = {
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--disable-gpu'
    ],
  };

  if (process.env.CHROME_PATH) {
    puppeteerConfig.executablePath = process.env.CHROME_PATH;
    console.log('[DEBUG] Using Chrome at:', puppeteerConfig.executablePath);
  } else {
    console.log('[DEBUG] No CHROME_PATH set, using Puppeteer default');
  }

  client = new Client({
    authStrategy: new LocalAuth({ clientId: 'medflix' }),
    puppeteer: puppeteerConfig
  });

  client.on('qr', qr => {
    lastQr = qr;
    ready = false;
    console.log('[DEBUG] QR code generated. Scan this with WhatsApp:');
    qrcode.generate(qr, { small: true });
  });

  client.on('authenticated', () => {
    console.log('[DEBUG] Authenticated with WhatsApp.');
    lastQr = null;

    // Poll until WWebJS (getChat, sendMessage) is injected - required for sending
    const pollStart = Date.now();
    const POLL_MAX_MS = 120000; // 2 minutes
    const checkInterval = setInterval(async () => {
      if (ready) {
        clearInterval(checkInterval);
        return;
      }
      if (Date.now() - pollStart > POLL_MAX_MS) {
        clearInterval(checkInterval);
        console.error('[DEBUG] WWebJS never became ready. Try: 1) Stop the app, 2) Delete folders .wwebjs_cache and .wwebjs_auth, 3) Restart and scan QR again.');
        return;
      }
      try {
        if (client && client.pupPage) {
          const wwebReady = await client.pupPage.evaluate(() => {
            const w = window.WWebJS;
            if (!w) return { ok: false, detail: 'WWebJS not injected' };
            if (typeof w.getChat !== 'function') return { ok: false, detail: 'WWebJS.getChat not ready' };
            if (typeof w.sendMessage !== 'function') return { ok: false, detail: 'WWebJS.sendMessage not ready' };
            return { ok: true, detail: 'WWebJS ready for send' };
          });
          if (wwebReady.ok) {
            console.log('[DEBUG] WWebJS ready for sending. Waiting 5s for stability...');
            clearInterval(checkInterval);
            setTimeout(() => {
              ready = true;
              lastQr = null;
              console.log('[DEBUG] WhatsApp client is ready and fully operational.');
            }, 5000);
          } else {
            console.log(`[DEBUG] Waiting for WhatsApp injection... ${wwebReady.detail}`);
          }
        }
      } catch (e) {
        // Page not ready yet, keep polling
      }
    }, 5000);
  });

  client.on('ready', () => {
    ready = true;
    lastQr = null;
    console.log('[DEBUG] WhatsApp client is ready and connected!');
  });

  client.on('auth_failure', msg => {
    console.error('[DEBUG] Auth failure:', msg);
    ready = false;
  });

  client.on('disconnected', (reason) => {
    console.log('[WARN] Client disconnected:', reason);
    ready = false;
    lastQr = null;

    console.log('[INFO] Attempting to reconnect in 10 seconds...');
    setTimeout(() => {
      if (client) {
        console.log('[INFO] Reconnecting WhatsApp client...');
        client.initialize().catch(err => {
          console.error('[DEBUG] Reconnection error:', err);
        });
      }
    }, 10000);
  });

  console.log('[DEBUG] Initializing WhatsApp client...');
  client.initialize().catch(err => {
    console.error('[DEBUG] Initialization error:', err);
    ready = false;
  });

  return client;
}

function getSheetNames() {
  const filePath = path.join(PROJECT_ROOT, 'csv', 'Applicants.xlsx');
  const workbook = XLSX.readFile(filePath);
  return workbook.SheetNames;
}

function readPhonesFromExcel(sheetName = null) {
  const filePath = path.join(PROJECT_ROOT, 'csv', 'Applicants.xlsx');
  const workbook = XLSX.readFile(filePath);

  const selectedSheet = sheetName || workbook.SheetNames[0];

  if (!workbook.SheetNames.includes(selectedSheet)) {
    throw new Error(`Sheet "${selectedSheet}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
  }

  const sheet = workbook.Sheets[selectedSheet];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const results = { valid: [], invalid: [], sheetName: selectedSheet };

  for (const row of rows) {
    const rawPhone = row.phone || row.Phone || row.PHONE;
    if (!rawPhone) {
      results.invalid.push({ raw: rawPhone, reason: 'Missing phone field' });
      continue;
    }

    const normalized = normalizeEgyptianNumber(rawPhone);
    if (!normalized) {
      results.invalid.push({ raw: String(rawPhone), reason: 'Not a valid Egyptian number (+20 1X XXXX XXXX)' });
      continue;
    }

    const name = row.name || row.Name || row.NAME || row['Full Name'] || row['full name'] || '';
    results.valid.push({ raw: String(rawPhone), normalized, name: String(name).trim() });
  }

  return results;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendBulkMessages(message, sheetName = null, delayMinutes = 1) {
  if (!ready || !client) {
    throw new Error('WhatsApp client is not ready. Please scan the QR code first.');
  }

  if (sendingInProgress) {
    throw new Error('A bulk send is already in progress. Check /api/whatsapp/send-status for details.');
  }

  const phones = readPhonesFromExcel(sheetName);

  if (phones.valid.length === 0) {
    return {
      success: false,
      message: 'No valid Egyptian phone numbers found in the Excel file.',
      invalid: phones.invalid
    };
  }

  sendingInProgress = true;
  sendingStatus = {
    total: phones.valid.length,
    sent: 0,
    failed: 0,
    errors: [],
    invalid: phones.invalid,
    current: null,
    startedAt: new Date().toISOString()
  };

  // Run sending in background so the API responds immediately
  (async () => {
    const DELAY_MS = delayMinutes * 60 * 1000;

    for (let i = 0; i < phones.valid.length; i++) {
      const entry = phones.valid[i];
      const chatId = entry.normalized.replace('+', '') + '@c.us';
      sendingStatus.current = `${i + 1}/${phones.valid.length} - ${entry.normalized}`;

      try {
        const personalMessage = entry.name
          ? `${entry.name}\n${message}`
          : message;
        console.log(`[SEND ${i + 1}/${phones.valid.length}] Sending to ${entry.normalized} (${entry.name || 'no name'})...`);
        await client.sendMessage(chatId, personalMessage);
        sendingStatus.sent++;
        console.log(`[SEND ${i + 1}/${phones.valid.length}] Sent successfully to ${entry.normalized}`);
      } catch (err) {
        sendingStatus.failed++;
        sendingStatus.errors.push({ phone: entry.normalized, error: err.message });
        console.error(`[SEND ${i + 1}/${phones.valid.length}] Failed for ${entry.normalized}: ${err.message}`);
      }

      // Wait 1 minute before sending the next message (skip delay after last message)
      if (i < phones.valid.length - 1) {
        console.log(`[SEND] Waiting ${delayMinutes} minute(s) before next message...`);
        await sleep(DELAY_MS);
      }
    }

    sendingStatus.current = null;
    sendingStatus.finishedAt = new Date().toISOString();
    sendingInProgress = false;
    console.log(`[SEND] Bulk send completed. Sent: ${sendingStatus.sent}, Failed: ${sendingStatus.failed}`);
  })();

  return {
    success: true,
    message: `Started sending messages to ${phones.valid.length} valid Egyptian numbers. Delay: ${delayMinutes} minute(s) between each message.`,
    totalValid: phones.valid.length,
    totalInvalid: phones.invalid.length,
    invalid: phones.invalid,
    delayMinutes,
    estimatedTime: `~${(phones.valid.length - 1) * delayMinutes} minutes`
  };
}

function getSendingStatus() {
  return {
    inProgress: sendingInProgress,
    ...sendingStatus
  };
}

function getLastQr() { return lastQr; }
function isReady() { return ready; }

// Auto-start
let autoStarted = false;
if (process.env.AUTO_START_WHATSAPP !== 'false' && !autoStarted) {
  console.log('Auto-starting WhatsApp service...');
  autoStarted = true;
  setTimeout(() => {
    console.log('[INFO] Starting WhatsApp client...');
    start();
  }, 5000);
}

export { start, getLastQr, isReady, sendBulkMessages, getSendingStatus, readPhonesFromExcel, getSheetNames };
