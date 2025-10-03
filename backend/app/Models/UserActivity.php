<?php

// // app/Models/Category.php
// namespace App\Models;

// use Illuminate\Database\Eloquent\Model;
// use Illuminate\Support\Str;

// app/Models/UserActivity.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserActivity extends Model
{
    protected $fillable = ['user_id', 'product_id', 'activity_type', 'metadata'];
    protected $casts = ['metadata' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}