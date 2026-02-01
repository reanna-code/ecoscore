/**
 * NFT Minting Service
 * Mints impact certificate NFTs using Metaplex
 */

import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { generateCertificateImage, uploadMetadata, ipfsToHttp } from './ipfsService.js';

let adminKeypair = null;
let metaplex = null;
let connection = null;

const CLUSTER = process.env.SOLANA_CLUSTER || 'devnet';

/**
 * Initialize the NFT service
 */
async function initialize() {
  if (metaplex) return metaplex;

  // Load admin keypair from env variable or file
  try {
    if (process.env.SOLANA_WALLET_KEY) {
      const walletData = JSON.parse(process.env.SOLANA_WALLET_KEY);
      adminKeypair = Keypair.fromSecretKey(Uint8Array.from(walletData));
      console.log('✅ NFT Service: Loaded wallet from SOLANA_WALLET_KEY');
    } else {
      const walletPath = process.env.SOLANA_WALLET_PATH ||
        path.join(process.env.HOME, '.config/solana/ecoscore.json');
      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
      adminKeypair = Keypair.fromSecretKey(Uint8Array.from(walletData));
      console.log('✅ NFT Service: Loaded wallet from file');
    }
  } catch (error) {
    console.error('Failed to load admin wallet for NFT minting:', error.message);
    throw new Error('Admin wallet not configured');
  }

  // Set up connection
  const rpcUrl = CLUSTER === 'devnet'
    ? 'https://api.devnet.solana.com'
    : CLUSTER === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : 'http://127.0.0.1:8899';

  connection = new Connection(rpcUrl, 'confirmed');

  // Set up Metaplex (uses default storage)
  metaplex = Metaplex.make(connection)
    .use(keypairIdentity(adminKeypair));

  console.log(`NFT Service initialized on ${CLUSTER}`);
  console.log(`Admin wallet: ${adminKeypair.publicKey.toString()}`);

  return metaplex;
}

/**
 * Generate a custodial wallet for a user
 * @returns {Object} { publicKey, encryptedPrivateKey }
 */
export function generateUserWallet() {
  const keypair = Keypair.generate();

  // In production, encrypt this properly with a KMS
  // For hackathon, we'll base64 encode (NOT SECURE FOR PRODUCTION)
  const encryptedPrivateKey = Buffer.from(keypair.secretKey).toString('base64');

  return {
    publicKey: keypair.publicKey.toString(),
    encryptedPrivateKey,
    createdAt: new Date()
  };
}

/**
 * Mint an impact certificate NFT
 * @param {Object} options - Minting options
 * @returns {Object} Minting result
 */
export async function mintImpactCertificate(options) {
  const {
    recipientPublicKey,
    userName,
    donationAmount,
    co2Offset,
    ngoName,
    txSignature,
    date = new Date()
  } = options;

  await initialize();

  console.log(`Minting NFT for ${userName} to ${recipientPublicKey}...`);

  // 1. Generate certificate image using Gemini AI
  const imageUri = await generateCertificateImage({
    userName,
    donationAmount,
    co2Offset,
    ngoName
  });

  const imageHttpUrl = ipfsToHttp(imageUri);
  console.log('Certificate image generated:', imageUri.substring(0, 50) + '...');

  // 3. Create metadata
  const metadata = {
    name: `Ecoscore Impact Certificate`,
    symbol: 'ECOIMPACT',
    description: `This certificate verifies that ${userName} donated $${donationAmount.toFixed(2)} to ${ngoName || 'climate organizations'}, helping offset ${co2Offset} kg of CO2. Verified on Solana blockchain.`,
    image: imageHttpUrl || imageUri,
    external_url: 'https://ecoscore.app',
    attributes: [
      { trait_type: 'Donation Amount', value: `$${donationAmount.toFixed(2)}` },
      { trait_type: 'CO2 Offset', value: `${co2Offset} kg` },
      { trait_type: 'NGO', value: ngoName || 'Multiple' },
      { trait_type: 'Date', value: date.toISOString().split('T')[0] },
      { trait_type: 'Verified Transaction', value: txSignature || 'N/A' }
    ],
    properties: {
      category: 'image',
      files: [{
        uri: imageHttpUrl || imageUri,
        type: 'image/png'
      }]
    }
  };

  // 4. Upload metadata to IPFS
  const metadataUri = await uploadMetadata(metadata);
  console.log('Metadata uploaded:', metadataUri);

  // 5. Mint NFT using Metaplex
  const recipientPubkey = new PublicKey(recipientPublicKey);

  try {
    const { nft, response } = await metaplex.nfts().create({
      uri: ipfsToHttp(metadataUri) || metadataUri,
      name: `Ecoscore Impact: $${donationAmount.toFixed(0)}`,
      symbol: 'ECOIMPACT',
      sellerFeeBasisPoints: 0, // No royalties
      tokenOwner: recipientPubkey,
      isMutable: false, // Certificate is permanent
    });

    console.log('NFT minted successfully!');
    console.log('Mint address:', nft.address.toString());
    console.log('TX signature:', response.signature);

    return {
      success: true,
      mintAddress: nft.address.toString(),
      metadataUri: ipfsToHttp(metadataUri),
      imageUri: imageHttpUrl,
      txSignature: response.signature,
      explorerUrl: `https://explorer.solana.com/address/${nft.address.toString()}?cluster=${CLUSTER}`
    };
  } catch (error) {
    console.error('NFT minting failed:', error);
    throw error;
  }
}

/**
 * Get NFTs owned by a wallet
 * @param {string} walletAddress - Wallet public key
 * @returns {Array} List of NFTs
 */
export async function getNftsByOwner(walletAddress) {
  await initialize();

  const owner = new PublicKey(walletAddress);
  const nfts = await metaplex.nfts().findAllByOwner({ owner });

  // Filter to only Ecoscore NFTs
  return nfts.filter(nft =>
    nft.symbol === 'ECOIMPACT' || nft.name?.includes('Ecoscore')
  );
}

export default {
  generateUserWallet,
  mintImpactCertificate,
  getNftsByOwner
};
