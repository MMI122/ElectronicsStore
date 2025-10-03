<?php
$pdo = new PDO('sqlite:database/database.sqlite');

echo "=== Reviews Status ===\n";
$stmt = $pdo->query('SELECT COUNT(*) as pending FROM reviews WHERE is_approved = 0');
$pending = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Pending reviews: " . $pending['pending'] . "\n";

$stmt = $pdo->query('SELECT COUNT(*) as approved FROM reviews WHERE is_approved = 1');
$approved = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Approved reviews: " . $approved['approved'] . "\n";

echo "\n=== All Reviews ===\n";
$stmt = $pdo->query('
    SELECT r.id, r.rating, r.is_approved, r.created_at, p.name as product_name
    FROM reviews r 
    JOIN products p ON r.product_id = p.id 
    ORDER BY r.created_at DESC
');

while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $status = $row['is_approved'] ? '✅ Approved' : '⏳ Pending';
    echo "#{$row['id']}: {$row['rating']}★ for {$row['product_name']} - {$status}\n";
}
?>