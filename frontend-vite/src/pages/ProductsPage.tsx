import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService, categoryService } from '../services/api';
import { Star, Filter, X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  average_rating: number;
  stock_quantity: number;
  primaryImage?: { image_path: string };
  images?: { image_path: string }[];
  category: { id: number; name: string };
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (searchParams.get('search')) params.search = searchParams.get('search');
      if (searchParams.get('category')) params.category = searchParams.get('category');
      if (searchParams.get('min_price')) params.min_price = searchParams.get('min_price');
      if (searchParams.get('max_price')) params.max_price = searchParams.get('max_price');
      if (searchParams.get('sort_by')) params.sort_by = searchParams.get('sort_by');
      if (searchParams.get('featured')) params.featured = searchParams.get('featured');

      const response = await productService.getProducts(params);
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const params: any = {};
    if (selectedCategory) params.category = selectedCategory;
    if (priceRange.min) params.min_price = priceRange.min;
    if (priceRange.max) params.max_price = priceRange.max;
    if (sortBy) params.sort_by = sortBy;
    
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('created_at');
    setSearchParams({});
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">All Products</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden bg-white px-4 py-2 rounded-lg shadow flex items-center gap-2"
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 bg-white p-6 rounded-lg shadow-md h-fit`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Filters</h2>
              <button onClick={clearFilters} className="text-blue-600 text-sm">Clear All</button>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Category</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={selectedCategory === String(cat.id)}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="text-blue-600"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Price Range</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            {/* Sort By */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="created_at">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <button
              onClick={applyFilters}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.slug}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
                  >
                    <div className="h-64 bg-gray-100 relative">
                      {product.primaryImage?.image_path ? (
                        <img
                          src={`http://localhost:8000/storage/${product.primaryImage.image_path}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('ProductsPage - Image failed to load:', product.primaryImage?.image_path);
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      ) : product.images && product.images.length > 0 ? (
                        <img
                          src={`http://localhost:8000/storage/${product.images[0].image_path}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('ProductsPage - Fallback image failed to load:', product.images?.[0]?.image_path);
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <img
                          src="/placeholder.svg"
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {product.compare_price && product.compare_price > product.price && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% OFF
                        </div>
                      )}
                      {product.stock_quantity === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 h-12">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Star size={16} className="text-yellow-500" fill="currentColor" />
                        <span className="text-sm text-gray-700">
                          {product.average_rating ? Number(product.average_rating).toFixed(1) : '0.0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            ${Number(product.price).toFixed(2)}
                          </p>
                          {product.compare_price && (
                            <p className="text-sm text-gray-500 line-through">
                              ${Number(product.compare_price).toFixed(2)}
                            </p>
                          )}
                        </div>
                        {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
                          <span className="text-xs text-orange-600 font-semibold">
                            Only {product.stock_quantity} left
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;