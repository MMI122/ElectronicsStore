<?php

// app/Http/Controllers/Api/WishlistController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\UserActivity;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $wishlist = $request->user()
            ->wishlists()
            ->with(['category', 'primaryImage'])
            ->active()
            ->paginate(12);

        return response()->json($wishlist);
    }

    public function add(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id'
        ]);

        $user = $request->user();

        // Check if already in wishlist
        if ($user->wishlists()->where('product_id', $validated['product_id'])->exists()) {
            return response()->json([
                'message' => 'Product already in wishlist'
            ], 400);
        }

        $user->wishlists()->attach($validated['product_id']);

        // Log activity
        UserActivity::create([
            'user_id' => $user->id,
            'product_id' => $validated['product_id'],
            'activity_type' => 'wishlist'
        ]);

        return response()->json(['message' => 'Product added to wishlist']);
    }

    public function remove(Product $product, Request $request)
    {
        $request->user()->wishlists()->detach($product->id);

        return response()->json(['message' => 'Product removed from wishlist']);
    }
}