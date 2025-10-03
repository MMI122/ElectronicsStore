<?php
$pdo = new PDO('sqlite:database/database.sqlite');

echo "=== Product Ratings Check ===\n";
$stmt = $pdo->query('SELECT name, average_rating, review_count FROM products WHERE name LIKE "%xiaomi%"');
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['name'] . ': Rating=' . $row['average_rating'] . ', Count=' . $row['review_count'] . "\n";
}

echo "\n=== Reviews Check ===\n";
$stmt = $pdo->query('
    SELECT p.name, r.rating, r.is_approved, r.created_at 
    FROM products p 
    JOIN reviews r ON p.id = r.product_id 
    WHERE p.name LIKE "%xiaomi%" 
    ORDER BY r.created_at DESC
');
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $approved = $row['is_approved'] ? 'Approved' : 'Pending';
    echo "- {$row['rating']} stars ({$approved}) on {$row['created_at']}\n";
}
?>