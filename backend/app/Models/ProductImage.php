<?php

// // app/Models/Category.php
// namespace App\Models;

// use Illuminate\Database\Eloquent\Model;
// use Illuminate\Support\Str;
// app/Models/ProductImage.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    protected $fillable = ['product_id', 'image_path', 'order', 'is_primary'];
    protected $casts = ['is_primary' => 'boolean'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}