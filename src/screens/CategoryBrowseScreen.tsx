import { useState } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/Button';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  ecoScore: number;
  image: string;
  category: string;
  url: string;
}

interface CategoryBrowseScreenProps {
  category?: string;
  onBack: () => void;
}

// Mock products - real snack products
// TO ADD REAL IMAGES:
// 1. Download product images from the websites
// 2. Save them to /public/products/ folder
// 3. Update image field to '/products/filename.jpg'
const mockProducts: Product[] = [
  // SNACKS - Real products with actual URLs
  { id: 's1', name: 'SOLAR DRIED MANGO', brand: 'Sol Simple', price: 6.99, ecoScore: 92, image: '', category: 'snacks', url: 'https://solsimple.com/?srsltid=AfmBOoq9EFlZSlKMlSFvA53bLYiG56x5YDOjjD6dHNU4zu-AEYXrzJLx&utm_source=chatgpt.com' },
  { id: 's2', name: 'COOKIE CRUMBLE DRIZZLED GRANOLA BARS', brand: 'MadeGood', price: 1.30, ecoScore: 88, image: '', category: 'snacks', url: 'https://www.madegoodfoods.ca/products/cookie-crumble-drizzled-granola-bars?srsltid=AfmBOor3RLadeVkuhKHprE5MWdugznVM4dx2uWLVcJ2Z0gdUSC_8_elR&utm_source=chatgpt.com' },
  { id: 's3', name: 'COOKIES & CRÈME GRANOLA BARS', brand: 'MadeGood', price: 2.00, ecoScore: 87, image: '', category: 'snacks', url: 'https://www.madegoodfoods.com/products/cookies-creme-granola-bars?srsltid=AfmBOopMZe3uwI3nO_hcqgnOQOM1XkisLDYMACARQfCIeujTCTj82JxJ&utm_source=chatgpt.com' },
  { id: 's4', name: 'PROTEIN BAR SAMPLE PACK (12 BARS)', brand: 'ALOHA', price: 38.99, ecoScore: 85, image: '', category: 'snacks', url: 'https://aloha.com/products/variety-pack-protein-bar?srsltid=AfmBOopafvFxqmp_U5GTSpe9ebCbvweNa3ZssOAc7rdlYzn7521XTM0x&utm_source=chatgpt.com' },
  { id: 's5', name: 'SUPERFOOD+ TRAIL MIX ANTIOXIDANT BLEND', brand: 'Navitas Organics', price: 19.99, ecoScore: 90, image: '', category: 'snacks', url: 'https://navitasorganics.com/products/superfood-trail-mix-antioxidant-blend?srsltid=AfmBOorNfvFcxWpNXMP8X1Y3JP7tVvnpsgmTujgttCcA1-zoYDnmAGdO&utm_source=chatgpt.com' },
  { id: 's6', name: 'CLASSIC DARK CHOCOLATE TRUFFLES', brand: 'Alter Eco', price: 9.95, ecoScore: 89, image: '', category: 'snacks', url: 'https://www.alterecofoods.com/products/classic-dark-truffles?srsltid=AfmBOorNOv9S1F28zUSA5I4jCG6O3L_9YeYK3szMyOJ4WtdfI4Xwzicg&utm_source=chatgpt.com' },
  { id: 's7', name: 'MILK CHOCOLATE 32% BAR (180G)', brand: "Tony's Chocolonely", price: 5.99, ecoScore: 91, image: '', category: 'snacks', url: 'https://tonyschocolonely.com/products/milk-chocolate-32-180g?utm_source=chatgpt.com' },
  { id: 's8', name: '70% DARK CHOCOLATE BAR (90G)', brand: 'Divine', price: 4.30, ecoScore: 93, image: '', category: 'snacks', url: 'https://www.amazon.ca/Divine-70-Dark-Chocolate-90g/dp/B01B02EB7Y' },
  
  // CLOTHES - Real products from sustainable brands
  { id: 'c1', name: "WOMEN'S REGENERATIVE ORGANIC COTTON TEE", brand: 'Patagonia', price: 55.00, ecoScore: 95, image: 'https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dwa7391185/images/hi-res/42180_UDNL_SM1.jpg?sw=1920&sh=1920&sfrm=png&q=90&bgcolor=f3f4ef', category: 'clothes', url: 'https://www.patagonia.com/product/womens-regenerative-organic-certified-cotton-tee/42180.html' },
  { id: 'c2', name: "MEN'S AQUATIC ACTION ORGANIC COTTON T-SHIRT", brand: 'Patagonia', price: 45.00, ecoScore: 93, image: 'https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw5c37c2d2/images/hi-res/37801_LFNL_CS1.jpg?sw=1920&sh=1920&sfrm=png&q=90&bgcolor=f3f4ef', category: 'clothes', url: 'https://www.patagonia.com/product/mens-aquatic-action-organic-cotton-t-shirt/37801.html' },
  { id: 'c3', name: 'COMPRESSIVE HIGH-RISE LEGGING', brand: 'Girlfriend Collective', price: 78.00, ecoScore: 92, image: 'https://girlfriend.com/cdn/shop/files/4008_4007_HRLegging_M_Black_7_web_2048x2048.jpg?v=1744659562', category: 'clothes', url: 'https://girlfriend.com/products/black-compressive-high-rise-legging' },
  { id: 'c4', name: 'REYNARD ZIP HOODIE', brand: 'Tentree', price: 68.00, ecoScore: 91, image: 'https://www.tentree.ca/cdn/shop/files/Brown-TreeFleece-Full-Zip-TCM4391-5586_4.jpg?v=1749230486&width=800', category: 'clothes', url: 'https://www.tentree.ca/products/reynard-zip-hoodie-kona' },
  { id: 'c5', name: 'BLACK V NECK BRALETTE', brand: 'Girlfriend Collective', price: 38.00, ecoScore: 90, image: 'https://girlfriend.com/cdn/shop/files/9004_VNeckBralette_Black_1_web_2048x2048.jpg?v=1712996179', category: 'clothes', url: 'https://girlfriend.com/products/black-v-neck-bralette?_pos=1&_sid=6b0d7b0e9&_ss=r' },
  { id: 'c6', name: "BAKER T-SHIRT", brand: 'Tentree', price: 32.00, ecoScore: 89, image: 'https://www.tentree.com/cdn/shop/files/Green-Treeblend-Classic-T-Shirt-TCM1869-5593_4.jpg?v=1749230317&width=800', category: 'clothes', url: 'https://www.tentree.com/products/baker-t-shirt-jade-heather' },
  
  // SHOES - Real products from sustainable brands
  { id: 'sh1', name: "WOMEN'S WOOL RUNNER", brand: 'Allbirds', price: 110.00, ecoScore: 94, image: '', category: 'shoes', url: 'https://www.allbirds.com/products/womens-wool-runners' },
  { id: 'sh2', name: "MEN'S WOOL RUNNER", brand: 'Allbirds', price: 110.00, ecoScore: 94, image: '', category: 'shoes', url: 'https://www.allbirds.com/products/mens-wool-runners' },
  { id: 'sh3', name: "WOMEN'S WOOL RUNNER GO", brand: 'Allbirds', price: 110.00, ecoScore: 93, image: '', category: 'shoes', url: 'https://www.allbirds.com/products/womens-wool-runner-go' },
  { id: 'sh4', name: "MEN'S WOOL RUNNER GO", brand: 'Allbirds', price: 110.00, ecoScore: 93, image: '', category: 'shoes', url: 'https://www.allbirds.com/products/mens-wool-runner-go-natural-white' },
  { id: 'sh5', name: "MEN'S TREE RUNNERS", brand: 'Allbirds', price: 100.00, ecoScore: 92, image: '', category: 'shoes', url: 'https://www.allbirds.com/products/mens-tree-runners' },
  { id: 'sh6', name: "MEN'S TRAIL RUNNERS", brand: 'Allbirds', price: 140.00, ecoScore: 91, image: '', category: 'shoes', url: 'https://www.allbirds.com/products/mens-trail-runners-natural-black-dark-jungle' },
  
  // PHONE CASES - Real products from Pela Case
  { id: 'pc1', name: 'SEASHELL SUNSET iPHONE 15 PRO CASE', brand: 'Pela Case', price: 65.00, ecoScore: 96, image: '', category: 'phonecases', url: 'https://pelacase.com/products/seashell-sunset-eco-friendly-iphone-15-pro-case' },
  { id: 'pc2', name: 'iPHONE 15 COMPOSTABLE CASE', brand: 'Pela Case', price: 65.00, ecoScore: 96, image: '', category: 'phonecases', url: 'https://pelacase.com/collections/iphone-15-cases' },
  { id: 'pc3', name: 'POWDER BLUE iPHONE 15 CASE', brand: 'Pela Case', price: 65.00, ecoScore: 95, image: '', category: 'phonecases', url: 'https://pelacase.com/products/powder-blue-iphone-15-case' },
  { id: 'pc4', name: 'iPHONE 14 PRO COMPOSTABLE CASE', brand: 'Pela Case', price: 65.00, ecoScore: 95, image: '', category: 'phonecases', url: 'https://pelacase.com/collections/iphone-14-pro-case' },
  { id: 'pc5', name: 'BLACK iPHONE 15 CASE', brand: 'Pela Case', price: 65.00, ecoScore: 95, image: '', category: 'phonecases', url: 'https://uk.pelacase.com/products/black-iphone-15-case' },
  { id: 'pc6', name: 'iPHONE 15 SERIES CASES', brand: 'Pela Case', price: 65.00, ecoScore: 95, image: '', category: 'phonecases', url: 'https://pelacase.com/collections/iphone-15' },
  
  // HOUSEHOLD - Real products from Seventh Generation
  { id: 'h1', name: 'EASYDOSE™ ULTRA CONCENTRATED LAUNDRY DETERGENT', brand: 'Seventh Generation', price: 14.99, ecoScore: 90, image: '', category: 'household', url: 'https://www.seventhgeneration.com/easydose-ultra-concentrated-laundry-detergent-freeclear' },
  { id: 'h2', name: 'LAUNDRY DETERGENT PACKS - FREE & CLEAR', brand: 'Seventh Generation', price: 13.99, ecoScore: 91, image: '', category: 'household', url: 'https://www.seventhgeneration.com/laundry-detergent-packs-free-clear' },
  { id: 'h3', name: 'POWER+™ ULTRA CONCENTRATED LAUNDRY DETERGENT', brand: 'Seventh Generation', price: 15.99, ecoScore: 89, image: '', category: 'household', url: 'https://www.seventhgeneration.com/easy-dose-power-plus-laundry-detergent' },
  { id: 'h4', name: 'CONCENTRATED LAUNDRY DETERGENT', brand: 'Seventh Generation', price: 11.99, ecoScore: 88, image: '', category: 'household', url: 'https://www.seventhgeneration.com/concentrated-laundry-detergent-free-clear-40-fl-oz' },
  { id: 'h5', name: 'ALL-PURPOSE CLEANER', brand: 'Seventh Generation', price: 5.49, ecoScore: 90, image: '', category: 'household', url: 'https://www.seventhgeneration.com/cleaning-products' },
  { id: 'h6', name: 'DISINFECTING WIPES', brand: 'Seventh Generation', price: 5.99, ecoScore: 89, image: '', category: 'household', url: 'https://www.seventhgeneration.com/cleaning-products' },
  
  // SELFCARE - Real products from Tom's of Maine
  { id: 'sc1', name: 'WHOLE CARE PEPPERMINT TOOTHPASTE WITH FLUORIDE', brand: "Tom's of Maine", price: 5.99, ecoScore: 87, image: '', category: 'selfcare', url: 'https://tomsofmaine.com/products/whole-care-natural-peppermint-toothpaste-with-fluoride' },
  { id: 'sc2', name: 'SIMPLY WHITE SWEET MINT TOOTHPASTE', brand: "Tom's of Maine", price: 5.99, ecoScore: 86, image: '', category: 'selfcare', url: 'https://www.tomsofmaine.com/products/oral-care/simply-white-toothpaste/sweet-mint' },
  { id: 'sc3', name: 'FLUORIDE-FREE RAPID RELIEF SENSITIVE', brand: "Tom's of Maine", price: 5.99, ecoScore: 88, image: '', category: 'selfcare', url: 'https://www.tomsofmaine.com/' },
  { id: 'sc4', name: 'NATURAL DEODORANT - LAVENDER', brand: "Tom's of Maine", price: 5.49, ecoScore: 85, image: '', category: 'selfcare', url: 'https://www.tomsofmaine.com/' },
  { id: 'sc5', name: 'NATURAL MOUTHWASH', brand: "Tom's of Maine", price: 6.99, ecoScore: 86, image: '', category: 'selfcare', url: 'https://www.tomsofmaine.com/' },
  { id: 'sc6', name: 'SILLY STRAWBERRY KIDS TOOTHPASTE', brand: "Tom's of Maine", price: 4.99, ecoScore: 87, image: '', category: 'selfcare', url: 'https://www.tomsofmaine.com/' },
];

