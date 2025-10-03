// frontend/src/pages/customer/Analytics.tsx
import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/api';
import { TrendingUp, DollarSign, Package, ShoppingBag } from 'lucide-react';

interface AnalyticsData {
  category_breakdown: Array<{
    category: string;
    total_spent: number;
    items_purchased: number;
  }>;
  monthly_trend: Array<{
    month: string;
    total_spent: number;
    order_count: number;
  }>;
  top_products: Array<{
    id: number;
    name: string;
    total_quantity: number;
    total_spent: number;
  }>;
  average_order_value: number;
  total_items_purchased: number;
}

const CustomerAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await dashboardService.getPurchaseStats();
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  const totalSpent = analyticsData?.category_breakdown?.reduce((sum, cat) => sum + parseFloat(cat.total_spent as any), 0) || 0;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <TrendingUp className="text-blue-600" />
            Purchase Analytics
          </h1>
          <p className="text-gray-600">Track your spending and purchase patterns</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign size={32} />
              <span className="text-sm opacity-80">Total Spent</span>
            </div>
            <h3 className="text-3xl font-bold">${totalSpent.toFixed(2)}</h3>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Package size={32} />
              <span className="text-sm opacity-80">Items Purchased</span>
            </div>
            <h3 className="text-3xl font-bold">{analyticsData?.total_items_purchased || 0}</h3>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag size={32} />
              <span className="text-sm opacity-80">Avg Order Value</span>
            </div>
            <h3 className="text-3xl font-bold">${analyticsData?.average_order_value?.toFixed(2) || '0.00'}</h3>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp size={32} />
              <span className="text-sm opacity-80">Categories</span>
            </div>
            <h3 className="text-3xl font-bold">{analyticsData?.category_breakdown?.length || 0}</h3>
          </div>
        </div>

        {/* Monthly Spending Trend */}
        {analyticsData?.monthly_trend && analyticsData.monthly_trend.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">Monthly Spending Trend</h2>
            <div className="space-y-4">
              {analyticsData.monthly_trend.map((month, index) => {
                const maxSpending = Math.max(...analyticsData.monthly_trend.map(m => parseFloat(m.total_spent as any)));
                const percentage = (parseFloat(month.total_spent as any) / maxSpending) * 100;
                
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{month.order_count} orders</span>
                        <span className="text-lg font-bold text-blue-600">${parseFloat(month.total_spent as any).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Breakdown & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Spending by Category</h2>
            {analyticsData?.category_breakdown && analyticsData.category_breakdown.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.category_breakdown.map((category, index) => {
                  const percentage = (parseFloat(category.total_spent as any) / totalSpent) * 100;
                  
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-700">{category.category}</span>
                        <span className="text-blue-600 font-bold">${parseFloat(category.total_spent as any).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{percentage.toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{category.items_purchased} items purchased</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No category data available</p>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Your Top Products</h2>
            {analyticsData?.top_products && analyticsData.top_products.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.top_products.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 line-clamp-1">{product.name}</p>
                      <p className="text-sm text-gray-600">Qty: {product.total_quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">${parseFloat(product.total_spent as any).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No product data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;