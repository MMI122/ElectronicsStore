<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CartOrderController;
use App\Http\Controllers\Api\UserDashboardController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public product routes
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/featured', [ProductController::class, 'featured']);
    Route::get('/new-arrivals', [ProductController::class, 'newArrivals']);
    Route::get('/top-rated', [ProductController::class, 'topRated']);
    Route::get('/search', [ProductController::class, 'search']);
    Route::get('/brands', [ProductController::class, 'brands']);
    Route::get('/price-range', [ProductController::class, 'priceRange']);
    Route::get('/{slug}', [ProductController::class, 'show']);
});

// Public category routes
Route::get('/categories', [AdminCategoryController::class, 'index']);
Route::get('/categories/tree', [AdminCategoryController::class, 'tree']);
Route::get('/categories/{category}', [AdminCategoryController::class, 'show']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::delete('/account', [AuthController::class, 'deleteAccount']);

    // Cart routes
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartOrderController::class, 'getCart']);
        Route::post('/add', [CartOrderController::class, 'addToCart']);
        Route::put('/{cartItem}', [CartOrderController::class, 'updateCartItem']);
        Route::delete('/{cartItem}', [CartOrderController::class, 'removeFromCart']);
        Route::delete('/', [CartOrderController::class, 'clearCart']);
    });

    // Order routes
    Route::prefix('orders')->group(function () {
        Route::get('/', [CartOrderController::class, 'getOrders']);
        Route::post('/', [CartOrderController::class, 'createOrder']);
        Route::get('/{order}', [CartOrderController::class, 'getOrder']);
        Route::post('/{order}/cancel', [CartOrderController::class, 'cancelOrder']);
    });

    // Wishlist routes
    Route::prefix('wishlist')->group(function () {
        Route::get('/', [WishlistController::class, 'index']);
        Route::post('/add', [WishlistController::class, 'add']);
        Route::delete('/{product}', [WishlistController::class, 'remove']);
    });

    // Review routes
    Route::prefix('reviews')->group(function () {
        Route::post('/', [ReviewController::class, 'store']);
        Route::put('/{review}', [ReviewController::class, 'update']);
        Route::delete('/{review}', [ReviewController::class, 'destroy']);
        Route::post('/{review}/helpful', [ReviewController::class, 'markHelpful']);
    });

    // User dashboard routes
    Route::prefix('dashboard')->group(function () {
        Route::get('/', [UserDashboardController::class, 'getDashboard']);
        Route::get('/analytics/spending', [UserDashboardController::class, 'getSpendingAnalytics']);
        Route::get('/analytics/purchases', [UserDashboardController::class, 'getPurchaseStats']);
        Route::get('/orders/history', [UserDashboardController::class, 'getOrderHistory']);
        Route::get('/preferences', [UserDashboardController::class, 'getPreferences']);
        Route::put('/preferences', [UserDashboardController::class, 'updatePreferences']);
    });

    // Recommendations (ML-powered)
    Route::get('/recommendations', [ProductController::class, 'recommendations']);

    // Admin routes (temporarily commented out - we'll enable after creating controllers)
    /*
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::apiResource('products', AdminProductController::class);
        Route::apiResource('categories', AdminCategoryController::class);
    });
    */
});