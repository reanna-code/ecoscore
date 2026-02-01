// Gemini Vision API service for product analysis

// Detailed sub-score breakdowns based on the EcoScore algorithm
export interface PackagingBreakdown {
  score: number; // S_packaging = 0.5·R + 0.3·M + 0.2·W
  recyclability: { score: number; label: string }; // R: recyclable=100, partial=60, non=10
  materialType: { score: number; label: string }; // M: paper/glass/aluminum=100, bioplastic=70, mixed plastic=30
  weightEfficiency: { score: number; label: string }; // W: low packaging = higher score
}

export interface MaterialsBreakdown {
  score: number; // S_materials = 0.6·H + 0.4·R
  harmfulIngredients: { score: number; label: string }; // H: none=100, some=50, many=10
  renewableSourcing: { score: number; label: string }; // R: % renewable/responsibly sourced
}

export interface CarbonBreakdown {
  score: number; // S_carbon = 100 - min(100, E + T)
  emissions: { score: number; label: string }; // E: low=10, medium=40, high=70
  transport: { score: number; label: string }; // T: local=0, domestic=10, international=30
}

export interface WaterBreakdown {
  score: number; // S_water = 100 - W_u
  industryIntensity: { score: number; label: string }; // W_u: low=10, medium=40, high=70-90
}

export interface EthicsBreakdown {
  score: number; // S_ethics = 0.5·C + 0.5·T
  certifications: { score: number; label: string }; // C: Fairtrade, B Corp, FSC
  transparency: { score: number; label: string }; // T: publishes sourcing = high
}

export interface DetailedEcoScoreBreakdown {
  packaging: PackagingBreakdown;
  materials: MaterialsBreakdown;
  carbon: CarbonBreakdown;
  water: WaterBreakdown;
  ethics: EthicsBreakdown;
}

export interface GeminiAnalysisResult {
  productName: string;
  brand: string | null;
  category: string;
  materials: string[];
  ingredients: string[];
  ecoScore: number;
  ecoScoreBreakdown: {
    packaging: number;
    materials: number;
    carbonFootprint: number;
    waterUse: number;
    ethics: number;
    recyclability: number;
  };
  detailedBreakdown: DetailedEcoScoreBreakdown;
  concerns: string[];
  positives: string[];
  alternatives: GeminiAlternative[];
  summary: string;
}

export interface GeminiAlternative {
  name: string;
  brand: string;
  reason: string;
  estimatedEcoScore: number;
  whereToBuy: string[];
  estimatedPrice: {
    min: number;
    max: number;
    currency: string;
  } | null;
  productUrl: string | null;
  searchUrl: string; // Google Shopping search URL - always works
  isPartner: boolean;
}

// Partner companies (only suggest if they have RELEVANT products)
const PARTNER_COMPANIES = [
  'Patagonia',
  'Allbirds', 
  'Tentree',
  'Girlfriend Collective',
  'Pela Case',
  'Seventh Generation',
  "Tom's of Maine"
];

