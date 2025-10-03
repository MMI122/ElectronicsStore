// frontend/src/pages/customer/Wishlist.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistService } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { Heart, ShoppingCart, Trash2, Star } from 'lucide-react';

interface WishlistItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  average_rating: number;
  stock_quantity: number;
  primaryImage?: { image_path: string };
  category: { name: string };
}

const CustomerWishlist: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await wishlistService.getWishlist();
      setWishlist(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      await wishlistService.removeFromWishlist(productId);
      setWishlist(wishlist.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart(productId, 1);
      alert('Product added to cart!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Heart className="text-pink-600" fill="currentColor" />
              My Wishlist
            </h1>
            <p className="text-gray-600 mt-2">{wishlist.length} items saved</p>
          </div>
        </div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">Start adding products you love!</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
            >
              Browse Products
            </button>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group">
                {/* Product Image */}
                <div className="relative h-64 bg-gray-100">
                  <img
                    src={item.primaryImage?.image_path 
                      ? `http://localhost:8000/storage/${item.primaryImage.image_path}`
                      : '/placeholder.png'
                    }
                    alt={item.name}
                    onClick={() => navigate(`/products/${item.slug}`)}
                    className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition duration-300"
                  />
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-red-50 transition"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>

                  {/* Discount Badge */}
                  {item.compare_price && item.compare_price > item.price && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {Math.round(((item.compare_price - item.price) / item.compare_price) * 100)}% OFF
                    </div>
                  )}

                  {/* Out of Stock Overlay */}
                  {item.stock_quantity === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1">{item.category.name}</p>
                  <h3
                    onClick={() => navigate(`/products/${item.slug}`)}
                    className="font-semibold text-gray-800 mb-2 line-clamp-2 h-12 cursor-pointer hover:text-blue-600"
                  >
                    {item.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500" fill="currentColor" />
                      <span className="text-sm text-gray-700">{item.average_rating ? Number(item.average_rating).toFixed(1) : '0.0'}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-600">${Number(item.price).toFixed(2)}</span>
                      {item.compare_price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${Number(item.compare_price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(item.id)}
                    disabled={item.stock_quantity === 0}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                  >
                    <ShoppingCart size={18} />
                    {item.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {wishlist.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-600">
                You have <span className="font-bold text-blue-600">{wishlist.length}</span> items in your wishlist
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/products')}
                  className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerWishlist;