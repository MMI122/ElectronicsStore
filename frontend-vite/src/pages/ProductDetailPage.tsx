// frontend/src/pages/ProductDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Heart, Truck, Shield, RefreshCw, Minus, Plus, ThumbsUp } from 'lucide-react';
import StarRating from '../components/ui/StarRating';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_price?: number;
  stock_quantity: number;
  average_rating: number;
  review_count: number;
  brand?: string;
  warranty?: string;
  specifications?: any;
  features?: string[];
  images: Array<{ id: number; image_path: string; is_primary: boolean }>;
  category: { id: number; name: string };
}

interface Review {
  id: number;
  rating: number;
  title?: string;
  comment: string;
  created_at: string;
  user: { name: string };
  is_verified_purchase: boolean;
}

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProduct(slug!);
      const productData = response.data.product;
      setProduct(productData);
      setRelatedProducts(response.data.related_products);
      
      if (productData.images?.length > 0) {
        const primaryImg = productData.images.find((img: any) => img.is_primary);
        setSelectedImage(primaryImg?.image_path || productData.images[0].image_path);
      }

      // Fetch reviews for this product
      if (productData.id) {
        try {
          const reviewsResponse = await productService.getProductReviews(productData.id);
          setReviews(reviewsResponse.data.data || reviewsResponse.data || []);
        } catch (reviewError) {
          console.error('Error fetching reviews:', reviewError);
          setReviews([]);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await addToCart(product!.id, quantity);
      alert('Product added to cart!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const incrementQuantity = () => {
    if (quantity < product!.stock_quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <button onClick={() => navigate('/products')} className="text-blue-600 hover:underline">
          Go back to products
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-6">
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/')}>Home</span>
          {' / '}
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/products')}>Products</span>
          {' / '}
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(`/products?category=${product.category.id}`)}>
            {product.category.name}
          </span>
          {' / '}
          <span className="text-gray-800">{product.name}</span>
        </div>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Images */}
          <div>
            <div className="mb-4 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={selectedImage ? `http://localhost:8000/storage/${selectedImage}` : '/placeholder.png'}
                alt={product.name}
                className="w-full h-96 object-contain"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images?.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_path)}
                  className={`cursor-pointer border-2 rounded-lg overflow-hidden ${
                    selectedImage === img.image_path ? 'border-blue-600' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={`http://localhost:8000/storage/${img.image_path}`}
                    alt={product.name}
                    className="w-full h-20 object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.brand && `Brand: ${product.brand}`}</p>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <StarRating 
                  rating={product.average_rating || 0} 
                  size={20} 
                  showNumeric 
                  className="text-lg"
                />
                <span className="text-sm text-gray-600">
                  ({product.review_count || 0} review{product.review_count !== 1 ? 's' : ''})
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-blue-600">${Number(product.price).toFixed(2)}</span>
                {product.compare_price && product.compare_price > product.price && (
                  <>
                    <span className="text-2xl text-gray-500 line-through">${Number(product.compare_price).toFixed(2)}</span>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Save {Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock_quantity > 0 ? (
                <span className="text-green-600 font-semibold">
                  ✓ In Stock ({product.stock_quantity} available)
                </span>
              ) : (
                <span className="text-red-600 font-semibold">✗ Out of Stock</span>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock_quantity > 0 && (
              <div className="mb-6">
                <label className="block text-gray-700 mb-2 font-semibold">Quantity:</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={decrementQuantity}
                      className="px-4 py-2 hover:bg-gray-100"
                      disabled={quantity <= 1}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="px-6 py-2 border-x">{quantity}</span>
                    <button
                      onClick={incrementQuantity}
                      className="px-4 py-2 hover:bg-gray-100"
                      disabled={quantity >= product.stock_quantity}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
              <button className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 flex items-center gap-2">
                <Heart size={20} />
              </button>
            </div>

            {/* Features */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3">
                  <Truck className="text-blue-600" size={24} />
                  <div>
                    <p className="font-semibold">Free Shipping</p>
                    <p className="text-sm text-gray-600">On orders over $100</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="text-blue-600" size={24} />
                  <div>
                    <p className="font-semibold">Warranty</p>
                    <p className="text-sm text-gray-600">{product.warranty || '1 Year Manufacturer Warranty'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RefreshCw className="text-blue-600" size={24} />
                  <div>
                    <p className="font-semibold">30-Day Returns</p>
                    <p className="text-sm text-gray-600">Hassle-free returns</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b">
            <div className="flex gap-8 px-6">
              {['description', 'specifications', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 font-semibold capitalize ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'description' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Product Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
                {product.features && product.features.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Key Features:</h4>
                    <ul className="list-disc list-inside space-y-2">
                      {product.features.map((feature, index) => (
                        <li key={index} className="text-gray-700">{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Technical Specifications</h3>
                {product.specifications ? (
                  <table className="w-full">
                    <tbody>
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <tr key={key} className="border-b">
                          <td className="py-3 font-semibold capitalize">{key.replace('_', ' ')}</td>
                          <td className="py-3 text-gray-700">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-600">No specifications available</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Customer Reviews</h3>
                  <div className="flex items-center gap-4">
                    <StarRating 
                      rating={product.average_rating || 0} 
                      size={16} 
                      showNumeric 
                    />
                    <span className="text-sm text-gray-600">
                      {product.review_count || 0} review{product.review_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <StarRating rating={review.rating} size={16} readonly />
                              <span className="font-medium text-gray-900">{review.user.name}</span>
                              {review.is_verified_purchase && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(review.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        {review.title && (
                          <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                        )}
                        
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                            <ThumbsUp size={14} />
                            Helpful
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((relProduct) => (
                <div
                  key={relProduct.id}
                  onClick={() => navigate(`/products/${relProduct.slug}`)}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition cursor-pointer overflow-hidden"
                >
                  <div className="h-48 bg-gray-100">
                    {relProduct.primaryImage?.image_path ? (
                      <img
                        src={`http://localhost:8000/storage/${relProduct.primaryImage.image_path}`}
                        alt={relProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                      {relProduct.name}
                    </h3>
                    <p className="text-xl font-bold text-blue-600">
                      ${Number(relProduct.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;