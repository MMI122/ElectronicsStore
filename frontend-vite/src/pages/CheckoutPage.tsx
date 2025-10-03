// frontend/src/pages/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';
import { CreditCard, Truck, CheckCircle } from 'lucide-react';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, subtotal, clearCart } = useCart();

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);

  // Shipping Information
  const [shippingInfo, setShippingInfo] = useState({
    shipping_name: user?.name || '',
    shipping_email: user?.email || '',
    shipping_phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_country: 'Bangladesh',
    shipping_postal_code: '',
  });

  // Payment Information
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [billingAsShipping, setBillingAsShipping] = useState(true);
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const tax = subtotal * 0.1;
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + tax + shipping;

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        ...shippingInfo,
        payment_method: paymentMethod,
        billing_same_as_shipping: billingAsShipping,
        notes: '',
        stripe_token: paymentMethod === 'stripe' ? 'tok_visa' : undefined, // Demo token
      };

      const response = await orderService.createOrder(orderData);
      
      await clearCart();
      setStep(3);
      
      // Redirect to order details after 3 seconds
      setTimeout(() => {
        navigate(`/my-orders`);
      }, 3000);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating order');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          <button
            onClick={() => navigate('/my-orders')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="font-semibold">Shipping</span>
            </div>
            <div className="w-20 h-1 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="font-semibold">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Truck className="text-blue-600" size={24} />
                  <h2 className="text-2xl font-bold">Shipping Information</h2>
                </div>

                <form onSubmit={handleShippingSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={shippingInfo.shipping_name}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_name: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={shippingInfo.shipping_email}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_email: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Phone *</label>
                      <input
                        type="tel"
                        value={shippingInfo.shipping_phone}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_phone: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Country *</label>
                      <select
                        value={shippingInfo.shipping_country}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_country: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="Bangladesh">Bangladesh</option>
                        <option value="India">India</option>
                        <option value="Pakistan">Pakistan</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 mb-2">Address *</label>
                      <textarea
                        value={shippingInfo.shipping_address}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_address: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">City *</label>
                      <input
                        type="text"
                        value={shippingInfo.shipping_city}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_city: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">State/Province *</label>
                      <input
                        type="text"
                        value={shippingInfo.shipping_state}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_state: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Postal Code *</label>
                      <input
                        type="text"
                        value={shippingInfo.shipping_postal_code}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_postal_code: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Continue to Payment
                  </button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="text-blue-600" size={24} />
                  <h2 className="text-2xl font-bold">Payment Method</h2>
                </div>

                <form onSubmit={handlePaymentSubmit}>
                  {/* Payment Method Selection */}
                  <div className="mb-6">
                    <label className="flex items-center gap-3 p-4 border rounded-lg mb-3 cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="stripe"
                        checked={paymentMethod === 'stripe'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600"
                      />
                      <CreditCard size={24} />
                      <span className="font-semibold">Credit/Debit Card (Stripe)</span>
                    </label>

                    <label className="flex items-center gap-3 p-4 border rounded-lg mb-3 cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600"
                      />
                      <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" className="h-6" />
                      <span className="font-semibold">PayPal</span>
                    </label>

                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600"
                      />
                      <Truck size={24} />
                      <span className="font-semibold">Cash on Delivery</span>
                    </label>
                  </div>

                  {/* Card Details (if Stripe) */}
                  {paymentMethod === 'stripe' && (
                    <div className="mb-6 p-4 border rounded-lg">
                      <p className="text-sm text-gray-600 mb-4">Demo Mode: Use test card 4242 4242 4242 4242</p>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-gray-700 mb-2">Card Number</label>
                          <input
                            type="text"
                            placeholder="4242 4242 4242 4242"
                            value={cardInfo.cardNumber}
                            onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-2">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="John Doe"
                            value={cardInfo.cardName}
                            onChange={(e) => setCardInfo({ ...cardInfo, cardName: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 mb-2">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={cardInfo.expiryDate}
                              onChange={(e) => setCardInfo({ ...cardInfo, expiryDate: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 mb-2">CVV</label>
                            <input
                              type="text"
                              placeholder="123"
                              value={cardInfo.cvv}
                              onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {loading ? 'Processing...' : `Place Order ($${total.toFixed(2)})`}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              {/* Cart Items */}
              <div className="mb-4 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 mb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded">
                      {item.product.primaryImage?.image_path && (
                        <img
                          src={`http://localhost:8000/storage/${item.product.primaryImage.image_path}`}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0 ? <span className="text-green-600">FREE</span> : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;