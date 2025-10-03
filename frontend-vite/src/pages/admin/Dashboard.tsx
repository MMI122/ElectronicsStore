// frontend/src/pages/admin/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import { DollarSign, ShoppingCart, Users, Package, AlertTriangle, Star } from 'lucide-react';

interface AdminStats {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  total_customers: number;
  total_products: number;
  low_stock_products: number;
  pending_reviews: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes, lowStockRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getRecentOrders(),
        adminService.getLowStock(),
      ]);
      
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data);
      setLowStockProducts(lowStockRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/admin/orders')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-800">${stats?.total_revenue ? Number(stats.total_revenue).toFixed(2) : '0.00'}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/admin/orders')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="text-blue-600" size={24} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-800">{stats?.total_orders || 0}</p>
            {stats && stats.pending_orders > 0 && (
              <p className="text-sm text-orange-600 mt-1">{stats.pending_orders} pending</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/admin/users')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Customers</h3>
            <p className="text-3xl font-bold text-gray-800">{stats?.total_customers || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/admin/products')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Package className="text-orange-600" size={24} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Products</h3>
            <p className="text-3xl font-bold text-gray-800">{stats?.total_products || 0}</p>
            {stats && stats.low_stock_products > 0 && (
              <p className="text-sm text-red-600 mt-1">{stats.low_stock_products} low stock</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/admin/reviews')}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Star className="text-yellow-600" size={24} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Reviews</h3>
            <p className="text-3xl font-bold text-gray-800">{stats?.pending_reviews || 0}</p>
            <p className="text-sm text-yellow-600 mt-1">pending approval</p>
          </div>
        </div>

        {/* Alerts */}
        {stats && stats.pending_reviews > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8 rounded-lg">
            <div className="flex items-center">
              <Star className="text-yellow-600 mr-3" size={24} />
              <div>
                <p className="font-semibold text-yellow-800">Pending Reviews</p>
                <p className="text-yellow-700">
                  You have {stats.pending_reviews} reviews waiting for approval.{' '}
                  <button onClick={() => navigate('/admin/reviews')} className="underline font-semibold">
                    Review now
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders & Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Orders</h2>
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                View All →
              </button>
            </div>

            <div className="space-y-4">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/admin/orders`)}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div>
                      <p className="font-semibold">#{order.order_number}</p>
                      <p className="text-sm text-gray-600">{order.user?.name}</p>
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
                <p className="text-center text-gray-500 py-8">No recent orders</p>
              )}
            </div>
          </div>

          {/* Low Stock Products */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="text-orange-600" size={24} />
                Low Stock Alert
              </h2>
              <button
                onClick={() => navigate('/admin/products')}
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                View All →
              </button>
            </div>

            <div className="space-y-4">
              {lowStockProducts && lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold line-clamp-1">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.category?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        product.stock_quantity === 0 ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {product.stock_quantity === 0 ? 'Out of Stock' : `${product.stock_quantity} left`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">All products are in stock</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/products/create')}
              className="p-6 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition text-center"
            >
              <Package className="mx-auto mb-2 text-blue-600" size={32} />
              <p className="font-semibold text-blue-600">Add Product</p>
            </button>
            <button
              onClick={() => navigate('/admin/categories')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-center"
            >
              <Package className="mx-auto mb-2 text-gray-600" size={32} />
              <p className="font-semibold">Manage Categories</p>
            </button>
            <button
              onClick={() => navigate('/admin/orders')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-center"
            >
              <ShoppingCart className="mx-auto mb-2 text-gray-600" size={32} />
              <p className="font-semibold">View Orders</p>
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-center"
            >
              <Users className="mx-auto mb-2 text-gray-600" size={32} />
              <p className="font-semibold">Manage Users</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;