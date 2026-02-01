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
 * Generate unique art with Gemini AI based on milestone tier
 */
async function generateWithGemini(milestone, badgeName, co2Offset) {
  const ai = getGenAI();
  if (!ai) {
    console.log('Gemini API key not configured');
    return null;
  }

  // Tier-specific themes for Gemini
  const tierThemes = {
    5: 'a tiny seedling sprouting from rich soil, morning dew drops, soft sunrise light, hope and new beginnings',
    25: 'a young sapling with fresh green leaves, gentle breeze, butterflies, growth and progress',
    50: 'a majestic tree with full canopy, birds nesting, dappled sunlight, strength and resilience',
    100: 'an ancient forest guardian tree, mystical atmosphere, fireflies, woodland creatures, wisdom and protection'
  };

  const theme = tierThemes[milestone] || tierThemes[5];

  try {
    console.log(`🎨 Generating ${badgeName} badge art with Gemini...`);
    const model = ai.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseModalities: ['text', 'image']
      }
    });

    const prompt = `Create a beautiful, unique digital illustration for an eco-achievement NFT badge.

Theme: "${badgeName}" - ${theme}
Style: Whimsical digital art, Studio Ghibli inspired, warm and inviting
Mood: Celebratory, hopeful, nature-loving
Colors: Rich greens, warm earth tones, golden highlights, soft sky blues

The image represents offsetting ${co2Offset} kg of CO2 through environmental action.

CRITICAL: Generate ARTWORK ONLY. No text, no words, no letters, no numbers. Pure visual art.
Make it feel magical and personal - this is a unique achievement badge.`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log(`✅ Gemini generated unique ${badgeName} image!`);
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

// Milestone tier configurations
const MILESTONE_THEMES = {
  5: {
    name: 'Seedling',
    bgColors: ['#4ade80', '#22c55e', '#16a34a'],
    accentColor: '#15803d',
    trees: 1
  },
  25: {
    name: 'Sapling',
    bgColors: ['#34d399', '#10b981', '#059669'],
    accentColor: '#047857',
    trees: 3
  },
  50: {
    name: 'Tree',
    bgColors: ['#2dd4bf', '#14b8a6', '#0d9488'],
    accentColor: '#0f766e',
    trees: 5
  },
  100: {
    name: 'Forest Guardian',
    bgColors: ['#22d3ee', '#06b6d4', '#0891b2'],
    accentColor: '#0e7490',
    trees: 8
  }
};

/**
 * Generate milestone badge NFT art
 * Tries Gemini AI first for unique art, falls back to Canvas
 */
