import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data: any) => api.post('/register', data),
  login: (data: any) => api.post('/login', data),
  logout: () => api.post('/logout'),
  getProfile: () => api.get('/profile'),
  updateProfile: (data: any) => api.put('/profile', data),
  changePassword: (data: any) => api.post('/change-password', data),
};

export const productService = {
  getProducts: (params?: any) => api.get('/products', { params }),
  getProduct: (slug: string) => api.get(`/products/${slug}`),
  getFeatured: () => api.get('/products/featured'),
  getNewArrivals: () => api.get('/products/new-arrivals'),
  getTopRated: () => api.get('/products/top-rated'),
  search: (query: string) => api.get('/products/search', { params: { q: query } }),
  getRecommendations: () => api.get('/products/recommendations'),
  getBrands: () => api.get('/products/brands'),
  getPriceRange: () => api.get('/products/price-range'),
  getProductReviews: (productId: number, params?: any) => api.get(`/products/${productId}/reviews`, { params }),
};

export const categoryService = {
  getCategories: () => api.get('/categories'),
  getCategory: (id: number) => api.get(`/categories/${id}`),
  getCategoryTree: () => api.get('/categories/tree'),
};

export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (data: any) => api.post('/cart/add', data),
  updateCart: (id: number, data: any) => api.put(`/cart/${id}`, data),
  removeFromCart: (id: number) => api.delete(`/cart/${id}`),
  clearCart: () => api.delete('/cart'),
};

export const orderService = {
  getOrders: () => api.get('/orders'),
  getOrder: (id: number) => api.get(`/orders/${id}`),
  createOrder: (data: any) => api.post('/orders', data),
  cancelOrder: (id: number) => api.post(`/orders/${id}/cancel`),
};

export const wishlistService = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (productId: number) => api.post('/wishlist/add', { product_id: productId }),
  removeFromWishlist: (productId: number) => api.delete(`/wishlist/${productId}`),
};

export const reviewService = {
  getReviewableProducts: () => api.get('/reviews/reviewable-products'),
  getMyReviews: () => api.get('/reviews/my-reviews'),
  createReview: (data: any) => api.post('/reviews', data),
  updateReview: (id: number, data: any) => api.put(`/reviews/${id}`, data),
  deleteReview: (id: number) => api.delete(`/reviews/${id}`),
  markHelpful: (id: number) => api.post(`/reviews/${id}/helpful`),
};

export const dashboardService = {
  getDashboard: () => api.get('/dashboard'),
  getSpendingAnalytics: (period: string) => api.get('/dashboard/analytics/spending', { params: { period } }),
  getPurchaseStats: () => api.get('/dashboard/analytics/purchases'),
  getOrderHistory: (period: string) => api.get('/dashboard/orders/history', { params: { period } }),
  getPreferences: () => api.get('/dashboard/preferences'),
  updatePreferences: (data: any) => api.put('/dashboard/preferences', data),
};

export const adminService = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getStats: () => api.get('/admin/dashboard/stats'),
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders'),
  getLowStock: () => api.get('/admin/dashboard/low-stock'),
  
  // Products
  getProducts: (params?: any) => api.get('/admin/products', { params }),
  createProduct: (data: any) => api.post('/admin/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProduct: (id: number, data: any) => api.post(`/admin/products/${id}`, {
    ...data,
    _method: 'PUT'
  }, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProduct: (id: number) => api.delete(`/admin/products/${id}`),
  bulkDeleteProducts: (ids: number[]) => api.post('/admin/products/bulk-delete', { product_ids: ids }),
  deleteProductImage: (productId: number, imageId: number) => 
    api.delete(`/admin/products/${productId}/images/${imageId}`),
  
  // Categories
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data: any) => api.post('/admin/categories', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateCategory: (id: number, data: any) => api.post(`/admin/categories/${id}`, {
    ...data,
    _method: 'PUT'
  }, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),
  
  // Orders
  getOrders: (params?: any) => api.get('/admin/orders', { params }),
  getOrder: (id: number) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id: number, status: string) => 
    api.put(`/admin/orders/${id}/status`, { status }),
  updatePaymentStatus: (id: number, status: string) => 
    api.put(`/admin/orders/${id}/payment-status`, { payment_status: status }),
  
  // Reviews
  getReviews: (params?: any) => api.get('/admin/reviews', { params }),
  approveReview: (id: number) => api.post(`/admin/reviews/${id}/approve`),
  rejectReview: (id: number) => api.post(`/admin/reviews/${id}/reject`),
  
  // Users
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getUser: (id: number) => api.get(`/admin/users/${id}`),
  toggleUserStatus: (id: number) => api.put(`/admin/users/${id}/toggle-status`),
};

export default api;