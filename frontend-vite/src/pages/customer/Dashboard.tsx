// frontend/src/pages/customer/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/api';
import { Package, ShoppingBag, Heart, DollarSign, TrendingUp, Clock } from 'lucide-react';

interface DashboardData {
  stats: {
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    total_spent: number;
    total_reviews: number;
    wishlist_count: number;
  };
  recent_orders: any[];
  recent_activities: any[];
}

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardService.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = dashboardData?.stats;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-blue-100">Here's what's happening with your account</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/my-orders')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="text-blue-600" size={24} />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats?.total_orders || 0}</h3>
            <p className="text-gray-600">Orders</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/my-orders?status=pending')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats?.pending_orders || 0}</h3>
            <p className="text-gray-600">Pending Orders</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/wishlist')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-pink-100 p-3 rounded-lg">
                <Heart className="text-pink-600" size={24} />
              </div>
              <span className="text-sm text-gray-500">Saved</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats?.wishlist_count || 0}</h3>
            <p className="text-gray-600">Wishlist Items</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/analytics')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <span className="text-sm text-gray-500">Spent</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">${stats?.total_spent?.toFixed(2) || '0.00'}</h3>
            <p className="text-gray-600">Total Spent</p>
          </div>
        </div>

        {/* Recent Orders & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Orders</h2>
              <button
                onClick={() => navigate('/my-orders')}
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                View All →
              </button>
            </div>

            <div className="space-y-4">
              {dashboardData?.recent_orders && dashboardData.recent_orders.length > 0 ? (
                dashboardData.recent_orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/my-orders`)}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Package className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="font-semibold">Order #{order.order_number}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">${order.total}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No orders yet</p>
                  <button
                    onClick={() => navigate('/products')}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <TrendingUp className="text-gray-400" size={24} />
            </div>

            <div className="space-y-4">
              {dashboardData?.recent_activities && dashboardData.recent_activities.length > 0 ? (
                dashboardData.recent_activities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      {activity.activity_type === 'purchase' && <ShoppingBag size={16} className="text-green-600" />}
                      {activity.activity_type === 'wishlist' && <Heart size={16} className="text-pink-600" />}
                      {activity.activity_type === 'view' && <Package size={16} className="text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        {activity.activity_type === 'purchase' && 'Purchased '}
                        {activity.activity_type === 'wishlist' && 'Added to wishlist '}
                        {activity.activity_type === 'view' && 'Viewed '}
                        <span className="font-semibold">{activity.product?.name}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/products')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-center"
            >
              <ShoppingBag className="mx-auto mb-2 text-blue-600" size={32} />
              <p className="font-semibold">Shop Now</p>
            </button>
            <button
              onClick={() => navigate('/my-orders')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-center"
            >
              <Package className="mx-auto mb-2 text-blue-600" size={32} />
              <p className="font-semibold">My Orders</p>
            </button>
            <button
              onClick={() => navigate('/wishlist')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-center"
            >
              <Heart className="mx-auto mb-2 text-blue-600" size={32} />
              <p className="font-semibold">Wishlist</p>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-center"
            >
              <TrendingUp className="mx-auto mb-2 text-blue-600" size={32} />
              <p className="font-semibold">Analytics</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;