export async function generateCertificateImage({ userName, donationAmount, co2Offset, ngoName, milestone, badgeName }) {
  // Get theme based on milestone (default to $5 tier)
  const tier = milestone || donationAmount || 5;
  const theme = MILESTONE_THEMES[tier] || MILESTONE_THEMES[5];
  const finalBadgeName = badgeName || theme.name;

  // Try Gemini AI first for unique artwork
  const geminiImage = await generateWithGemini(tier, finalBadgeName, co2Offset);
  if (geminiImage) {
    const ipfsUrl = await uploadToPinata(geminiImage, `ecoscore-${finalBadgeName.toLowerCase().replace(' ', '-')}-${Date.now()}.png`);
    if (ipfsUrl) {
      return ipfsUrl;
    }
  }

  // Fall back to Canvas generation
  console.log('⚠️ Falling back to Canvas generation...');
  const width = 800;
  const height = 800;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Beautiful gradient background based on tier
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#0ea5e9');    // Sky blue
  skyGradient.addColorStop(0.3, '#22d3ee');  // Cyan
  skyGradient.addColorStop(0.6, theme.bgColors[0]);
  skyGradient.addColorStop(1, theme.bgColors[2]);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  // Sun/glow - larger for higher tiers
  const sunSize = 150 + tier * 0.5;
  const sunGradient = ctx.createRadialGradient(600, 150, 0, 600, 150, sunSize);
  sunGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  sunGradient.addColorStop(0.3, 'rgba(253, 224, 71, 0.7)');
  sunGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGradient;
  ctx.fillRect(0, 0, width, 400);

  // Rolling hills in background
  ctx.fillStyle = theme.bgColors[1];
  ctx.beginPath();
  ctx.moveTo(0, 600);
  ctx.quadraticCurveTo(200, 500, 400, 550);
  ctx.quadraticCurveTo(600, 600, 800, 520);
  ctx.lineTo(800, 800);
  ctx.lineTo(0, 800);
  ctx.closePath();
  ctx.fill();

  // Closer hill
  ctx.fillStyle = theme.bgColors[2];
  ctx.beginPath();
  ctx.moveTo(0, 700);
  ctx.quadraticCurveTo(250, 600, 500, 650);
  ctx.quadraticCurveTo(700, 700, 800, 640);
  ctx.lineTo(800, 800);
  ctx.lineTo(0, 800);
  ctx.closePath();
  ctx.fill();

  // Tree drawing function
  const drawTree = (x, y, scale) => {
    // Trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 8 * scale, y, 16 * scale, 40 * scale);

    // Foliage (3 circles)
    ctx.fillStyle = theme.accentColor;
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

  // Tree positions
  const treePositions = [
    { x: 100, y: 620, scale: 1.2 },
    { x: 700, y: 600, scale: 1.3 },
    { x: 250, y: 580, scale: 0.9 },
    { x: 550, y: 610, scale: 1.0 },
    { x: 680, y: 550, scale: 1.5 },
    { x: 150, y: 560, scale: 0.7 },
    { x: 450, y: 590, scale: 0.8 },
    { x: 350, y: 640, scale: 1.1 }
  ];

  // Draw trees based on milestone tier
  for (let i = 0; i < Math.min(theme.trees, treePositions.length); i++) {
    const pos = treePositions[i];
    drawTree(pos.x, pos.y, pos.scale);
  }

  // Central badge circle
  const cx = 400, cy = 320, r = 140;

  // Badge glow
  const glowGradient = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.5);
  glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Badge background
  const badgeGradient = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  badgeGradient.addColorStop(0, '#ffffff');
  badgeGradient.addColorStop(1, '#f0fdf4');
  ctx.fillStyle = badgeGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Badge border
  ctx.strokeStyle = theme.bgColors[1];
  ctx.lineWidth = 8;
  ctx.stroke();

  // Badge tier icon (simple shapes instead of emoji for canvas compatibility)
  ctx.fillStyle = theme.accentColor;
  if (tier >= 100) {
    // Forest - multiple trees
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 40, cy + 20);
      ctx.lineTo(cx + i * 40 - 25, cy - 30);
      ctx.lineTo(cx + i * 40 + 25, cy - 30);
      ctx.closePath();
      ctx.fill();
    }
  } else if (tier >= 50) {
    // Tree
    ctx.beginPath();
    ctx.moveTo(cx, cy + 30);
    ctx.lineTo(cx - 50, cy - 40);
    ctx.lineTo(cx + 50, cy - 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(cx - 10, cy + 30, 20, 30);
  } else if (tier >= 25) {
    // Sapling - leaf shape
    ctx.beginPath();
    ctx.ellipse(cx, cy - 20, 30, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 5, cy + 25, 10, 35);
  } else {
    // Seedling - small sprout
    ctx.beginPath();
    ctx.ellipse(cx - 15, cy - 20, 20, 35, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 15, cy - 15, 18, 30, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 4, cy + 10, 8, 40);
  }

  // Milestone amount
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = theme.accentColor;
  ctx.fillText(`$${tier}`, cx, cy + 90);

  // Badge name at top
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillStyle = '#374151';
  ctx.fillText(badgeName || theme.name, cx, cy - 90);

  // Floating leaves around badge
  ctx.fillStyle = theme.bgColors[0];
  const drawLeaf = (x, y, angle, size) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 2, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // More leaves for higher tiers
  const leafCount = 3 + Math.floor(tier / 20);
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2;
    const dist = 180 + (i % 3) * 20;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    drawLeaf(x, y, angle + 0.5, 10 + (i % 4) * 3);
  }

  ctx.globalAlpha = 1;

  // Convert to buffer and upload
  const buffer = canvas.toBuffer('image/png');
  console.log(`✅ Generated ${theme.name} badge image (${buffer.length} bytes)`);

  const ipfsUrl = await uploadToPinata(buffer, `ecoscore-${theme.name.toLowerCase().replace(' ', '-')}-badge-${Date.now()}.png`);

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
