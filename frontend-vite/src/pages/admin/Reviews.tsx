// frontend/src/pages/admin/Reviews.tsx - FULL PRODUCTION
import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface Review {
  id: number;
  rating: number;
  title?: string;
  comment: string;
  is_approved: boolean;
  is_verified_purchase: boolean;
  created_at: string;
  user: { name: string; email: string };
  product: { id: number; name: string; slug: string };
}

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await adminService.getReviews(params);
      setReviews(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: number) => {
    try {
      await adminService.approveReview(reviewId);
      fetchReviews();
      alert('Review approved!');
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Error approving review');
    }
  };

  const handleReject = async (reviewId: number) => {
    try {
      await adminService.rejectReview(reviewId);
      fetchReviews();
      alert('Review rejected!');
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('Error rejecting review');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}
            fill={star <= rating ? 'currentColor' : 'none'}
          />
        ))}
      </div>
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Reviews Management</h1>
          <p className="text-gray-600 mt-1">{reviews.length} total reviews</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4">
            {['all', 'pending', 'approved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Star size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No reviews found</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {renderStars(review.rating)}
                      <span className="font-bold text-gray-800">
                        {review.rating}.0
                      </span>
                      {review.is_verified_purchase && (
                        <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full font-semibold">
                          Verified Purchase
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        review.is_approved
                          ? 'bg-green-100 text-green-600'
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {review.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    {review.title && (
                      <h3 className="font-bold text-lg mb-2">{review.title}</h3>
                    )}
                    <p className="text-gray-700 mb-3">{review.comment}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>By: <strong>{review.user.name}</strong></span>
                      <span>•</span>
                      <span>Product: <strong>{review.product.name}</strong></span>
                      <span>•</span>
                      <span>{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!review.is_approved && (
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                        title="Approve"
                      >
                        <CheckCircle size={20} />
                      </button>
                    )}
                    {review.is_approved && (
                      <button
                        onClick={() => handleReject(review.id)}
                        className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition"
                        title="Unapprove"
                      >
                        <XCircle size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;