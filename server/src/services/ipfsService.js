/**
 * IPFS Service
 * Generates NFT art with Gemini AI + uploads to Pinata IPFS
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createCanvas } from 'canvas';
import axios from 'axios';
import FormData from 'form-data';

let genAI = null;

function getGenAI() {
  if (!genAI && process.env.VITE_GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Upload a buffer to Pinata IPFS
 */
async function uploadToPinata(buffer, filename) {
  const jwt = process.env.PINATA_JWT;

  if (!jwt) {
    console.warn('PINATA_JWT not set');
    return null;
  }

  const formData = new FormData();
  formData.append('file', buffer, { filename });

  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${jwt}`
        }
      }
    );

    const cid = response.data.IpfsHash;
    console.log(`✅ Uploaded to IPFS: ${cid}`);
    return `ipfs://${cid}`;
  } catch (error) {
    console.error('Pinata upload failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Upload JSON metadata to Pinata
 */
async function uploadJsonToPinata(metadata) {
  const jwt = process.env.PINATA_JWT;

  if (!jwt) {
    console.warn('PINATA_JWT not set');
    return null;
  }

  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      }
    );

    const cid = response.data.IpfsHash;
    console.log(`✅ Metadata uploaded to IPFS: ${cid}`);
    return `ipfs://${cid}`;
  } catch (error) {
    console.error('Pinata JSON upload failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Try to generate art with Gemini AI
 */
async function generateWithGemini(co2Offset, donationAmount) {
  const ai = getGenAI();
  if (!ai) {
    console.log('Gemini API key not configured');
    return null;
  }

  try {
    console.log('🎨 Attempting Gemini image generation...');
    const model = ai.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseModalities: ['text', 'image']
      }
    });

    const prompt = `Generate a beautiful, artistic digital illustration for an environmental NFT certificate.
Style: Modern digital art, vibrant colors, nature-inspired
Theme: Celebrating ${co2Offset}kg of CO2 offset through a $${donationAmount} environmental donation
Elements to include: Abstract representation of nature, leaves, earth, sustainability
Colors: Greens, teals, blues, earth tones
Important: Create ARTWORK only, no text whatsoever. Pure visual art.`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log('✅ Gemini generated image successfully!');
          return Buffer.from(part.inlineData.data, 'base64');
        }
      }
    }

    console.log('No image in Gemini response');
    return null;
  } catch (error) {
    console.error('Gemini image generation error:', error.message);
    return null;
  }
}

/**
 * Generate clean eco-themed NFT art
 */
