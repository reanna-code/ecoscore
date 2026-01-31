import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Ngo, Sponsor, Product } from '../models/index.js';

// Load from project root (run from server/ directory)
dotenv.config({ path: '../.env' });

// NGO data with on-chain wallet addresses
const NGOS = [
  {
    name: "Greenpeace",
    walletAddress: "2HtbcEKT9V8jjShwH3WcMwSuBp7bfgAqp2HtV4uR15mQ",
    description: "Global environmental organization campaigning to protect biodiversity and prevent climate change.",
    logoUrl: "/logos/greenpeace.png",
    websiteUrl: "https://www.greenpeace.org",
    categories: ["climate", "ocean", "forest"]
  },
  {
    name: "Environmental Defense Fund (EDF)",
    walletAddress: "9yWJMoRvVwPsajwZacFjiBjzvvzqw3iVXDS9XC9zQspn",
    description: "Finding practical solutions to the most serious environmental problems.",
    logoUrl: "/logos/edf.png",
    websiteUrl: "https://www.edf.org",
    categories: ["climate", "pollution"]
  },
  {
    name: "Friends of the Earth",
    walletAddress: "8GDtDE8WCFjtvfXrDq4tLCxV1VhYBYAiSXaYA3ypgdRA",
    description: "Grassroots environmental network advocating for a healthy, just world.",
    logoUrl: "/logos/foe.png",
    websiteUrl: "https://www.foei.org",
    categories: ["climate", "forest", "pollution"]
  },
  {
    name: "Natural Resources Defense Council (NRDC)",
    walletAddress: "5Uv4CBYY4YUC8P5zoAAAm3Sn6wTRfpLSFmtL4dWhEtC5",
    description: "Safeguarding the earth through science, policy, and law.",
    logoUrl: "/logos/nrdc.png",
    websiteUrl: "https://www.nrdc.org",
    categories: ["climate", "wildlife", "pollution"]
  },
  {
    name: "Veritree",
    walletAddress: "DdszS1TpT1isWSxU1uv8GPdA7qk99cWWTGMvzrwk9bf9",
    description: "Blockchain-verified tree planting and ecosystem restoration.",
    logoUrl: "/logos/veritree.png",
    websiteUrl: "https://www.veritree.com",
    categories: ["forest", "climate"]
  },
  {
    name: "Zero Waste Canada",
    walletAddress: "37HXv5md7zKvPetmEkfYerJzhM7P8YkB6pCiFGkoGUXV",
    description: "Working towards a zero waste future in Canada through education and advocacy.",
    logoUrl: "/logos/zerowaste.png",
    websiteUrl: "https://www.zerowastecanada.ca",
    categories: ["pollution", "education"]
  }
];

// Sponsor data with on-chain wallet addresses
const SPONSORS = [
  {
    name: "Patagonia",
    walletAddress: "9iqBJDjKGcpEE1sEKb8NUb3FQ6QFkHUWtJe3qCtyj3jk",
    description: "Outdoor clothing and gear company committed to environmental responsibility.",
    logoUrl: "/logos/patagonia.png",
    websiteUrl: "https://www.patagonia.com",
    categories: ["clothing", "accessories"]
  },
  {
    name: "Allbirds",
    walletAddress: "6ATQXUjA1PXLw1WTyu9squHBHT9o5CcbchkAUu9j8tFi",
    description: "Sustainable footwear made from natural materials.",
    logoUrl: "/logos/allbirds.png",
    websiteUrl: "https://www.allbirds.com",
    categories: ["footwear"]
  },
  {
    name: "Tentree",
    walletAddress: "3W2x6SizskpYCwWtcwmPQHL9sVco2QbsFbzXq7ztEdQS",
    description: "Sustainable apparel brand that plants 10 trees for every item purchased.",
    logoUrl: "/logos/tentree.png",
    websiteUrl: "https://www.tentree.com",
    categories: ["clothing", "accessories"]
  },
  {
    name: "Girlfriend Collective",
    walletAddress: "Bz3kRAHQo3hfayeuhiToEPWBEnUwh7X7ZPghNUP5E5Xr",
    description: "Sustainable activewear made from recycled materials.",
    logoUrl: "/logos/girlfriend.png",
    websiteUrl: "https://www.girlfriend.com",
    categories: ["clothing"]
  },
  {
    name: "Pela Case",
    walletAddress: "FfdkzLx7j7sD9xwzNxxihnqCpjHVTpdFzZGnKdajrbT1",
    description: "Compostable phone cases and accessories.",
    logoUrl: "/logos/pela.png",
    websiteUrl: "https://www.pelacase.com",
    categories: ["accessories", "electronics"]
  },
  {
    name: "Seventh Generation",
    walletAddress: "29bGVfbQiYkTkEmpRDipQFsgT25Vw73tPPtQkXidLGiL",
    description: "Plant-based cleaning and personal care products.",
    logoUrl: "/logos/seventh.png",
    websiteUrl: "https://www.seventhgeneration.com",
    categories: ["home", "personal-care"]
  },
  {
    name: "Tom's of Maine",
    walletAddress: "B1baCLc4S8Hnt83nFuFUV4BcBChd3w8V1Hh8oxKZYRq9",
    description: "Natural personal care products.",
    logoUrl: "/logos/toms.png",
    websiteUrl: "https://www.tomsofmaine.com",
    categories: ["personal-care"]
  }
];