const ANALYSIS_PROMPT = `You are an eco-sustainability expert. Analyze this product image (tag, label, packaging, or barcode) and provide a detailed environmental assessment using our EcoScore algorithm.

=== ECOSCORE ALGORITHM ===
Calculate the final EcoScore using this formula:
EcoScore = 0.25×S_packaging + 0.25×S_materials + 0.20×S_carbon + 0.15×S_water + 0.15×S_ethics

1. PACKAGING & RECYCLABILITY (Weight: 0.25)
   S_packaging = 0.5×R + 0.3×M + 0.2×W
   - R (Recyclability): recyclable=100, partially recyclable=60, non-recyclable=10
   - M (Material Type): paper/aluminum/glass=100, bioplastic=70, mixed plastic=30
   - W (Weight Efficiency): low packaging volume per unit=high score (0-100)

2. MATERIALS / INGREDIENTS IMPACT (Weight: 0.25)
   S_materials = 0.6×H + 0.4×R
   - H (Harmful Ingredients): no harmful ingredients=100, some flagged=50, many flagged=10
   - R (Renewable Sourcing): % of renewable/responsibly sourced materials (0-100)

3. CARBON FOOTPRINT & TRANSPORT (Weight: 0.20)
   S_carbon = 100 - min(100, E + T)
   - E (Emissions): low/local/plant-based=10, medium=40, high/global/energy-intensive=70
   - T (Transport): local <200km=0, domestic=10, international=30

4. WATER USAGE (Weight: 0.15)
   S_water = 100 - W_u
   - W_u (Industry Intensity): electronics/refills=10, processed foods=40, cotton/meat=70-90

5. SUPPLY CHAIN ETHICS & TRANSPARENCY (Weight: 0.15)
   S_ethics = 0.5×C + 0.5×T
   - C (Certifications): Fairtrade, B Corp, FSC, organic certifications (0-100)
   - T (Transparency): publishes sourcing & audits=high, vague claims=low (0-100)

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "productName": "exact product name",
  "brand": "brand name or null if unknown",
  "category": "product category (e.g., food, clothing, cosmetics, electronics, household, furniture)",
  "materials": ["list", "of", "materials", "identified"],
  "ingredients": ["list", "of", "ingredients", "if applicable"],
  "ecoScore": 0-100,
  "ecoScoreBreakdown": {
    "packaging": 0-100,
    "materials": 0-100,
    "carbonFootprint": 0-100,
    "waterUse": 0-100,
    "ethics": 0-100,
    "recyclability": 0-100
  },
  "detailedBreakdown": {
    "packaging": {
      "score": 0-100,
      "recyclability": { "score": 0-100, "label": "Recyclable/Partially/Non-recyclable" },
      "materialType": { "score": 0-100, "label": "Paper/Glass/Aluminum/Bioplastic/Mixed Plastic" },
      "weightEfficiency": { "score": 0-100, "label": "Minimal/Moderate/Excessive packaging" }
    },
    "materials": {
      "score": 0-100,
      "harmfulIngredients": { "score": 0-100, "label": "None detected/Some flagged/Many flagged" },
      "renewableSourcing": { "score": 0-100, "label": "X% renewable/responsibly sourced" }
    },
    "carbon": {
      "score": 0-100,
      "emissions": { "score": 0-100, "label": "Low/Medium/High emissions" },
      "transport": { "score": 0-100, "label": "Local/Domestic/International" }
    },
    "water": {
      "score": 0-100,
      "industryIntensity": { "score": 0-100, "label": "Low/Medium/High water industry" }
    },
    "ethics": {
      "score": 0-100,
      "certifications": { "score": 0-100, "label": "List certifications or None" },
      "transparency": { "score": 0-100, "label": "High/Medium/Low transparency" }
    }
  },
  "concerns": ["specific environmental concerns about this product"],
  "positives": ["any eco-friendly aspects of this product"],
  "alternatives": [
    {
      "name": "greener alternative product name",
      "brand": "brand name",
      "reason": "why this is more eco-friendly",
      "estimatedEcoScore": 0-100,
      "whereToBuy": ["store or website names"],
      "estimatedPrice": {
        "min": 5.99,
        "max": 12.99,
        "currency": "USD"
      },
      "productUrl": null,
      "searchUrl": "https://www.google.com/search?tbm=shop&q=Brand+Product+Name",
      "isPartner": true
    }
  ],
  "summary": "2-3 sentence summary of the product's environmental impact"
}

=== ALTERNATIVES INSTRUCTIONS (CRITICAL - READ CAREFULLY) ===

PRIORITY #1 - RELEVANCE: Alternatives MUST be directly similar to the scanned product.
- Same product category (e.g., if user scans shampoo, suggest eco-friendly shampoos, NOT clothing)
- Same function/use case (e.g., if user scans running shoes, suggest eco-friendly running shoes)
- Similar price range when possible

PRIORITY #2 - NO BROKEN LINKS: 
⚠️ CRITICAL: DO NOT generate specific product URLs - they often lead to 404 errors!
- Set productUrl to NULL for all alternatives (we cannot verify if product pages exist)
- Instead, ALWAYS provide a searchUrl using this format:
  searchUrl: "https://www.google.com/search?tbm=shop&q=" + URL-encoded brand and product name
  Example: "https://www.google.com/search?tbm=shop&q=Patagonia+Organic+Cotton+Hoodie"
- The searchUrl will always work and help users find the product

PARTNER COMPANIES (bonus, NOT required): ${PARTNER_COMPANIES.join(', ')}
- ONLY include partner products if they make a DIRECTLY RELEVANT alternative
- Do NOT force partner products that don't match the product category
- Set isPartner: true for partner brands, false for others

INSTRUCTIONS:
1. Find 4-6 eco-friendly alternatives that serve the SAME PURPOSE as the scanned product
2. Each alternative must be a real, purchasable product from a real brand
3. Set productUrl to null (do NOT guess URLs)
4. Generate searchUrl as a Google Shopping search: "https://www.google.com/search?tbm=shop&q=" + encoded product name
5. Include estimatedPrice based on typical retail prices

URL FORMAT EXAMPLES:
- Brand: "Patagonia", Product: "Organic Cotton Hoodie" 
  → searchUrl: "https://www.google.com/search?tbm=shop&q=Patagonia+Organic+Cotton+Hoodie"
- Brand: "Seventh Generation", Product: "Dish Soap"
  → searchUrl: "https://www.google.com/search?tbm=shop&q=Seventh+Generation+Dish+Soap"

QUALITY CHECK:
✓ Is this product the same category as what was scanned?
✓ Does this product serve the same function?
✓ Is productUrl set to null? (REQUIRED)
✓ Is searchUrl a valid Google Shopping search URL?`;

