<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'primaryImage']);

        if ($request->has('search')) {
            $query->search($request->search);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('status')) {
            $query->where('is_active', $request->status);
        }

        if ($request->has('stock_status')) {
            if ($request->stock_status === 'low') {
                $query->lowStock();
            } elseif ($request->stock_status === 'out') {
                $query->where('stock_quantity', 0);
            }
        }

        $products = $query->latest()->paginate(20);

        return response()->json($products);
    }

    public function store(Request $request)
    {
        // Handle JSON fields that come as strings in FormData
        if ($request->has('specifications') && is_string($request->specifications)) {
            $request->merge(['specifications' => json_decode($request->specifications, true)]);
        }
        if ($request->has('features') && is_string($request->features)) {
            $request->merge(['features' => json_decode($request->features, true)]);
        }
        if ($request->has('tags') && is_string($request->tags)) {
            $request->merge(['tags' => json_decode($request->tags, true)]);
        }

        // Handle boolean fields that come as strings
        if ($request->has('is_featured')) {
            $request->merge(['is_featured' => filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN)]);
        }
        if ($request->has('is_active')) {
            $request->merge(['is_active' => filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'short_description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'category_id' => 'required|exists:categories,id',
            'brand' => 'nullable|string|max:255',
            'sku' => 'nullable|string|unique:products,sku',
            'warranty' => 'nullable|string',
            'specifications' => 'nullable|array',
            'features' => 'nullable|array',
            'weight' => 'nullable|numeric',
            'dimensions' => 'nullable|array',
            'is_featured' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'new_images' => 'nullable|array',
            'new_images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'tags' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            // Generate slug if not provided
            if (empty($validated['slug'])) {
                $validated['slug'] = Str::slug($validated['name']);
            }
            
            \Log::info('Creating product with data: ', $validated);
            
            $product = Product::create($validated);

            // Handle images
            if ($request->hasFile('new_images')) {
                $this->handleImageUpload($product, $request->file('new_images'));
            }

            // Handle tags
            if ($request->has('tags')) {
                $this->handleTags($product, $request->tags);
            }

            DB::commit();
            return response()->json([
                'message' => 'Product created successfully',
                'product' => $product->load(['images', 'tags'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Product creation error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['message' => 'Error creating product', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Product $product)
    {
        return response()->json($product->load(['category', 'images', 'tags', 'reviews.user']));
    }

    public function update(Request $request, Product $product)
    {
        // Handle JSON fields that come as strings in FormData
        if ($request->has('specifications') && is_string($request->specifications)) {
            $request->merge(['specifications' => json_decode($request->specifications, true)]);
        }
        if ($request->has('features') && is_string($request->features)) {
            $request->merge(['features' => json_decode($request->features, true)]);
        }
        if ($request->has('tags') && is_string($request->tags)) {
            $request->merge(['tags' => json_decode($request->tags, true)]);
        }

        // Handle boolean fields that come as strings
        if ($request->has('is_featured')) {
            $request->merge(['is_featured' => filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN)]);
        }
        if ($request->has('is_active')) {
            $request->merge(['is_active' => filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)]);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'short_description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'sometimes|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'category_id' => 'sometimes|exists:categories,id',
            'brand' => 'nullable|string|max:255',
            'warranty' => 'nullable|string',
            'specifications' => 'nullable|array',
            'features' => 'nullable|array',
            'weight' => 'nullable|numeric',
            'dimensions' => 'nullable|array',
            'is_featured' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'new_images' => 'nullable|array',
            'new_images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'tags' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $product->update($validated);

            // Handle new images
            if ($request->hasFile('new_images')) {
                $this->handleImageUpload($product, $request->file('new_images'));
            }

            // Handle tags
            if ($request->has('tags')) {
                $this->handleTags($product, $request->tags);
            }

            DB::commit();
            return response()->json([
                'message' => 'Product updated successfully',
                'product' => $product->fresh()->load(['images', 'tags'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating product', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Product $product)
    {
        try {
            // Delete images from storage
            foreach ($product->images as $image) {
                Storage::delete($image->image_path);
            }
            
            $product->delete();
            return response()->json(['message' => 'Product deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error deleting product', 'error' => $e->getMessage()], 500);
        }
    }

    public function deleteImage(ProductImage $image)
    {
        try {
            Storage::delete($image->image_path);
            $image->delete();
            return response()->json(['message' => 'Image deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error deleting image'], 500);
        }
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id'
        ]);

        try {
            Product::whereIn('id', $validated['product_ids'])->delete();
            return response()->json(['message' => 'Products deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error deleting products'], 500);
        }
    }

    private function handleImageUpload(Product $product, array $images)
    {
        try {
            \Log::info('Starting image upload for product: ' . $product->id);
            \Log::info('Number of images: ' . count($images));
            
            $order = $product->images()->count();
            $isPrimarySet = $product->images()->where('is_primary', true)->exists();

            foreach ($images as $index => $image) {
                \Log::info('Processing image ' . ($index + 1));
                
                $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                \Log::info('Generated filename: ' . $filename);
                
                $path = $image->storeAs('products', $filename, 'public');
                \Log::info('Stored image at: ' . $path);

                $imageRecord = ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $path,
                    'order' => $order + $index,
                    'is_primary' => !$isPrimarySet && $index === 0
                ]);
                
                \Log::info('Created ProductImage record with ID: ' . $imageRecord->id);
            }
            
            \Log::info('Image upload completed successfully');
        } catch (\Exception $e) {
            \Log::error('Image upload error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    private function handleTags(Product $product, array $tags)
    {
        $tagIds = [];
        foreach ($tags as $tagName) {
            $tag = \App\Models\ProductTag::firstOrCreate(
                ['name' => $tagName],
                ['slug' => \Illuminate\Support\Str::slug($tagName)]
            );
            $tagIds[] = $tag->id;
        }
        $product->tags()->sync($tagIds);
    }
}