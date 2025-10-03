<?php

// app/Http/Controllers/Api/ReviewController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function getReviewableProducts(Request $request)
    {
        // Get products from delivered orders that haven't been reviewed yet
        $user = $request->user();
        
        $reviewableProducts = Order::where('user_id', $user->id)
            ->where('status', 'delivered')
            ->where('payment_status', 'paid')
            ->with(['items.product.primaryImage', 'items.product.category'])
            ->get()
            ->flatMap(function ($order) use ($user) {
                return $order->items->map(function ($item) use ($order, $user) {
                    // Check if already reviewed
                    $existingReview = Review::where('user_id', $user->id)
                        ->where('product_id', $item->product_id)
                        ->where('order_id', $order->id)
                        ->first();
                    
                    if (!$existingReview) {
                        return [
                            'order_id' => $order->id,
                            'order_number' => $order->order_number,
                            'delivered_at' => $order->delivered_at,
                            'product' => $item->product,
                            'quantity' => $item->quantity,
                            'can_review' => true
                        ];
                    }
                    return null;
                })->filter();
            })
            ->unique('product.id')
            ->values();

        return response()->json($reviewableProducts);
    }

    public function getProductReviews(Request $request, Product $product)
    {
        $perPage = $request->input('per_page', 10);
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $approved = $request->input('approved', true);

        $query = Review::where('product_id', $product->id)
            ->with(['user:id,name', 'order:id,order_number'])
            ->where('is_approved', $approved);

        // Apply sorting
        if ($sortBy === 'rating') {
            $query->orderBy('rating', $sortOrder);
        } elseif ($sortBy === 'helpful') {
            $query->orderBy('helpful_count', $sortOrder);
        } else {
            $query->orderBy('created_at', $sortOrder);
        }

        $reviews = $query->paginate($perPage);

        return response()->json($reviews);
    }

    public function getUserReviews(Request $request)
    {
        $reviews = Review::where('user_id', $request->user()->id)
            ->with(['product.primaryImage', 'product.category'])
            ->latest()
            ->paginate(10);

        return response()->json($reviews);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'order_id' => 'nullable|exists:orders,id',
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'comment' => 'required|string',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:2048'
        ]);

        // Check if user has already reviewed this product
        $existingReview = Review::where('user_id', $request->user()->id)
            ->where('product_id', $validated['product_id'])
            ->first();

        if ($existingReview) {
            // Update existing review instead of creating new one
            $existingReview->update([
                'rating' => $validated['rating'],
                'title' => $validated['title'] ?? null,
                'comment' => $validated['comment'],
                'is_approved' => false, // Requires re-approval
            ]);

            // Update product rating
            $product = Product::find($validated['product_id']);
            $product->updateRating();

            return response()->json([
                'message' => 'Review updated successfully. It will be visible after approval.',
                'review' => $existingReview
            ]);
        }

        // Check if this is a verified purchase
        $isVerified = false;
        if (isset($validated['order_id'])) {
            $order = Order::where('id', $validated['order_id'])
                ->where('user_id', $request->user()->id)
                ->where('payment_status', 'paid')
                ->whereHas('items', function ($query) use ($validated) {
                    $query->where('product_id', $validated['product_id']);
                })
                ->first();

            $isVerified = $order !== null;
        }

        // Handle image uploads
        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('reviews', $filename, 'public');
                $imagePaths[] = $path;
            }
        }

        $review = Review::create([
            'user_id' => $request->user()->id,
            'product_id' => $validated['product_id'],
            'order_id' => $validated['order_id'] ?? null,
            'rating' => $validated['rating'],
            'title' => $validated['title'] ?? null,
            'comment' => $validated['comment'],
            'images' => $imagePaths,
            'is_verified_purchase' => $isVerified,
            'is_approved' => false, // Admin approval required
        ]);

        // Update product rating
        $product = Product::find($validated['product_id']);
        $product->updateRating();

        return response()->json([
            'message' => 'Review submitted successfully. It will be visible after approval.',
            'review' => $review
        ], 201);
    }

    public function update(Request $request, Review $review)
    {
        if ($review->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'comment' => 'sometimes|string',
        ]);

        $review->update($validated);
        $review->product->updateRating();

        return response()->json([
            'message' => 'Review updated successfully',
            'review' => $review->fresh()
        ]);
    }

    public function destroy(Review $review, Request $request)
    {
        if ($review->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $productId = $review->product_id;
        $review->delete();

        // Update product rating
        $product = Product::find($productId);
        $product->updateRating();

        return response()->json(['message' => 'Review deleted successfully']);
    }

    public function markHelpful(Review $review, Request $request)
    {
        $review->increment('helpful_count');

        return response()->json([
            'message' => 'Marked as helpful',
            'helpful_count' => $review->helpful_count
        ]);
    }

    public function adminIndex(Request $request)
    {
        $query = Review::with(['user', 'product']);

        if ($request->has('status')) {
            $query->where('is_approved', $request->status === 'approved');
        }

        $reviews = $query->latest()->paginate(20);

        return response()->json($reviews);
    }

    public function approve(Review $review)
    {
        $review->update(['is_approved' => true]);
        $review->product->updateRating();

        return response()->json(['message' => 'Review approved']);
    }

    public function reject(Review $review)
    {
        $review->update(['is_approved' => false]);
        $review->product->updateRating();

        return response()->json(['message' => 'Review rejected']);
    }
}