const sortOptions = [
  { id: 'eco-score', label: 'Eco Score (High to Low)' },
  { id: 'price-low', label: 'Price (Low to High)' },
  { id: 'price-high', label: 'Price (High to Low)' },
  { id: 'name', label: 'Name (A-Z)' },
];

export function CategoryBrowseScreen({ category, onBack }: CategoryBrowseScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('eco-score');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minEcoScore, setMinEcoScore] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);

  // Filter and sort products
  let filteredProducts = mockProducts;
  
  // Filter by category if specified
  if (category && category !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === category);
  }
  
  // Filter by search
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Filter by eco score and price
  filteredProducts = filteredProducts.filter(p => 
    p.ecoScore >= minEcoScore && p.price <= maxPrice
  );
  
  // Sort
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'eco-score':
        return b.ecoScore - a.ecoScore;
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const categoryName = category === 'all' ? 'All Products' : 
    category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Products';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-lg flex-1">{categoryName}</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 rounded-xl transition-colors",
              showFilters ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="px-4 pb-3 space-y-3 animate-slide-down">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Min Eco Score: {minEcoScore}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={minEcoScore}
                onChange={(e) => setMinEcoScore(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Max Price: ${maxPrice}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setMinEcoScore(0);
                setMaxPrice(100);
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Sort By */}
        <div className="px-4 pb-3">
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted border border-border hover:bg-secondary transition-colors"
            >
              <span className="text-sm font-medium">
                Sort: {sortOptions.find(o => o.id === sortBy)?.label}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showSortMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-10 animate-slide-down">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSortBy(option.id);
                      setShowSortMenu(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors",
                      sortBy === option.id && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <div className="p-4">
        <div className="text-sm text-muted-foreground mb-4">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all"
            >
              {/* Product Image */}
              <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.style.display = 'none';
                      const placeholder = e.currentTarget.nextElementSibling;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-100 to-green-50">
                    <span className="text-4xl">📷</span>
                    <span className="absolute bottom-2 text-xs text-muted-foreground">Image placeholder</span>
                  </div>
                )}
                {product.image && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-100 to-green-50" style={{ display: 'none' }}>
                    <span className="text-4xl">📷</span>
                    <span className="absolute bottom-2 text-xs text-muted-foreground">Image placeholder</span>
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div className="p-3 space-y-2">
                <div>
                  <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">${product.price.toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      product.ecoScore >= 80 ? "bg-green-500" :
                      product.ecoScore >= 60 ? "bg-yellow-500" :
                      "bg-red-500"
                    )} />
                    <span className="text-xs font-medium">{product.ecoScore}</span>
                  </div>
                </div>
                
                <a 
                  href={product.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button size="sm" className="w-full">
                    Buy Now
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setMinEcoScore(0);
                setMaxPrice(100);
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