// Models to try in order of preference (2026 model names)
const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
];

// Fetch with timeout helper
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}

export async function analyzeProductWithGemini(
  images: string[], // base64 encoded images
  apiKey: string
): Promise<GeminiAnalysisResult> {
  console.log('Starting product analysis...');
  
  const imageParts = images.map((base64Image) => ({
    inline_data: {
      mime_type: "image/jpeg",
      data: base64Image.replace(/^data:image\/\w+;base64,/, ""),
    },
  }));

  let lastError: Error | null = null;

  // Try each model until one works
  for (const model of MODELS_TO_TRY) {
    console.log(`Trying model: ${model}`);
    try {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: ANALYSIS_PROMPT }, ...imageParts],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              topK: 32,
              topP: 1,
              maxOutputTokens: 8192,
            },
          }),
        },
        60000 // 60 second timeout per model
      );

      if (response.ok) {
        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (textContent) {
          console.log(`Successfully used model: ${model}`);
          return parseGeminiResponse(textContent);
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || `Model ${model} failed`;
        console.warn(`Model ${model} failed:`, errorMessage);
        lastError = new Error(errorMessage);
        
        // If it's an API key error, don't try other models
        if (errorMessage.includes('API key') || errorMessage.includes('permission')) {
          throw new Error(errorMessage);
        }
      }
    } catch (err) {
      console.warn(`Model ${model} error:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // If it's an API key or permission error, throw immediately
      if (lastError.message.includes('API key') || lastError.message.includes('permission')) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("All models failed. Please check your API key and try again.");
}

function parseGeminiResponse(textContent: string): GeminiAnalysisResult {
  // Parse the JSON response (handle potential markdown code blocks)
  let jsonString = textContent.trim();
  if (jsonString.startsWith("```json")) {
    jsonString = jsonString.slice(7);
  }
  if (jsonString.startsWith("```")) {
    jsonString = jsonString.slice(3);
  }
  if (jsonString.endsWith("```")) {
    jsonString = jsonString.slice(0, -3);
  }

  jsonString = jsonString.trim();

  // Try to parse directly first
  try {
    const result: GeminiAnalysisResult = JSON.parse(jsonString);
    return result;
  } catch (parseError) {
    console.warn("Initial JSON parse failed, attempting to repair truncated response...");
    
    // Try to repair truncated JSON
    const repairedJson = repairTruncatedJson(jsonString);
    
    try {
      const result: GeminiAnalysisResult = JSON.parse(repairedJson);
      console.log("Successfully repaired and parsed truncated JSON");
      return result;
    } catch (repairError) {
      console.error("Failed to parse Gemini response:", textContent);
      console.error("Repair attempt also failed");
      throw new Error("Failed to parse product analysis. The response may have been truncated.");
    }
  }
}

