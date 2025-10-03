// frontend/src/pages/admin/Orders.tsx - FULL PRODUCTION
import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import { Package, Eye, X, Truck, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  user: { id: number; name: string; email: string };
  items: Array<{
    id: number;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  shipping_address: string;
  shipping_city: string;
  shipping_phone: string;
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState({ status: '', payment_status: '', search: '' });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter.status) params.status = filter.status;
      if (filter.payment_status) params.payment_status = filter.payment_status;
      if (filter.search) params.search = filter.search;

      const response = await adminService.getOrders(params);
      setOrders(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await adminService.updateOrderStatus(orderId, status);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updated = await adminService.getOrder(orderId);
        setSelectedOrder(updated.data);
      }
      alert('Order status updated!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating order status');
    }
  };

  const handleUpdatePaymentStatus = async (orderId: number, paymentStatus: string) => {
    try {
      await adminService.updatePaymentStatus(orderId, paymentStatus);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updated = await adminService.getOrder(orderId);
        setSelectedOrder(updated.data);
      }
      alert('Payment status updated!');
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-600',
      processing: 'bg-blue-100 text-blue-600',
      shipped: 'bg-purple-100 text-purple-600',
      delivered: 'bg-green-100 text-green-600',
      cancelled: 'bg-red-100 text-red-600',
      refunded: 'bg-gray-100 text-gray-600',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-600';
  };

  const getPaymentBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-600',
      paid: 'bg-green-100 text-green-600',
      failed: 'bg-red-100 text-red-600',
      refunded: 'bg-gray-100 text-gray-600',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={20} />;
      case 'shipped': return <Truck size={20} />;
      case 'processing': return <Clock size={20} />;
      case 'cancelled': return <XCircle size={20} />;
      default: return <Package size={20} />;
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Orders Management</h1>
          <p className="text-gray-600 mt-1">{orders.length} total orders</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by order number, customer..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && fetchOrders()}
              className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filter.payment_status}
              onChange={(e) => setFilter({ ...filter, payment_status: e.target.value })}
              className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
            <button
              onClick={fetchOrders}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Order</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Payment</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Package size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-800">#{order.order_number}</p>
                          <p className="text-sm text-gray-600">{order.items.length} items</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-800">{order.user.name}</p>
                          <p className="text-sm text-gray-600">{order.user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-800">${Number(order.total).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentBadge(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 ml-auto"
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Order #{selectedOrder.order_number}</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {/* Order Status Management */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4">Order Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Order Status
                      </label>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Payment Status
                      </label>
                      <select
                        value={selectedOrder.payment_status}
                        onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-4">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-semibold">{selectedOrder.user.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-semibold">{selectedOrder.user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-semibold">{selectedOrder.shipping_phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Order Date</p>
                      <p className="font-semibold">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-4">Shipping Address</h3>
                  <p className="text-gray-700">
                    {selectedOrder.shipping_address}<br />
                    {selectedOrder.shipping_city}
                  </p>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-4">Order Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Quantity</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Price</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 font-semibold">{item.product_name}</td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">${Number(item.price).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-semibold">
                              ${(Number(item.price) * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Order Total</span>
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

export default AdminOrders;