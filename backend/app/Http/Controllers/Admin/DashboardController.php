<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_revenue' => 0, // TODO: Calculate from orders
            'total_orders' => 0,  // TODO: Calculate from orders
            'pending_orders' => 0, // TODO: Calculate from orders
            'total_customers' => User::where('role', 'customer')->count(),
            'total_products' => Product::count(),
            'low_stock_products' => Product::whereRaw('stock_quantity <= low_stock_threshold')->count(),
            'pending_reviews' => 0, // TODO: Calculate from reviews
        ];

        return response()->json($stats);
    }

    public function recentOrders()
    {
        // For now return empty array since orders table might not have data
        return response()->json([]);
    }

    public function lowStock()
    {
        $lowStockProducts = Product::whereRaw('stock_quantity <= low_stock_threshold')
            ->with('category')
            ->get();

        return response()->json($lowStockProducts);
    }
}