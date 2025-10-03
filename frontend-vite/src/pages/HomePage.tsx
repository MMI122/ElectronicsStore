// frontend/src/pages/HomePage.tsx
// IMPORTANT: You need to install these packages first:
// npm install react-router-dom axios

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/api';
import { ShoppingBag, TrendingUp, Star, ArrowRight, ShoppingCart } from 'lucide-react';
import StarRating from '../components/ui/StarRating';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  average_rating: number;
  review_count: number;
  primaryImage?: {
    image_path: string;
  };
  images?: {
    image_path: string;
  }[];
}

const HomePage: React.FC = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // For now, use the general products endpoint instead of specific ones
        const productsRes = await productService.getProducts();
        const products = productsRes.data.data || productsRes.data || [];
        
        // Simulate different product lists from the same data
        setFeatured(products.slice(0, 6));
        setNewArrivals(products.slice(0, 6));
        setTopRated(products.slice(0, 6));

        // Fetch ML-powered recommendations
        try {
          const recommendationsRes = await productService.getRecommendations();
          const recommendationsData = recommendationsRes.data.data || recommendationsRes.data || [];
          setRecommendations(recommendationsData.slice(0, 6));
        } catch (error) {
          console.log('ML recommendations not available, using fallback');
          setRecommendations(products.slice(6, 12)); // Fallback to different products
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Set empty arrays if API fails
        setFeatured([]);
        setNewArrivals([]);
        setTopRated([]);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    // Debug: Log the product data to console
    console.log('Product data:', product);
    
    const getImageUrl = () => {
      if (product.primaryImage?.image_path) {
        return `http://localhost:8000/storage/${product.primaryImage.image_path}`;
      } else if (product.images && product.images.length > 0) {
        return `http://localhost:8000/storage/${product.images[0].image_path}`;
      } else {
        return '/placeholder.svg';
      }
    };

    const imageUrl = getImageUrl();
    console.log('Using image URL:', imageUrl);

    return (
      <Link
        to={`/products/${product.slug}`}
        className="bg-white rounded-lg shadow-md hover:shadow-xl transition group overflow-hidden"
      >
        <div className="relative h-64 bg-gray-100">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => {
              console.log('Image failed to load:', imageUrl);
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
          {product.compare_price && product.compare_price > product.price && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% OFF
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 h-12">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <StarRating 
              rating={product.average_rating || 0} 
              size={16} 
              showNumeric 
              className="text-sm"
            />
            {product.review_count > 0 && (
              <span className="text-xs text-gray-500">
                ({product.review_count} review{product.review_count !== 1 ? 's' : ''})
              </span>
            )}
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
            <button className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full transition">
              <ShoppingCart size={20} />
            </button>
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Welcome to ElectroShop
            </h1>
            <p className="text-xl mb-8 text-gray-100">
              Discover the latest electronics at unbeatable prices. From smartphones to laptops, we've got everything you need.
            </p>
            <div className="flex gap-4">
              <Link
                to="/products"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
              >
                Shop Now
                <ArrowRight size={20} />
              </Link>
              <Link
                to="/products?featured=true"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition"
              >
                View Deals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 p-4 rounded-full">
                <ShoppingBag className="text-blue-600" size={32} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Free Shipping</h3>
                <p className="text-gray-600">On orders over $100</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 p-4 rounded-full">
                <TrendingUp className="text-blue-600" size={32} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Best Prices</h3>
                <p className="text-gray-600">Guaranteed lowest prices</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 p-4 rounded-full">
                <Star className="text-blue-600" size={32} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Quality Products</h3>
                <p className="text-gray-600">100% authentic products</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Powered Recommendations */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">🤖 Recommended For You</h2>
              <p className="text-purple-100">AI-powered suggestions based on your preferences</p>
            </div>
            <Link
              to="/products?recommended=true"
              className="text-white hover:text-purple-100 font-semibold flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition"
            >
              View All
              <ArrowRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.length > 0 ? (
              recommendations.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                    🔥 ML Pick
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
                  <div className="text-6xl mb-4">🤖</div>
                  <p className="text-white text-lg mb-2">ML Recommendations Loading...</p>
                  <p className="text-purple-100 text-sm">Our AI is analyzing your preferences to suggest the perfect products!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Featured Products</h2>
            <Link
              to="/products?featured=true"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
            >
              View All
              <ArrowRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.length > 0 ? (
              featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">Featured products will appear here once the backend is connected.</p>
                <p className="text-gray-400 text-sm mt-2">Make sure your Laravel backend is running on port 8000.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">New Arrivals</h2>
            <Link
              to="/products?sort_by=created_at&sort_order=desc"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
            >
              View All
              <ArrowRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newArrivals.length > 0 ? (
              newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">New arrivals will appear here once the backend is connected.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Top Rated */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Top Rated Products</h2>
            <Link
              to="/products?sort_by=rating"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
            >
              View All
              <ArrowRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topRated.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-xl mb-8 text-gray-100">
            Get the latest deals and updates delivered to your inbox
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
