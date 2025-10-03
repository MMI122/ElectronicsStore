import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  ShoppingCart, 
  User, 
  Search, 
  Menu, 
  X, 
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  Star
} from 'lucide-react';

const Header: React.FC = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-primary-600 text-white py-2 px-4 text-sm">
        <div className="container mx-auto flex justify-between items-center">
          <p>Free shipping on orders over $100</p>
          <div className="flex gap-4">
            <Link to="/track-order" className="hover:underline">Track Order</Link>
            <Link to="/help" className="hover:underline">Help</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary-600 text-white p-2 rounded-lg">
              <Package size={28} />
            </div>
            <span className="text-2xl font-bold text-gray-800 hidden sm:block">
              ElectroShop
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700"
              >
                <Search size={20} />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Wishlist */}
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="hidden sm:flex items-center gap-2 hover:text-primary-600 transition"
              >
                <Heart size={24} />
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative hover:text-primary-600 transition">
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 hover:text-primary-600 transition"
                >
                  <User size={24} />
                  <span className="hidden md:block">{user?.name}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard size={18} />
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={18} />
                      My Dashboard
                    </Link>
                    <Link
                      to="/my-orders"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Package size={18} />
                      My Orders
                    </Link>
                    <Link
                      to="/my-reviews"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Star size={18} />
                      My Reviews
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="mt-4 md:hidden">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 text-white p-2 rounded-lg"
            >
              <Search size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Navigation */}
      <nav className={`bg-gray-100 border-t ${mobileMenuOpen ? 'block' : 'hidden'} md:block`}>
        <div className="container mx-auto px-4 py-3">
          <ul className="flex flex-col md:flex-row gap-4 md:gap-8">
            <li>
              <Link to="/products" className="hover:text-primary-600 transition font-medium">
                All Products
              </Link>
            </li>
            <li>
              <Link to="/products?category=smartphones" className="hover:text-primary-600 transition">
                Smartphones
              </Link>
            </li>
            <li>
              <Link to="/products?category=laptops" className="hover:text-primary-600 transition">
                Laptops
              </Link>
            </li>
            <li>
              <Link to="/products?category=accessories" className="hover:text-primary-600 transition">
                Accessories
              </Link>
            </li>
            <li>
              <Link to="/products?featured=true" className="hover:text-primary-600 transition">
                Featured
              </Link>
            </li>
            <li>
              <Link to="/products?sort_by=price_low" className="hover:text-primary-600 transition text-red-600">
                Deals
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;