<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run()
    {
        $categories = [
            ['name' => 'Smartphones', 'slug' => 'smartphones', 'is_active' => true],
            ['name' => 'Laptops', 'slug' => 'laptops', 'is_active' => true],
            ['name' => 'Tablets', 'slug' => 'tablets', 'is_active' => true],
            ['name' => 'Accessories', 'slug' => 'accessories', 'is_active' => true],
            ['name' => 'Smart Watches', 'slug' => 'smart-watches', 'is_active' => true],
            ['name' => 'Headphones', 'slug' => 'headphones', 'is_active' => true],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}