export async function generateCertificateImage({ userName, donationAmount, co2Offset, ngoName }) {
  const width = 800;
  const height = 800;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Beautiful gradient sky background
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#0ea5e9');    // Sky blue
  skyGradient.addColorStop(0.4, '#22d3ee');  // Cyan
  skyGradient.addColorStop(0.7, '#a7f3d0');  // Light green
  skyGradient.addColorStop(1, '#059669');    // Emerald
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  // Sun/glow in upper area
  const sunGradient = ctx.createRadialGradient(600, 150, 0, 600, 150, 200);
  sunGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  sunGradient.addColorStop(0.3, 'rgba(253, 224, 71, 0.6)');
  sunGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGradient;
  ctx.fillRect(0, 0, width, 400);

  // Rolling hills in background
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(0, 600);
  ctx.quadraticCurveTo(200, 500, 400, 550);
  ctx.quadraticCurveTo(600, 600, 800, 520);
  ctx.lineTo(800, 800);
  ctx.lineTo(0, 800);
  ctx.closePath();
  ctx.fill();

  // Closer hill
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.moveTo(0, 700);
  ctx.quadraticCurveTo(250, 600, 500, 650);
  ctx.quadraticCurveTo(700, 700, 800, 640);
  ctx.lineTo(800, 800);
  ctx.lineTo(0, 800);
  ctx.closePath();
  ctx.fill();

  // Simple tree function
  const drawTree = (x, y, scale) => {
    // Trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 8 * scale, y, 16 * scale, 40 * scale);

    // Foliage (3 circles)
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.arc(x, y - 20 * scale, 35 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 25 * scale, y + 5 * scale, 30 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 25 * scale, y + 5 * scale, 30 * scale, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw trees
  drawTree(100, 620, 1.2);
  drawTree(250, 580, 0.8);
  drawTree(680, 550, 1.5);
  drawTree(550, 600, 0.9);

  // Earth globe in center
  const cx = 400, cy = 350, r = 120;

  // Globe shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.beginPath();
  ctx.ellipse(cx + 10, cy + 130, r * 0.8, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ocean (base)
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Continents (simplified)
  ctx.fillStyle = '#22c55e';
  // Americas-ish
  ctx.beginPath();
  ctx.ellipse(cx - 40, cy - 20, 35, 50, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Europe/Africa-ish
  ctx.beginPath();
  ctx.ellipse(cx + 50, cy, 30, 60, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Globe shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(cx - 40, cy - 40, 30, 20, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Floating leaves around globe
  ctx.fillStyle = '#16a34a';
  const drawLeaf = (x, y, angle, size) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 2, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawLeaf(cx - 160, cy - 80, 0.5, 15);
  drawLeaf(cx + 170, cy - 60, -0.4, 12);
  drawLeaf(cx - 140, cy + 100, 0.8, 10);
  drawLeaf(cx + 150, cy + 80, -0.6, 14);
  drawLeaf(cx - 50, cy - 160, 0.2, 11);
  drawLeaf(cx + 80, cy + 150, -0.3, 13);

  ctx.globalAlpha = 1;

  // Convert to buffer and upload
  const buffer = canvas.toBuffer('image/png');
  console.log(`✅ Generated certificate image (${buffer.length} bytes)`);

  const ipfsUrl = await uploadToPinata(buffer, `ecoscore-cert-${Date.now()}.png`);

  if (ipfsUrl) {
    return ipfsUrl;
  }

  // Fallback to placeholder
  return 'https://placehold.co/400x500/22c55e/white?text=Ecoscore+NFT';
}

/**
 * Upload an image buffer to IPFS
 */
export async function uploadImage(imageBuffer, filename = 'certificate.png') {
  if (!imageBuffer) {
    return 'https://placehold.co/400x500/22c55e/white?text=Ecoscore+NFT';
  }

  const ipfsUrl = await uploadToPinata(imageBuffer, filename);
  return ipfsUrl || 'https://placehold.co/400x500/22c55e/white?text=Ecoscore+NFT';
}

/**
 * Upload NFT metadata to IPFS
 */
export async function uploadMetadata(metadata) {
  const ipfsUrl = await uploadJsonToPinata(metadata);

  if (ipfsUrl) {
    return ipfsUrl;
  }

  // Fallback
  const base64 = Buffer.from(JSON.stringify(metadata)).toString('base64');
  return `data:application/json;base64,${base64}`;
}

/**
 * Convert IPFS URL to HTTP gateway URL
 * Using Pinata's dedicated gateway for reliable access
 */
export function ipfsToHttp(ipfsUrl) {
  if (!ipfsUrl) return null;
  if (ipfsUrl.startsWith('https://')) return ipfsUrl;
  if (ipfsUrl.startsWith('http://')) return ipfsUrl;
  if (ipfsUrl.startsWith('data:')) return ipfsUrl;
  if (ipfsUrl.startsWith('ipfs://')) {
    const cid = ipfsUrl.replace('ipfs://', '');
    // Use ipfs.io - most compatible with Solana Explorer
    return `https://ipfs.io/ipfs/${cid}`;
  }
  return ipfsUrl;
}

export default {
  generateCertificateImage,
  uploadImage,
  uploadMetadata,
  ipfsToHttp
};
