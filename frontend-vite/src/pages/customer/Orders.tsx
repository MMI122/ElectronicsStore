// frontend/src/pages/customer/Orders.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/api';
import { Package, Eye, X, Truck, CheckCircle, Star } from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    product: {
      id: number;
      slug: string;
      primaryImage?: { image_path: string };
    };
  }>;
}

const CustomerOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleWriteReview = (item: any) => {
    // Navigate to reviews page with the product information
    navigate('/my-reviews', { 
      state: { 
        reviewProduct: {
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product?.primaryImage?.image_path
        }
      }
    });
  };

  const fetchOrders = async () => {
    try {
      const response = await orderService.getOrders();
      // Handle paginated response - the actual orders are in response.data.data
      const ordersData = response.data.data || response.data;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await orderService.cancelOrder(orderId);
      fetchOrders();
      alert('Order cancelled successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error cancelling order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-600';
      case 'shipped': return 'bg-blue-100 text-blue-600';
      case 'processing': return 'bg-yellow-100 text-yellow-600';
      case 'pending': return 'bg-orange-100 text-orange-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={20} />;
      case 'shipped': return <Truck size={20} />;
      default: return <Package size={20} />;
    }
  };

  const filteredOrders = Array.isArray(orders) 
    ? (filter === 'all' 
        ? orders 
        : orders.filter(order => order.status === filter))
    : [];

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
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-4">
          <div className="flex gap-4 overflow-x-auto">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
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

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
            <p className="text-gray-600">You haven't placed any orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Order #{order.order_number}</h3>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">${Number(order.total).toFixed(2)}</p>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t pt-4 mb-4">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {item.product?.primaryImage?.image_path ? (
                            <img
                              src={`http://localhost:8000/storage/${item.product.primaryImage.image_path}`}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{item.product_name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                          {order.status === 'delivered' && (
                            <button
                              onClick={() => handleWriteReview(item)}
                              className="mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:from-yellow-600 hover:to-orange-600 transition flex items-center gap-2 shadow-md"
                            >
                              <Star size={16} fill="currentColor" />
                              Write Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 border-t pt-4">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <Eye size={18} />
                    View Details
                  </button>
                  {(order.status === 'pending' || order.status === 'processing') && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {/* Order Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Order Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Order Number</p>
                      <p className="font-semibold">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600">Order Date</p>
                      <p className="font-semibold">
                        {new Date(selectedOrder.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment Status</p>
                      <p className="font-semibold capitalize">{selectedOrder.payment_status}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                        <div className="w-20 h-20 bg-gray-100 rounded">
                          {item.product?.primaryImage?.image_path && (
                            <img
                              src={`http://localhost:8000/storage/${item.product.primaryImage.image_path}`}
                              alt={item.product_name}
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{item.product_name}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm font-semibold">${Number(item.price).toFixed(2)} each</p>
                        </div>
                        <p className="font-bold">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-2xl font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">${Number(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;