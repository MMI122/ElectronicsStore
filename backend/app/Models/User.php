<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'avatar',
        'role',
        'is_active',
        'preferences',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'preferences' => 'array',
        'last_login_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function wishlists()
    {
        return $this->belongsToMany(Product::class, 'wishlists');
    }

    public function cart()
    {
        return $this->hasMany(Cart::class);
    }

    public function activities()
    {
        return $this->hasMany(UserActivity::class);
    }

    // Helper methods
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function getFullAddressAttribute(): string
    {
        return trim("{$this->address}, {$this->city}, {$this->state} {$this->postal_code}, {$this->country}");
    }

    public function getTotalSpentAttribute()
    {
        return $this->orders()
            ->where('payment_status', 'paid')
            ->sum('total');
    }

    public function getOrderStatsAttribute()
    {
        return $this->orders()
            ->selectRaw('
                COUNT(*) as total_orders,
                SUM(CASE WHEN payment_status = "paid" THEN total ELSE 0 END) as total_spent,
                AVG(CASE WHEN payment_status = "paid" THEN total ELSE NULL END) as average_order_value
            ')
            ->first();
    }
}