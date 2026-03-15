import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function findChrome() {
  console.log('Searching for Chrome installation...\n');
  
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
  ];

  // Check if chrome is in PATH
  try {
    const { stdout } = await execAsync('where chrome');
    console.log('✅ Chrome found in PATH:');
    console.log(stdout.trim());
    console.log('\nYou can use this path in your .env file:');
    console.log('CHROME_PATH=' + stdout.trim().split('\n')[0]);
  } catch (error) {
    console.log('❌ Chrome not found in PATH');
  }

  console.log('\nChecking common installation paths:');
  
  for (const path of possiblePaths) {
    try {
      await execAsync(`dir "${path}"`);
      console.log(`✅ Chrome found at: ${path}`);
      console.log('You can use this path in your .env file:');
      console.log(`CHROME_PATH=${path}`);
      return;
    } catch (error) {
      console.log(`❌ Not found: ${path}`);
    }
  }

  console.log('\n❌ Chrome not found in common locations.');
  console.log('Please install Google Chrome or provide the correct path manually.');
}

findChrome().catch(console.error);