// Sample products for demo
const SAMPLE_PRODUCTS = [
  // Low eco-score products (what users might scan)
  {
    name: "Generic Plastic Water Bottle",
    brand: "Store Brand",
    category: "home",
    ecoScore: 25,
    scores: { packaging: 10, materials: 20, carbon: 30, water: 40, ethics: 25 },
    isPartnerProduct: false
  },
  {
    name: "Fast Fashion T-Shirt",
    brand: "QuickStyle",
    category: "clothing",
    ecoScore: 32,
    scores: { packaging: 40, materials: 25, carbon: 30, water: 20, ethics: 35 },
    isPartnerProduct: false
  },
  {
    name: "Conventional Laundry Detergent",
    brand: "CleanMax",
    category: "home",
    ecoScore: 38,
    scores: { packaging: 30, materials: 35, carbon: 45, water: 40, ethics: 40 },
    isPartnerProduct: false
  },

  // High eco-score partner products (sustainable alternatives)
  {
    name: "Recycled Fleece Jacket",
    brand: "Patagonia",
    category: "clothing",
    ecoScore: 88,
    scores: { packaging: 85, materials: 92, carbon: 85, water: 88, ethics: 90 },
    isPartnerProduct: true,
    certifications: ["bcorp", "fairtrade"],
    productUrl: "https://www.patagonia.com/product/fleece"
  },
  {
    name: "Tree Runner Shoes",
    brand: "Allbirds",
    category: "footwear",
    ecoScore: 85,
    scores: { packaging: 90, materials: 88, carbon: 80, water: 82, ethics: 85 },
    isPartnerProduct: true,
    certifications: ["bcorp"],
    productUrl: "https://www.allbirds.com/products/tree-runners"
  },
  {
    name: "Organic Cotton Tee",
    brand: "Tentree",
    category: "clothing",
    ecoScore: 82,
    scores: { packaging: 85, materials: 85, carbon: 78, water: 75, ethics: 88 },
    isPartnerProduct: true,
    certifications: ["organic"],
    productUrl: "https://www.tentree.com/products/organic-tee"
  },
  {
    name: "Recycled Leggings",
    brand: "Girlfriend Collective",
    category: "clothing",
    ecoScore: 84,
    scores: { packaging: 88, materials: 90, carbon: 78, water: 80, ethics: 85 },
    isPartnerProduct: true,
    certifications: ["bcorp"],
    productUrl: "https://www.girlfriend.com/products/leggings"
  },
  {
    name: "Compostable Phone Case",
    brand: "Pela Case",
    category: "accessories",
    ecoScore: 90,
    scores: { packaging: 95, materials: 92, carbon: 88, water: 85, ethics: 90 },
    isPartnerProduct: true,
    certifications: ["bcorp"],
    productUrl: "https://www.pelacase.com/products/case"
  },
  {
    name: "Plant-Based Dish Soap",
    brand: "Seventh Generation",
    category: "home",
    ecoScore: 86,
    scores: { packaging: 82, materials: 90, carbon: 85, water: 88, ethics: 85 },
    isPartnerProduct: true,
    certifications: ["leaping-bunny"],
    productUrl: "https://www.seventhgeneration.com/dish-soap"
  },
  {
    name: "Natural Toothpaste",
    brand: "Tom's of Maine",
    category: "personal-care",
    ecoScore: 80,
    scores: { packaging: 75, materials: 85, carbon: 80, water: 82, ethics: 80 },
    isPartnerProduct: true,
    certifications: ["leaping-bunny"],
    productUrl: "https://www.tomsofmaine.com/toothpaste"
  }
];

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected!');

    // Clear existing data
    console.log('\nClearing existing data...');
    await Ngo.deleteMany({});
    await Sponsor.deleteMany({});
    await Product.deleteMany({});

    // Seed NGOs
    console.log('\nSeeding NGOs...');
    const ngos = await Ngo.insertMany(NGOS);
    console.log(`  Inserted ${ngos.length} NGOs`);

    // Seed Sponsors
    console.log('\nSeeding Sponsors...');
    const sponsors = await Sponsor.insertMany(SPONSORS);
    console.log(`  Inserted ${sponsors.length} Sponsors`);

    // Link products to sponsors and seed
    console.log('\nSeeding Products...');
    const sponsorMap = {};
    sponsors.forEach(s => { sponsorMap[s.name] = s._id; });

    const productsWithSponsors = SAMPLE_PRODUCTS.map(p => ({
      ...p,
      sponsorId: p.isPartnerProduct ? sponsorMap[p.brand] : undefined
    }));

    const products = await Product.insertMany(productsWithSponsors);
    console.log(`  Inserted ${products.length} Products`);

    console.log('\n=== SEED COMPLETE ===');
    console.log(`NGOs: ${ngos.length}`);
    console.log(`Sponsors: ${sponsors.length}`);
    console.log(`Products: ${products.length}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
