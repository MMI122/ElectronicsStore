<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Review;
use App\Models\Product;
use App\Models\User;
use App\Models\Order;

class ReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing data
        $products = Product::all();
        $users = User::where('role', 'customer')->get();
        
        if ($products->isEmpty() || $users->isEmpty()) {
            $this->command->info('No products or users found. Skipping review seeder.');
            return;
        }

        // Sample review data
        $reviewsData = [
            [
                'rating' => 5,
                'title' => 'Excellent product!',
                'comment' => 'This product exceeded my expectations. Great quality and fast delivery. Highly recommended!',
            ],
            [
                'rating' => 4,
                'title' => 'Good value for money',
                'comment' => 'Really happy with this purchase. The product works as described and the price was reasonable.',
            ],
            [
                'rating' => 5,
                'title' => 'Amazing quality',
                'comment' => 'The build quality is outstanding. Very satisfied with my purchase.',
            ],
            [
                'rating' => 3,
                'title' => 'Decent product',
                'comment' => 'It\'s okay, does what it\'s supposed to do. Nothing spectacular but gets the job done.',
            ],
            [
                'rating' => 5,
                'title' => 'Perfect!',
                'comment' => 'Exactly what I was looking for. Fast shipping and excellent customer service.',
            ],
            [
                'rating' => 4,
                'title' => 'Very satisfied',
                'comment' => 'Great product with good features. Would buy again.',
            ],
            [
                'rating' => 5,
                'title' => 'Outstanding',
                'comment' => 'This is the best purchase I\'ve made in a long time. Quality is top-notch.',
            ],
            [
                'rating' => 4,
                'title' => 'Good product',
                'comment' => 'Works well and looks good. Shipping was quick too.',
            ],
        ];

        // Create reviews for random products and users
        foreach ($products as $product) {
            // Create 2-4 reviews per product
            $reviewCount = rand(2, 4);
            $selectedUsers = $users->random(min($reviewCount, $users->count()));
            
            foreach ($selectedUsers as $index => $user) {
                if ($index >= count($reviewsData)) break;
                
                $reviewData = $reviewsData[$index];
                
                Review::create([
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                    'order_id' => null, // We can set this to null for now
                    'rating' => $reviewData['rating'],
                    'title' => $reviewData['title'],
                    'comment' => $reviewData['comment'],
                    'is_approved' => true,
                    'is_verified_purchase' => rand(0, 1) == 1,
                    'helpful_count' => rand(0, 15),
                    'created_at' => now()->subDays(rand(1, 30)),
                ]);
            }
            
            // Update product rating
            $product->updateRating();
        }

        $this->command->info('Reviews seeded successfully!');
    }
}
