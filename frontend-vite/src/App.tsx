import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import TestPage from './TestPage';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Public Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';

// Customer Protected Pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerOrders from './pages/customer/Orders';
import CustomerProfile from './pages/customer/Profile';
import CustomerWishlist from './pages/customer/Wishlist';
import CustomerAnalytics from './pages/customer/Analytics';
import CustomerReviews from './pages/customer/Reviews';

// Admin Protected Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductForm from './pages/admin/ProductForm';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import AdminReviews from './pages/admin/Reviews';
import AdminUsers from './pages/admin/Users';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import DashboardRedirect from './components/DashboardRedirect';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
              <Routes>
                {/* Test Route */}
                <Route path="/test" element={<TestPage />} />
                
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/cart" element={<CartPage />} />
                
                {/* Dashboard Redirect */}
                <Route path="/dashboard" element={<DashboardRedirect />} />
                
                {/* Protected Customer Routes */}
                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/customer/dashboard" element={
                  <ProtectedRoute>
                    <CustomerDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/my-orders" element={
                  <ProtectedRoute>
                    <CustomerOrders />
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <CustomerProfile />
                  </ProtectedRoute>
                } />
                
                <Route path="/wishlist" element={
                  <ProtectedRoute>
                    <CustomerWishlist />
                  </ProtectedRoute>
                } />
                
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <CustomerAnalytics />
                  </ProtectedRoute>
                } />
                
                <Route path="/my-reviews" element={
                  <ProtectedRoute>
                    <CustomerReviews />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                
                <Route path="/admin/products" element={
                  <AdminRoute>
                    <AdminProducts />
                  </AdminRoute>
                } />
                
                <Route path="/admin/products/create" element={
                  <AdminRoute>
                    <AdminProductForm />
                  </AdminRoute>
                } />
                
                <Route path="/admin/products/edit/:id" element={
                  <AdminRoute>
                    <AdminProductForm />
                  </AdminRoute>
                } />
                
                <Route path="/admin/categories" element={
                  <AdminRoute>
                    <AdminCategories />
                  </AdminRoute>
                } />
                
                <Route path="/admin/orders" element={
                  <AdminRoute>
                    <AdminOrders />
                  </AdminRoute>
                } />
                
                <Route path="/admin/reviews" element={
                  <AdminRoute>
                    <AdminReviews />
                  </AdminRoute>
                } />
                
                <Route path="/admin/users" element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                } />
                
                {/* 404 Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;