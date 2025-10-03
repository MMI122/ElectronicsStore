<?php
require 'vendor/autoload.php';
require 'bootstrap/app.php';

echo "=== Checking Product Images ===" . PHP_EOL;

$images = \App\Models\ProductImage::with('product')->get();
echo "Total ProductImage records: " . $images->count() . PHP_EOL . PHP_EOL;

foreach($images as $img) {
    echo "Product: " . $img->product->name . PHP_EOL;
    echo "Image Path: " . $img->image_path . PHP_EOL;
    echo "Is Primary: " . ($img->is_primary ? 'Yes' : 'No') . PHP_EOL;
    echo "Full URL: http://localhost:8000/storage/" . $img->image_path . PHP_EOL;
    echo "---" . PHP_EOL;
}

echo PHP_EOL . "=== Checking Products with Primary Images ===" . PHP_EOL;
$products = \App\Models\Product::with('primaryImage')->get();

foreach($products as $product) {
    echo "Product: " . $product->name . PHP_EOL;
    if($product->primaryImage) {
        echo "Primary Image: " . $product->primaryImage->image_path . PHP_EOL;
        echo "Primary Image URL: http://localhost:8000/storage/" . $product->primaryImage->image_path . PHP_EOL;
    } else {
        echo "No primary image found!" . PHP_EOL;
    }
    echo "---" . PHP_EOL;
}