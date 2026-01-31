// Gemini Vision API service for product analysis

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
  isPartner: boolean;
}

// Partner companies to prioritize for alternatives
const PARTNER_COMPANIES = [
  'Patagonia',
  'Allbirds', 
  'Tentree',
  'Girlfriend Collective',
  'Pela Case',
  'Seventh Generation',
  "Tom's of Maine"
];

const ANALYSIS_PROMPT = `You are an eco-sustainability expert. Analyze this product image (tag, label, packaging, or barcode) and provide a detailed environmental assessment.

IMPORTANT - PARTNER COMPANIES: We have partnerships with these eco-friendly brands. ALWAYS check these brands FIRST for alternatives and list them at the TOP of the alternatives list:
${PARTNER_COMPANIES.map(c => `- ${c}`).join('\n')}

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
      "productUrl": "https://www.brand.com/product-page",
      "isPartner": true
    }
  ],
  "summary": "2-3 sentence summary of the product's environmental impact"
}

Eco-Score Criteria (use this for scoring):
- Packaging (0-100): Single-use plastic = low, recyclable/compostable = high, no packaging = highest
- Materials (0-100): Synthetic/petroleum-based = low, natural/organic/recycled = high
- Carbon Footprint (0-100): Long transport/high emissions = low, local/low emissions = high
- Water Use (0-100): High water consumption in production = low, water-efficient = high
- Ethics (0-100): Poor labor practices/no certifications = low, fair trade/certified = high
- Recyclability (0-100): Non-recyclable = low, easily recyclable/biodegradable = high

Overall ecoScore should be a weighted average: Packaging 20%, Materials 25%, Carbon 20%, Water 10%, Ethics 15%, Recyclability 10%

ALTERNATIVES INSTRUCTIONS:
1. FIRST, search for similar/equivalent products from our PARTNER COMPANIES (${PARTNER_COMPANIES.join(', ')}). List these FIRST with isPartner: true.
2. THEN, search more broadly for other eco-friendly alternatives and list those AFTER partner products with isPartner: false.
3. Provide 4-8 total alternatives (prioritize 2-4 from partners if applicable to the product category).
4. For EACH alternative, you MUST include:
   - productUrl: The ACTUAL product page URL on the brand's website (e.g., https://www.patagonia.com/product/xxx or https://www.allbirds.com/products/xxx). Use real, working URLs.
   - estimatedPrice: Current retail price range in USD
   - isPartner: true if from partner list, false otherwise

Be specific with exact product names and real URLs that users can click to purchase.`;

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
              maxOutputTokens: 4096,
            },
          }),
        },
        30000 // 30 second timeout per model
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

  try {
    const result: GeminiAnalysisResult = JSON.parse(jsonString.trim());
    return result;
  } catch (parseError) {
    console.error("Failed to parse Gemini response:", textContent);
    throw new Error("Failed to parse product analysis");
  }
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
const URL_ANALYSIS_PROMPT = `You are an eco-sustainability expert. The user has provided a product URL. Based on the URL and your knowledge of this product, provide a detailed environmental assessment.

Product URL: {URL}

Research this product thoroughly based on the URL provided. Identify the product, brand, and all relevant details.

IMPORTANT - PARTNER COMPANIES: We have partnerships with these eco-friendly brands. ALWAYS check these brands FIRST for alternatives and list them at the TOP of the alternatives list:
${PARTNER_COMPANIES.map(c => `- ${c}`).join('\n')}

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
      "productUrl": "https://www.brand.com/product-page",
      "isPartner": true
    }
  ],
  "summary": "2-3 sentence summary of the product's environmental impact"
}

Eco-Score Criteria (use this for scoring):
- Packaging (0-100): Single-use plastic = low, recyclable/compostable = high, no packaging = highest
- Materials (0-100): Synthetic/petroleum-based = low, natural/organic/recycled = high
- Carbon Footprint (0-100): Long transport/high emissions = low, local/low emissions = high
- Water Use (0-100): High water consumption in production = low, water-efficient = high
- Ethics (0-100): Poor labor practices/no certifications = low, fair trade/certified = high
- Recyclability (0-100): Non-recyclable = low, easily recyclable/biodegradable = high

Overall ecoScore should be a weighted average: Packaging 20%, Materials 25%, Carbon 20%, Water 10%, Ethics 15%, Recyclability 10%

ALTERNATIVES INSTRUCTIONS:
1. FIRST, search for similar/equivalent products from our PARTNER COMPANIES (${PARTNER_COMPANIES.join(', ')}). List these FIRST with isPartner: true.
2. THEN, search more broadly for other eco-friendly alternatives and list those AFTER partner products with isPartner: false.
3. Provide 4-8 total alternatives (prioritize 2-4 from partners if applicable to the product category).
4. For EACH alternative, you MUST include:
   - productUrl: The ACTUAL product page URL on the brand's website (e.g., https://www.patagonia.com/product/xxx or https://www.allbirds.com/products/xxx). Use real, working URLs.
   - estimatedPrice: Current retail price range in USD
   - isPartner: true if from partner list, false otherwise

Be specific with exact product names and real URLs that users can click to purchase.`;

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
              maxOutputTokens: 4096,
            },
          }),
        },
        30000 // 30 second timeout per model
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
