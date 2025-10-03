import React from 'react';

const SimpleHomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-6">
          🛒 Electronics Store
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Our Store!</h2>
          <p className="text-gray-600 mb-4">
            Your Vite React TypeScript app is working perfectly! 
          </p>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ Frontend is running successfully on Vite
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">🎯 Featured Products</h3>
            <p className="text-gray-600">Products will appear here when backend is connected</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">🆕 New Arrivals</h3>
            <p className="text-gray-600">Latest products coming soon</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">⭐ Top Rated</h3>
            <p className="text-gray-600">Best products by customer reviews</p>
          </div>
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Next Steps:</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• Start your Laravel backend: <code className="bg-blue-100 px-2 py-1 rounded">php artisan serve</code></li>
            <li>• Check browser console (F12) for any errors</li>
            <li>• Verify API endpoints are working</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SimpleHomePage;