#!/usr/bin/env node

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the landing.html file
const htmlPath = path.join(__dirname, 'landing.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// Create a temporary HTML file with embedded styles
const tempHtmlPath = path.join(__dirname, 'temp-pdf.html');
fs.writeFileSync(tempHtmlPath, htmlContent);

console.log('✅ HTML file prepared');
console.log('Note: To generate a proper PDF with all styling:');
console.log('  1. Open http://192.168.1.175:3000/ in a browser');
console.log('  2. Press Ctrl+P (Cmd+P on Mac)');
console.log('  3. Save as PDF');
console.log('  4. This will capture all animations and styling perfectly');

// Clean up
fs.unlinkSync(tempHtmlPath);
