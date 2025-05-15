// test-specific-import.js
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log the available files in the package
const sdkPath = __dirname + '/node_modules/@modelcontextprotocol/sdk';
console.log('Files in SDK package:');
fs.readdirSync(sdkPath).forEach(file => {
  console.log('  ' + file);
});

// If dist directory exists, check that too
if (fs.existsSync(sdkPath + '/dist')) {
  console.log('Files in dist directory:');
  fs.readdirSync(sdkPath + '/dist').forEach(file => {
    console.log('  ' + file);
  });

  // Check if there's an ESM folder
  if (fs.existsSync(sdkPath + '/dist/esm')) {
    console.log('Files in dist/esm:');
    fs.readdirSync(sdkPath + '/dist/esm').forEach(file => {
      console.log('  ' + file);
    });
  }
}

// Try to find and read package.json
if (fs.existsSync(sdkPath + '/package.json')) {
  const packageJson = JSON.parse(fs.readFileSync(sdkPath + '/package.json', 'utf8'));
  console.log('Package main entry:', packageJson.main);
  console.log('Package exports:', packageJson.exports);
  console.log('Package module:', packageJson.module);
}