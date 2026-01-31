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
  { id: 's1', name: 'Solar Dried Mango', brand: 'Sol Simple', price: 6.99, ecoScore: 92, image: '', category: 'snacks', url: 'https://solsimple.com/products/solar-dried-mango-regenerative-organic-certified-3-oz' },
  { id: 's2', name: 'Cookie Crumble Drizzled Granola Bars', brand: 'MadeGood', price: 1.30, ecoScore: 88, image: '', category: 'snacks', url: 'https://www.madegoodfoods.ca/products/cookie-crumble-drizzled-granola-bars' },
  { id: 's3', name: 'Cookies & Crème Granola Bars', brand: 'MadeGood', price: 2.00, ecoScore: 87, image: '', category: 'snacks', url: 'https://www.madegoodfoods.com/products/cookies-creme-granola-bars' },
  { id: 's4', name: 'Protein Bar Sample Pack (12 bars)', brand: 'ALOHA', price: 38.99, ecoScore: 85, image: '', category: 'snacks', url: 'https://aloha.com/products/variety-pack-protein-bar' },
  { id: 's5', name: 'Superfood+ Trail Mix Antioxidant Blend', brand: 'Navitas Organics', price: 19.99, ecoScore: 90, image: '', category: 'snacks', url: 'https://navitasorganics.com/products/superfood-trail-mix-antioxidant-blend' },
  { id: 's6', name: 'Classic Dark Chocolate Truffles', brand: 'Alter Eco', price: 9.95, ecoScore: 89, image: '', category: 'snacks', url: 'https://www.alterecofoods.com/products/classic-dark-truffles' },
  { id: 's7', name: 'Milk Chocolate 32% Bar (180g)', brand: "Tony's Chocolonely", price: 5.99, ecoScore: 91, image: '', category: 'snacks', url: 'https://tonyschocolonely.com/products/milk-chocolate-32-180g' },
  { id: 's8', name: '70% Dark Chocolate Bar (90g)', brand: 'Divine', price: 4.30, ecoScore: 93, image: '', category: 'snacks', url: 'https://divinechocolate.com/products/divine-70-dark-chocolate' },
  
  // Other categories (keeping some variety)
  { id: 'p7', name: 'Bamboo Shampoo Bar', brand: 'ZeroWaste', price: 12.99, ecoScore: 92, image: '', category: 'shampoo', url: '#' },
  { id: 'p8', name: 'Tea Tree Shampoo', brand: 'EcoHair', price: 8.99, ecoScore: 81, image: '', category: 'shampoo', url: '#' },
  { id: 'p9', name: 'Coconut Shampoo', brand: 'PureClean', price: 9.49, ecoScore: 79, image: '', category: 'shampoo', url: '#' },
  { id: 'p10', name: 'Herbal Shampoo', brand: 'GreenRoots', price: 7.99, ecoScore: 84, image: '', category: 'shampoo', url: '#' },
  { id: 'p11', name: 'Vinegar Cleaner', brand: 'CleanEarth', price: 4.99, ecoScore: 90, image: '', category: 'cleaning', url: '#' },
  { id: 'p12', name: 'Dish Soap Bar', brand: 'ZeroWaste', price: 5.49, ecoScore: 87, image: '', category: 'cleaning', url: '#' },
  { id: 'p13', name: 'Kombucha', brand: 'LiveCulture', price: 3.99, ecoScore: 76, image: '', category: 'drinks', url: '#' },
  { id: 'p14', name: 'Organic Juice', brand: 'FreshPress', price: 4.49, ecoScore: 80, image: '', category: 'drinks', url: '#' },
  { id: 'p15', name: 'Beeswax Wraps', brand: 'ReusableKit', price: 14.99, ecoScore: 95, image: '', category: 'household', url: '#' },
  { id: 'p16', name: 'Bamboo Utensils', brand: 'EcoKitchen', price: 9.99, ecoScore: 89, image: '', category: 'household', url: '#' },
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
                      // Fallback to gradient if image fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-100 to-green-50">
                  <span className="text-4xl">📷</span>
                  <span className="absolute bottom-2 text-xs text-muted-foreground">Image placeholder</span>
                </div>
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
