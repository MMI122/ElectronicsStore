<?php

use Illuminate\Support\Facades\Hash;
use App\Models\User;

// Create admin user
$admin = User::updateOrCreate(
    ['email' => 'admin@electronicsstore.com'],
    [
        'name' => 'Admin User',
        'email' => 'admin@electronicsstore.com', 
        'password' => Hash::make('admin123'),
        'role' => 'admin',
        'is_active' => true,
    ]
);

echo "Admin user created successfully!\n";
echo "Email: admin@electronicsstore.com\n";
echo "Password: admin123\n";