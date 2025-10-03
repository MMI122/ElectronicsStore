<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\UserActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UserDashboardController extends Controller
{
    public function getDashboard(Request $request)
    {
        $user = $request->user();

        $stats = [
            'total_orders' => $user->orders()->count(),
            'pending_orders' => $user->orders()->where('status', 'pending')->count(),
            'completed_orders' => $user->orders()->where('status', 'delivered')->count(),
            'total_spent' => $user->orders()->where('payment_status', 'paid')->sum('total'),
            'total_reviews' => $user->reviews()->count(),
            'wishlist_count' => $user->wishlists()->count(),
        ];

        $recentOrders = $user->orders()
            ->with(['items.product.primaryImage'])
            ->latest()
            ->take(5)
            ->get();

        $recentActivities = UserActivity::with('product')
            ->where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get();

        return response()->json([
            'stats' => $stats,
            'recent_orders' => $recentOrders,
            'recent_activities' => $recentActivities,
        ]);
    }

    public function getSpendingAnalytics(Request $request)
    {
        $user = $request->user();
        $period = $request->input('period', 'month'); // day, week, month, year

        $dateFormat = match($period) {
            'day' => '%Y-%m-%d %H:00:00',
            'week' => '%Y-%m-%d',
            'month' => '%Y-%m-%d',
            'year' => '%Y-%m',
            default => '%Y-%m-%d'
        };

        $startDate = match($period) {
            'day' => Carbon::now()->subDay(),
            'week' => Carbon::now()->subWeek(),
            'month' => Carbon::now()->subMonth(),
            'year' => Carbon::now()->subYear(),
            default => Carbon::now()->subMonth()
        };

        $spendingData = Order::where('user_id', $user->id)
            ->where('payment_status', 'paid')
            ->where('created_at', '>=', $startDate)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '$dateFormat') as date"),
                DB::raw('SUM(total) as total_spent'),
                DB::raw('COUNT(*) as order_count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'period' => $period,
            'data' => $spendingData
        ]);
    }

    public function getPurchaseStats(Request $request)
    {
        $user = $request->user();

        // Category breakdown
        $categoryStats = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->where('orders.user_id', $user->id)
            ->where('orders.payment_status', 'paid')
            ->select(
                'categories.name as category',
                DB::raw('SUM(order_items.total) as total_spent'),
                DB::raw('SUM(order_items.quantity) as items_purchased')
            )
            ->groupBy('categories.id', 'categories.name')
            ->orderBy('total_spent', 'desc')
            ->get();

        // Monthly spending trend (last 12 months)
        $monthlyTrend = Order::where('user_id', $user->id)
            ->where('payment_status', 'paid')
            ->where('created_at', '>=', Carbon::now()->subYear())
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('SUM(total) as total_spent'),
                DB::raw('COUNT(*) as order_count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Top purchased products
        $topProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.user_id', $user->id)
            ->where('orders.payment_status', 'paid')
            ->select(
                'products.id',
                'products.name',
                'products.slug',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.total) as total_spent')
            )
            ->groupBy('products.id', 'products.name', 'products.slug')
            ->orderBy('total_quantity', 'desc')
            ->limit(10)
            ->get();

        // Average order value
        $avgOrderValue = Order::where('user_id', $user->id)
            ->where('payment_status', 'paid')
            ->avg('total');

        return response()->json([
            'category_breakdown' => $categoryStats,
            'monthly_trend' => $monthlyTrend,
            'top_products' => $topProducts,
            'average_order_value' => round($avgOrderValue, 2),
            'total_items_purchased' => $categoryStats->sum('items_purchased')
        ]);
    }

    public function getOrderHistory(Request $request)
    {
        $period = $request->input('period', 'all'); // all, month, year

        $query = Order::where('user_id', $request->user()->id)
            ->with(['items.product.primaryImage']);

        if ($period === 'month') {
            $query->where('created_at', '>=', Carbon::now()->subMonth());
        } elseif ($period === 'year') {
            $query->where('created_at', '>=', Carbon::now()->subYear());
        }

        $orders = $query->latest()->paginate(15);

        return response()->json($orders);
    }

    public function getPreferences(Request $request)
    {
        $user = $request->user();
        
        // Analyze user preferences based on activity
        $categoryPreferences = DB::table('user_activities')
            ->join('products', 'user_activities.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->where('user_activities.user_id', $user->id)
            ->select(
                'categories.id',
                'categories.name',
                DB::raw('COUNT(*) as interaction_count')
            )
            ->groupBy('categories.id', 'categories.name')
            ->orderBy('interaction_count', 'desc')
            ->limit(5)
            ->get();

        $brandPreferences = DB::table('user_activities')
            ->join('products', 'user_activities.product_id', '=', 'products.id')
            ->where('user_activities.user_id', $user->id)
            ->whereNotNull('products.brand')
            ->select(
                'products.brand',
                DB::raw('COUNT(*) as interaction_count')
            )
            ->groupBy('products.brand')
            ->orderBy('interaction_count', 'desc')
            ->limit(5)
            ->get();

        $priceRangePreference = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $user->id)
            ->where('orders.payment_status', 'paid')
            ->select(
                DB::raw('AVG(order_items.price) as avg_price'),
                DB::raw('MIN(order_items.price) as min_price'),
                DB::raw('MAX(order_items.price) as max_price')
            )
            ->first();

        return response()->json([
            'favorite_categories' => $categoryPreferences,
            'favorite_brands' => $brandPreferences,
            'price_range' => $priceRangePreference,
            'user_preferences' => $user->preferences ?? []
        ]);
    }

    public function updatePreferences(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.newsletter' => 'boolean',
            'preferences.notifications' => 'boolean',
            'preferences.favorite_categories' => 'array',
            'preferences.price_range_min' => 'numeric|min:0',
            'preferences.price_range_max' => 'numeric|min:0',
        ]);

        $user = $request->user();
        $user->update(['preferences' => $validated['preferences']]);

        return response()->json([
            'message' => 'Preferences updated successfully',
            'preferences' => $user->preferences
        ]);
    }
}
