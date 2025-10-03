<?php

require 'vendor/autoload.php';
require 'bootstrap/app.php';

echo "Testing review system...\n";

// Get the xiaomi product
$product = App\Models\Product::where('name', 'LIKE', '%xiaomi%')->first();
if (!$product) {
    echo "No xiaomi product found!\n";
    exit;
}

echo "Product: {$product->name} (ID: {$product->id})\n";
echo "Current rating: {$product->average_rating}\n";
echo "Review count: {$product->review_count}\n";

// Check existing reviews
$reviews = App\Models\Review::where('product_id', $product->id)->get();
echo "Reviews in database: {$reviews->count()}\n";

foreach ($reviews as $review) {
    echo "- User {$review->user_id}: {$review->rating} stars, Approved: " . ($review->is_approved ? 'Yes' : 'No') . "\n";
}

// Update rating calculation
echo "\nUpdating rating calculation...\n";
$product->updateRating();
$product->refresh();

echo "After updateRating() - Rating: {$product->average_rating}, Count: {$product->review_count}\n";

// Test creating a new review for user 1
$user = App\Models\User::first();
if ($user) {
    echo "\nTesting review creation for user: {$user->name}\n";
    
    try {
        $review = App\Models\Review::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'order_id' => null,
            'rating' => 2,
            'title' => 'Test Review',
            'comment' => 'This is a test review',
            'is_verified_purchase' => false,
            'is_approved' => true,
            'helpful_count' => 0,
        ]);
        
        echo "Review created successfully! ID: {$review->id}\n";
        
        // Update product rating
        $product->updateRating();
        $product->refresh();
        
        echo "New product rating: {$product->average_rating}, Count: {$product->review_count}\n";
        
    } catch (Exception $e) {
        echo "Error creating review: " . $e->getMessage() . "\n";
    }
}