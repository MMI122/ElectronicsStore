<?php

// // app/Models/Category.php
// namespace App\Models;

// use Illuminate\Database\Eloquent\Model;
// use Illuminate\Support\Str;
// // app/Models/ProductTag.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ProductTag extends Model
{
    protected $fillable = ['name', 'slug'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($tag) {
            if (empty($tag->slug)) {
                $tag->slug = Str::slug($tag->name);
            }
        });
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_tag_pivot');
    }
}