// Attempt to repair truncated JSON by closing open brackets/braces
function repairTruncatedJson(jsonString: string): string {
  let repaired = jsonString.trim();
  
  // Count open brackets and braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
    }
  }
  
  // If we're in the middle of a string, close it
  if (inString) {
    repaired += '"';
  }
  
  // Check if we're in the middle of an object in an array (e.g., alternatives array)
  // Try to close the current object properly
  if (openBraces > 0 || openBrackets > 0) {
    // Remove trailing comma if present
    repaired = repaired.replace(/,\s*$/, '');
    
    // If the last non-whitespace is a property value indicator, add null
    if (repaired.match(/:\s*$/)) {
      repaired += 'null';
    }
    
    // Add missing summary if we detect we're near the end of alternatives
    if (!repaired.includes('"summary"') && repaired.includes('"alternatives"')) {
      // Close any open objects in alternatives
      while (openBraces > 1) {
        repaired += '}';
        openBraces--;
      }
      while (openBrackets > 0) {
        repaired += ']';
        openBrackets--;
      }
      // Add default summary
      repaired += ', "summary": "Analysis completed with limited data due to response truncation."';
    }
    
    // Close remaining brackets and braces
    while (openBrackets > 0) {
      repaired += ']';
      openBrackets--;
    }
    while (openBraces > 0) {
      repaired += '}';
      openBraces--;
    }
  }
  
  return repaired;
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// URL analysis prompt
const URL_ANALYSIS_PROMPT = `You are an eco-sustainability expert. The user has provided a product URL. Based on the URL and your knowledge of this product, provide a detailed environmental assessment using our EcoScore algorithm.

Product URL: {URL}

Research this product thoroughly based on the URL provided. Identify the product, brand, and all relevant details.

=== ECOSCORE ALGORITHM ===
Calculate the final EcoScore using this formula:
EcoScore = 0.25*S_packaging + 0.25*S_materials + 0.20*S_carbon + 0.15*S_water + 0.15*S_ethics

1. PACKAGING & RECYCLABILITY (Weight: 0.25)
   S_packaging = 0.5*R + 0.3*M + 0.2*W
   - R (Recyclability): recyclable=100, partially recyclable=60, non-recyclable=10
   - M (Material Type): paper/aluminum/glass=100, bioplastic=70, mixed plastic=30
   - W (Weight Efficiency): low packaging volume per unit=high score (0-100)

2. MATERIALS / INGREDIENTS IMPACT (Weight: 0.25)
   S_materials = 0.6*H + 0.4*R
   - H (Harmful Ingredients): no harmful ingredients=100, some flagged=50, many flagged=10
   - R (Renewable Sourcing): % of renewable/responsibly sourced materials (0-100)

3. CARBON FOOTPRINT & TRANSPORT (Weight: 0.20)
   S_carbon = 100 - min(100, E + T)
   - E (Emissions): low/local/plant-based=10, medium=40, high/global/energy-intensive=70
   - T (Transport): local <200km=0, domestic=10, international=30

4. WATER USAGE (Weight: 0.15)
   S_water = 100 - W_u
   - W_u (Industry Intensity): electronics/refills=10, processed foods=40, cotton/meat=70-90

5. SUPPLY CHAIN ETHICS & TRANSPARENCY (Weight: 0.15)
   S_ethics = 0.5*C + 0.5*T
   - C (Certifications): Fairtrade, B Corp, FSC, organic certifications (0-100)
   - T (Transparency): publishes sourcing & audits=high, vague claims=low (0-100)

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "productName": "exact product name",
  "brand": "brand name or null if unknown",
  "category": "product category (e.g., food, clothing, cosmetics, electronics, household, furniture)",
  "materials": ["list", "of", "materials", "identified"],
  "ingredients": ["list", "of", "ingredients", "if applicable"],
  "ecoScore": 0-100,
  "ecoScoreBreakdown": {
    "packaging": 0-100,
    "materials": 0-100,
    "carbonFootprint": 0-100,
    "waterUse": 0-100,
    "ethics": 0-100,
    "recyclability": 0-100
  },
  "detailedBreakdown": {
    "packaging": {
      "score": 0-100,
      "recyclability": { "score": 0-100, "label": "Recyclable/Partially/Non-recyclable" },
      "materialType": { "score": 0-100, "label": "Paper/Glass/Aluminum/Bioplastic/Mixed Plastic" },
      "weightEfficiency": { "score": 0-100, "label": "Minimal/Moderate/Excessive packaging" }
    },
    "materials": {
      "score": 0-100,
      "harmfulIngredients": { "score": 0-100, "label": "None detected/Some flagged/Many flagged" },
      "renewableSourcing": { "score": 0-100, "label": "X% renewable/responsibly sourced" }
    },
    "carbon": {
      "score": 0-100,
      "emissions": { "score": 0-100, "label": "Low/Medium/High emissions" },
      "transport": { "score": 0-100, "label": "Local/Domestic/International" }
    },
    "water": {
      "score": 0-100,
      "industryIntensity": { "score": 0-100, "label": "Low/Medium/High water industry" }
    },
    "ethics": {
      "score": 0-100,
      "certifications": { "score": 0-100, "label": "List certifications or None" },
      "transparency": { "score": 0-100, "label": "High/Medium/Low transparency" }
    }
  },
  "concerns": ["specific environmental concerns about this product"],
  "positives": ["any eco-friendly aspects of this product"],
  "alternatives": [
    {
      "name": "greener alternative product name",
      "brand": "brand name",
      "reason": "why this is more eco-friendly",
      "estimatedEcoScore": 0-100,
      "whereToBuy": ["store or website names"],
      "estimatedPrice": {
        "min": 5.99,
        "max": 12.99,
        "currency": "USD"
      },
      "productUrl": null,
      "searchUrl": "https://www.google.com/search?tbm=shop&q=Brand+Product+Name",
      "isPartner": true
    }
  ],
  "summary": "2-3 sentence summary of the product's environmental impact"
}

=== ALTERNATIVES INSTRUCTIONS (CRITICAL - READ CAREFULLY) ===

PRIORITY #1 - RELEVANCE: Alternatives MUST be directly similar to the product from the URL.
- Same product category (e.g., if URL is for shampoo, suggest eco-friendly shampoos, NOT clothing)
- Same function/use case (e.g., if URL is for running shoes, suggest eco-friendly running shoes)
- Similar price range when possible

PRIORITY #2 - NO BROKEN LINKS: 
⚠️ CRITICAL: DO NOT generate specific product URLs - they often lead to 404 errors!
- Set productUrl to NULL for all alternatives (we cannot verify if product pages exist)
- Instead, ALWAYS provide a searchUrl using this format:
  searchUrl: "https://www.google.com/search?tbm=shop&q=" + URL-encoded brand and product name
  Example: "https://www.google.com/search?tbm=shop&q=Patagonia+Organic+Cotton+Hoodie"
- The searchUrl will always work and help users find the product

PARTNER COMPANIES (bonus, NOT required): ${PARTNER_COMPANIES.join(', ')}
- ONLY include partner products if they make a DIRECTLY RELEVANT alternative
- Do NOT force partner products that don't match the product category
- Set isPartner: true for partner brands, false for others

INSTRUCTIONS:
1. Find 4-6 eco-friendly alternatives that serve the SAME PURPOSE as the product in the URL
2. Each alternative must be a real, purchasable product from a real brand
3. Set productUrl to null (do NOT guess URLs)
4. Generate searchUrl as a Google Shopping search: "https://www.google.com/search?tbm=shop&q=" + encoded product name
5. Include estimatedPrice based on typical retail prices

URL FORMAT EXAMPLES:
- Brand: "Patagonia", Product: "Organic Cotton Hoodie" 
  → searchUrl: "https://www.google.com/search?tbm=shop&q=Patagonia+Organic+Cotton+Hoodie"
- Brand: "Seventh Generation", Product: "Dish Soap"
  → searchUrl: "https://www.google.com/search?tbm=shop&q=Seventh+Generation+Dish+Soap"

QUALITY CHECK:
✓ Is this product the same category as what the user is looking at?
✓ Does this product serve the same function?
✓ Is productUrl set to null? (REQUIRED)
✓ Is searchUrl a valid Google Shopping search URL?`;

