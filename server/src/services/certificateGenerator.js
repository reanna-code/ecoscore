/**
 * Certificate Image Generator
 * Creates impact certificate images server-side using canvas
 */

import { createCanvas, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Certificate dimensions (Instagram-friendly square)
const WIDTH = 1080;
const HEIGHT = 1080;

/**
 * Generate an impact certificate image
 * @param {Object} data - Certificate data
 * @returns {Buffer} PNG image buffer
 */
export async function generateCertificateImage(data) {
  const {
    userName = 'Eco Champion',
    donationAmount = 0,
    co2Offset = 0,
    ngoName = null,
    txSignature = null,
    date = new Date()
  } = data;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#059669');   // green-600
  gradient.addColorStop(0.5, '#10b981'); // emerald-500
  gradient.addColorStop(1, '#14b8a6');   // teal-500
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Inner white card
  const cardMargin = 40;
  const cardRadius = 32;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, cardMargin, cardMargin, WIDTH - cardMargin * 2, HEIGHT - cardMargin * 2, cardRadius);
  ctx.fill();

  // Globe emoji (using text since we can't load custom fonts easily)
  ctx.font = '80px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌍', WIDTH / 2, 160);

  // Title
  ctx.fillStyle = '#1f2937'; // gray-800
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('ECOSCORE IMPACT', WIDTH / 2, 240);

  // Decorative line
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 80, 270);
  ctx.lineTo(WIDTH / 2 + 80, 270);
  ctx.stroke();

  // User name
  ctx.fillStyle = '#6b7280'; // gray-500
  ctx.font = '32px sans-serif';
  ctx.fillText(`${userName} helped offset`, WIDTH / 2, 360);

  // CO2 amount (big number)
  ctx.fillStyle = '#059669'; // green-600
  ctx.font = 'bold 120px sans-serif';
  ctx.fillText(`${co2Offset}`, WIDTH / 2, 500);

  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('kg CO₂', WIDTH / 2, 570);

  // Donation details box
  ctx.fillStyle = '#f3f4f6'; // gray-100
  roundRect(ctx, 100, 620, WIDTH - 200, 140, 16);
  ctx.fill();

  ctx.fillStyle = '#6b7280';
  ctx.font = '28px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Amount Donated', 140, 670);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`$${donationAmount.toFixed(2)}`, WIDTH - 140, 670);

  if (ngoName) {
    ctx.fillStyle = '#6b7280';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Supporting', 140, 730);

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(ngoName, WIDTH - 140, 730);
  }

  // Verification section
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7c3aed'; // purple-600
  ctx.font = '24px sans-serif';
  ctx.fillText('⛓️ Verified on Solana', WIDTH / 2, 820);

  if (txSignature) {
    ctx.fillStyle = '#9ca3af'; // gray-400
    ctx.font = '18px monospace';
    const shortTx = `${txSignature.slice(0, 12)}...${txSignature.slice(-12)}`;
    ctx.fillText(shortTx, WIDTH / 2, 855);
  }

  // Date
  ctx.fillStyle = '#9ca3af';
  ctx.font = '24px sans-serif';
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  ctx.fillText(dateStr, WIDTH / 2, 910);

  // Branding
  ctx.fillStyle = '#d1d5db'; // gray-300
  ctx.font = '20px sans-serif';
  ctx.fillText('ecoscore.app', WIDTH / 2, 1000);

  // Bottom decorative bar
  ctx.fillStyle = gradient;
  ctx.fillRect(cardMargin, HEIGHT - cardMargin - 8, WIDTH - cardMargin * 2, 8);

  return canvas.toBuffer('image/png');
}

/**
 * Helper to draw rounded rectangles
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default { generateCertificateImage };
