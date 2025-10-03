<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use App\Models\Category;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function stats()
    {
        try {
            $totalUsers = User::where('role', '!=', 'admin')->count();
            $totalOrders = Order::count();
            $totalProducts = Product::count();
            $totalRevenue = Order::where('payment_status', 'paid')->sum('total');
            
            // Additional stats for dashboard
            $pendingOrders = Order::where('status', 'pending')->count();
            $lowStockProducts = Product::where('stock_quantity', '<=', 10)->count();
            $pendingReviews = Review::where('is_approved', false)->count();
            
            $recentOrders = Order::with(['user', 'items'])
                ->latest()
                ->take(5)
                ->get();

            return response()->json([
                'total_users' => $totalUsers,
                'total_orders' => $totalOrders,
                'total_products' => $totalProducts,
                'total_revenue' => (float) $totalRevenue,
                'pending_orders' => $pendingOrders,
                'total_customers' => $totalUsers, // Same as total_users for now
                'low_stock_products' => $lowStockProducts,
                'pending_reviews' => $pendingReviews,
                'recent_orders' => $recentOrders
            ]);
        } catch (\Exception $e) {
            \Log::error('Admin stats error: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Failed to fetch dashboard stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getUsers(Request $request)
    {
        try {
            $query = User::query();

            // Filter by role (exclude admins by default unless requested)
            if ($request->has('include_admins') && $request->include_admins) {
                // Include all users
            } else {
                $query->where('role', '!=', 'admin');
            }

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $isActive = $request->status === 'active' ? 1 : 0;
                $query->where('is_active', $isActive);
            }

            $users = $query->latest()->paginate(15);

            // Add basic stats for each user
            $users->getCollection()->transform(function ($user) {
                $totalSpent = $user->orders()
                    ->where('payment_status', 'paid')
                    ->sum('total');
                
                $user->stats = [
                    'total_spent' => $totalSpent ?: 0,
                    'total_orders' => $user->orders()->count(),
                    'last_order' => $user->orders()->latest()->first()?->created_at
                ];
                
                return $user;
            });

            return response()->json($users);
        } catch (\Exception $e) {
            \Log::error('Admin getUsers error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'error' => 'Failed to fetch users',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getUser(User $user)
    {
        $user->load(['orders.items.product']);
        
        $stats = [
            'total_spent' => $user->orders()->where('payment_status', 'paid')->sum('total'),
            'total_orders' => $user->orders()->count(),
            'avg_order_value' => $user->orders()->where('payment_status', 'paid')->avg('total'),
            'last_order' => $user->orders()->latest()->first()
        ];

        return response()->json([
            'user' => $user,
            'stats' => $stats
        ]);
    }

    public function toggleUserStatus(User $user)
    {
        $user->is_active = !$user->is_active;
        $user->save();

        return response()->json([
            'message' => 'User status updated successfully',
            'user' => $user
        ]);
    }

    public function recentOrders()
    {
        $orders = Order::with(['user', 'items.product'])
            ->latest()
            ->take(10)
            ->get();

        return response()->json($orders);
    }

    public function salesData(Request $request)
    {
        $period = $request->get('period', '30days');
        
        $query = Order::where('payment_status', 'paid');
        
        switch ($period) {
            case '7days':
                $query->where('created_at', '>=', now()->subDays(7));
                break;
            case '30days':
                $query->where('created_at', '>=', now()->subDays(30));
                break;
            case '3months':
                $query->where('created_at', '>=', now()->subMonths(3));
                break;
            case '6months':
                $query->where('created_at', '>=', now()->subMonths(6));
                break;
            case '1year':
                $query->where('created_at', '>=', now()->subYear());
                break;
        }

        $salesData = $query->selectRaw('DATE(created_at) as date, SUM(total) as total, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($salesData);
    }

    public function topProducts(Request $request)
    {
        $period = $request->get('period', '30days');
        
        $query = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.payment_status', 'paid');
            
        switch ($period) {
            case '7days':
                $query->where('orders.created_at', '>=', now()->subDays(7));
                break;
            case '30days':
                $query->where('orders.created_at', '>=', now()->subDays(30));
                break;
            case '3months':
                $query->where('orders.created_at', '>=', now()->subMonths(3));
                break;
        }

        $topProducts = $query->select(
                'products.name',
                'products.slug',
                DB::raw('SUM(order_items.quantity) as total_sold'),
                DB::raw('SUM(order_items.total) as total_revenue')
            )
            ->groupBy('products.id', 'products.name', 'products.slug')
            ->orderBy('total_sold', 'desc')
            ->take(10)
            ->get();

        return response()->json($topProducts);
    }

    public function lowStock()
    {
        try {
            $lowStockProducts = Product::with(['category', 'primaryImage'])
                ->where('stock_quantity', '<=', 10)
                ->orderBy('stock_quantity', 'asc')
                ->get();

            return response()->json($lowStockProducts);
        } catch (\Exception $e) {
            \Log::error('Low stock error: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Failed to fetch low stock products',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}