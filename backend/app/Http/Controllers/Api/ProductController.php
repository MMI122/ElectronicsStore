<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\UserActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $cacheKey = 'products_' . md5(json_encode($request->all()));
        
        $products = Cache::remember($cacheKey, 300, function () use ($request) {
            $query = Product::with(['category', 'primaryImage', 'images', 'tags'])
                ->active()
                ->inStock();

            // Search
            if ($request->has('search')) {
                $query->search($request->search);
            }

            // Category filter
            if ($request->has('category')) {
                $query->byCategory($request->category);
            }

            // Price range
            if ($request->has('min_price') || $request->has('max_price')) {
                $min = $request->input('min_price', 0);
                $max = $request->input('max_price', PHP_INT_MAX);
                $query->priceRange($min, $max);
            }

            // Brand filter
            if ($request->has('brand')) {
                $query->where('brand', $request->brand);
            }

            // Rating filter
            if ($request->has('min_rating')) {
                $query->where('average_rating', '>=', $request->min_rating);
            }

            // Featured
            if ($request->has('featured')) {
                $query->featured();
            }

            // Sorting
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            
            switch ($sortBy) {
                case 'price_low':
                    $query->orderBy('price', 'asc');
                    break;
                case 'price_high':
                    $query->orderBy('price', 'desc');
                    break;
                case 'popular':
                    $query->orderBy('view_count', 'desc');
                    break;
                case 'rating':
                    $query->orderBy('average_rating', 'desc');
                    break;
                default:
                    $query->orderBy($sortBy, $sortOrder);
            }

            return $query->paginate($request->input('per_page', 12));
        });

        return response()->json($products);
    }

    public function show($slug, Request $request)
    {
        $product = Product::with([
            'category',
            'images',
            'tags',
            'reviews' => function ($query) {
                $query->approved()->latest()->take(10);
            },
            'reviews.user'
        ])
        ->where('slug', $slug)
        ->active()
        ->firstOrFail();

        // Increment view count
        $product->incrementViewCount();

        // Log user activity
        if ($request->user()) {
            UserActivity::create([
                'user_id' => $request->user()->id,
                'product_id' => $product->id,
                'activity_type' => 'view'
            ]);
        }

        // Get related products
        $relatedProducts = Product::with(['category', 'primaryImage'])
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->active()
            ->inStock()
            ->limit(8)
            ->get();

        return response()->json([
            'product' => $product,
            'related_products' => $relatedProducts
        ]);
    }

    public function featured()
    {
        $products = Cache::remember('featured_products', 600, function () {
            return Product::with(['category', 'primaryImage'])
                ->active()
                ->featured()
                ->inStock()
                ->limit(10)
                ->get();
        });

        return response()->json($products);
    }

    public function newArrivals()
    {
        $products = Cache::remember('new_arrivals', 600, function () {
            return Product::with(['category', 'primaryImage'])
                ->active()
                ->inStock()
                ->latest()
                ->limit(12)
                ->get();
        });

        return response()->json($products);
    }

    public function topRated()
    {
        $products = Cache::remember('top_rated', 600, function () {
            return Product::with(['category', 'primaryImage'])
                ->active()
                ->inStock()
                ->where('average_rating', '>=', 4)
                ->orderBy('average_rating', 'desc')
                ->orderBy('review_count', 'desc')
                ->limit(12)
                ->get();
        });

        return response()->json($products);
    }

    public function recommendations(Request $request)
    {
        if (!$request->user()) {
            // Return popular products for guest users
            return $this->topRated();
        }

        $user = $request->user();
        $limit = $request->input('limit', 12);

        try {
            // Call ML service for personalized recommendations
            $response = Http::timeout(5)->post(config('services.ml.url') . '/recommendations', [
                'user_id' => $user->id,
                'limit' => $limit
            ]);

            if ($response->successful()) {
                $productIds = $response->json('product_ids', []);
                
                if (!empty($productIds)) {
                    $products = Product::with(['category', 'primaryImage'])
                        ->whereIn('id', $productIds)
                        ->active()
                        ->inStock()
                        ->get()
                        ->sortBy(function ($product) use ($productIds) {
                            return array_search($product->id, $productIds);
                        })
                        ->values();

                    return response()->json($products);
                }
            }
        } catch (\Exception $e) {
            \Log::error('ML Service Error: ' . $e->getMessage());
        }

        // Smart fallback based on user's purchase history
        $recommendedProducts = collect();

        // Get user's purchased categories
        $purchasedCategories = $user->orders()
            ->with('items.product.category')
            ->get()
            ->flatMap(function ($order) {
                return $order->items->pluck('product.category.id');
            })
            ->unique()
            ->filter();

        if ($purchasedCategories->isNotEmpty()) {
            // Get products from the same categories (excluding already purchased)
            $purchasedProductIds = $user->orders()
                ->with('items')
                ->get()
                ->flatMap(function ($order) {
                    return $order->items->pluck('product_id');
                })
                ->unique();

            $categoryRecommendations = Product::with(['category', 'primaryImage'])
                ->whereIn('category_id', $purchasedCategories)
                ->whereNotIn('id', $purchasedProductIds)
                ->active()
                ->inStock()
                ->orderBy('average_rating', 'desc')
                ->orderBy('view_count', 'desc')
                ->limit($limit)
                ->get();

            $recommendedProducts = $recommendedProducts->concat($categoryRecommendations);
        }

        // If we still don't have enough, add top-rated products
        if ($recommendedProducts->count() < $limit) {
            $topRated = Product::with(['category', 'primaryImage'])
                ->whereNotIn('id', $recommendedProducts->pluck('id'))
                ->active()
                ->inStock()
                ->where('average_rating', '>=', 4)
                ->orderBy('average_rating', 'desc')
                ->orderBy('review_count', 'desc')
                ->limit($limit - $recommendedProducts->count())
                ->get();

            $recommendedProducts = $recommendedProducts->concat($topRated);
        }

        return response()->json($recommendedProducts->take($limit)->values());
    }

    public function search(Request $request)
    {
        $validated = $request->validate([
            'q' => 'required|string|min:2'
        ]);

        $products = Product::with(['category', 'primaryImage'])
            ->active()
            ->search($validated['q'])
            ->paginate(20);

        // Log search activity
        if ($request->user()) {
            UserActivity::create([
                'user_id' => $request->user()->id,
                'activity_type' => 'search',
                'metadata' => ['query' => $validated['q']]
            ]);
        }

        return response()->json($products);
    }

    public function brands()
    {
        $brands = Cache::remember('product_brands', 3600, function () {
            return Product::active()
                ->whereNotNull('brand')
                ->distinct()
                ->pluck('brand')
                ->sort()
                ->values();
        });

        return response()->json($brands);
    }

    public function priceRange()
    {
        $range = Cache::remember('product_price_range', 3600, function () {
            return [
                'min' => Product::active()->min('price') ?? 0,
                'max' => Product::active()->max('price') ?? 0,
            ];
        });

        return response()->json($range);
    }
}