import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { reviewService } from '../../services/api';
import { Package, Edit } from 'lucide-react';
import StarRating from '../../components/ui/StarRating';

interface ReviewableProduct {
  order_id: number;
  order_number: string;
  delivered_at: string;
  product: {
    id: number;
    name: string;
    slug: string;
    primaryImage?: { image_path: string };
  };
  quantity: number;
  can_review: boolean;
}

interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  product: {
    id: number;
    name: string;
    primaryImage?: { image_path: string };
  };
}

const ReviewsPage: React.FC = () => {
  const location = useLocation();
  const [reviewableProducts, setReviewableProducts] = useState<ReviewableProduct[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviewable' | 'my-reviews'>('reviewable');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ReviewableProduct | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: ''
  });

  useEffect(() => {
    fetchData();
    
    // Check if we came here to review a specific product
    if (location.state?.reviewProduct) {
      const reviewProduct = location.state.reviewProduct;
      // Create a mock reviewable product for the modal
      const mockProduct: ReviewableProduct = {
        order_id: 0, // We'll handle this in the backend
        order_number: 'Direct Review',
        delivered_at: new Date().toISOString(),
        product: {
          id: reviewProduct.product_id,
          name: reviewProduct.product_name,
          slug: '',
          primaryImage: reviewProduct.product_image ? { image_path: reviewProduct.product_image } : undefined
        },
        quantity: 1,
        can_review: true
      };
      setSelectedProduct(mockProduct);
      setShowReviewModal(true);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      const [reviewableRes, myReviewsRes] = await Promise.all([
        reviewService.getReviewableProducts(),
        reviewService.getMyReviews()
      ]);
      
      setReviewableProducts(reviewableRes.data);
      setMyReviews(myReviewsRes.data.data || myReviewsRes.data);
    } catch (error) {
      console.error('Error fetching review data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) return;

    try {
      const reviewData: any = {
        product_id: selectedProduct.product.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment
      };

      // Only include order_id if it's a real order (not direct review)
      if (selectedProduct.order_id > 0) {
        reviewData.order_id = selectedProduct.order_id;
      }

      await reviewService.createReview(reviewData);

      setShowReviewModal(false);
      setSelectedProduct(null);
      setReviewForm({ rating: 5, title: '', comment: '' });
      fetchData(); // Refresh data
      
      alert('Review submitted successfully! It will be visible after admin approval.');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit review. Please try again.';
      alert(errorMessage);
    }
  };

  const openReviewModal = (product: ReviewableProduct) => {
    setSelectedProduct(product);
    setShowReviewModal(true);
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
        <h1 className="text-3xl font-bold mb-8">Product Reviews</h1>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('reviewable')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviewable'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Products to Review ({reviewableProducts.length})
              </button>
              <button
                onClick={() => setActiveTab('my-reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Reviews ({myReviews.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'reviewable' ? (
          <div className="space-y-4">
            {reviewableProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Products to Review</h3>
                <p className="text-gray-600">You don't have any delivered products waiting for review.</p>
              </div>
            ) : (
              reviewableProducts.map((item) => (
                <div key={`${item.order_id}-${item.product.id}`} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={item.product.primaryImage?.image_path 
                          ? `http://localhost:8000/storage/${item.product.primaryImage.image_path}`
                          : '/placeholder.svg'
                        }
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">Order #{item.order_number}</p>
                      <p className="text-sm text-gray-600">
                        Delivered: {new Date(item.delivered_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <button
                      onClick={() => openReviewModal(item)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Write Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <div className="text-center py-12">
                <Edit size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
                <p className="text-gray-600">You haven't written any reviews yet.</p>
              </div>
            ) : (
              myReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={review.product.primaryImage?.image_path 
                          ? `http://localhost:8000/storage/${review.product.primaryImage.image_path}`
                          : '/placeholder.svg'
                        }
                        alt={review.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{review.product.name}</h3>
                      <div className="flex items-center gap-2 my-2">
                        <StarRating rating={review.rating} readonly size={16} />
                        <span className="text-sm text-gray-600">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="font-medium text-gray-800 mb-2">{review.title}</h4>
                      )}
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Write a Review</h2>
              
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                  <img
                    src={selectedProduct.product.primaryImage?.image_path 
                      ? `http://localhost:8000/storage/${selectedProduct.product.primaryImage.image_path}`
                      : '/placeholder.svg'
                    }
                    alt={selectedProduct.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{selectedProduct.product.name}</h3>
                  <p className="text-sm text-gray-600">Order #{selectedProduct.order_number}</p>
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                  </label>
                  <StarRating 
                    rating={reviewForm.rating} 
                    onChange={(rating) => setReviewForm({...reviewForm, rating})}
                    readonly={false}
                    size={24}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({...reviewForm, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Summary of your review"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment *
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    required
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Share your experience with this product..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Submit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;