// Analyze product from URL
export async function analyzeProductFromUrl(
  productUrl: string,
  apiKey: string
): Promise<GeminiAnalysisResult> {
  console.log('Starting URL-based product analysis...');
  
  const prompt = URL_ANALYSIS_PROMPT.replace('{URL}', productUrl);

  let lastError: Error | null = null;

  // Try each model until one works
  for (const model of MODELS_TO_TRY) {
    console.log(`Trying model: ${model}`);
    try {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              topK: 32,
              topP: 1,
              maxOutputTokens: 8192,
            },
          }),
        },
        60000 // 60 second timeout per model
      );

      if (response.ok) {
        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (textContent) {
          console.log(`Successfully used model: ${model}`);
          return parseGeminiResponse(textContent);
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || `Model ${model} failed`;
        console.warn(`Model ${model} failed:`, errorMessage);
        lastError = new Error(errorMessage);
        
        // If it's an API key error, don't try other models
        if (errorMessage.includes('API key') || errorMessage.includes('permission')) {
          throw new Error(errorMessage);
        }
      }
    } catch (err) {
      console.warn(`Model ${model} error:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // If it's an API key or permission error, throw immediately
      if (lastError.message.includes('API key') || lastError.message.includes('permission')) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("All models failed. Please check your API key and try again.");
}
