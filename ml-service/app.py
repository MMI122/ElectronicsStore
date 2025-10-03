from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Database configuration - using SQLite
DB_PATH = os.environ.get('DB_PATH', '../backend/database/database.sqlite')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

def get_user_activity_data(user_id):
    """Fetch user activity from database"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT 
            ua.product_id,
            ua.activity_type,
            p.category_id,
            p.price,
            p.brand,
            COUNT(*) as interaction_count,
            MAX(ua.created_at) as last_interaction
        FROM user_activities ua
        JOIN products p ON ua.product_id = p.id
        WHERE ua.user_id = %s
        GROUP BY ua.product_id, ua.activity_type, p.category_id, p.price, p.brand
    """
    
    cursor.execute(query, (user_id,))
    data = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return pd.DataFrame(data)

def get_user_purchase_history(user_id):
    """Get user's purchase history"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT 
            oi.product_id,
            p.category_id,
            p.price,
            p.brand,
            SUM(oi.quantity) as total_purchased
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = %s AND o.payment_status = 'paid'
        GROUP BY oi.product_id, p.category_id, p.price, p.brand
    """
    
    cursor.execute(query, (user_id,))
    data = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return pd.DataFrame(data)

def get_all_products():
    """Fetch all active products"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT 
            id,
            category_id,
            price,
            brand,
            average_rating,
            view_count,
            order_count
        FROM products
        WHERE is_active = 1 AND stock_quantity > 0
    """
    
    cursor.execute(query)
    data = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return pd.DataFrame(data)

def calculate_user_preferences(user_id):
    """Calculate user preferences based on activity and purchases"""
    activity_df = get_user_activity_data(user_id)
    purchase_df = get_user_purchase_history(user_id)
    
    if activity_df.empty and purchase_df.empty:
        return None
    
    # Weight different activities
    activity_weights = {
        'view': 1,
        'search': 1.5,
        'add_to_cart': 2,
        'wishlist': 2.5,
        'purchase': 5
    }
    
    preferences = {
        'categories': {},
        'brands': {},
        'price_range': {'min': 0, 'max': float('inf')}
    }
    
    # Process activity data
    if not activity_df.empty:
        for _, row in activity_df.iterrows():
            weight = activity_weights.get(row['activity_type'], 1)
            score = row['interaction_count'] * weight
            
            # Category preferences
            cat_id = row['category_id']
            preferences['categories'][cat_id] = preferences['categories'].get(cat_id, 0) + score
            
            # Brand preferences
            if row['brand']:
                brand = row['brand']
                preferences['brands'][brand] = preferences['brands'].get(brand, 0) + score
    
    # Process purchase data (highest weight)
    if not purchase_df.empty:
        for _, row in purchase_df.iterrows():
            score = row['total_purchased'] * 10  # High weight for purchases
            
            cat_id = row['category_id']
            preferences['categories'][cat_id] = preferences['categories'].get(cat_id, 0) + score
            
            if row['brand']:
                brand = row['brand']
                preferences['brands'][brand] = preferences['brands'].get(brand, 0) + score
        
        # Calculate preferred price range
        prices = purchase_df['price'].tolist()
        if prices:
            avg_price = np.mean(prices)
            std_price = np.std(prices) if len(prices) > 1 else avg_price * 0.3
            preferences['price_range']['min'] = max(0, avg_price - std_price)
            preferences['price_range']['max'] = avg_price + std_price
    
    return preferences

def collaborative_filtering_recommendations(user_id, limit=20):
    """Collaborative filtering based on similar users"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Find users with similar purchase patterns
    query = """
        SELECT 
            o2.user_id,
            COUNT(DISTINCT oi2.product_id) as common_products
        FROM order_items oi1
        JOIN orders o1 ON oi1.order_id = o1.id
        JOIN order_items oi2 ON oi1.product_id = oi2.product_id
        JOIN orders o2 ON oi2.order_id = o2.id
        WHERE o1.user_id = %s 
        AND o2.user_id != %s
        AND o1.payment_status = 'paid'
        AND o2.payment_status = 'paid'
        GROUP BY o2.user_id
        HAVING common_products >= 2
        ORDER BY common_products DESC
        LIMIT 10
    """
    
    cursor.execute(query, (user_id, user_id))
    similar_users = cursor.fetchall()
    
    if not similar_users:
        cursor.close()
        conn.close()
        return []
    
    similar_user_ids = [u['user_id'] for u in similar_users]
    
    # Get products purchased by similar users but not by current user
    placeholders = ','.join(['%s'] * len(similar_user_ids))
    query = f"""
        SELECT 
            oi.product_id,
            COUNT(DISTINCT o.user_id) as user_count,
            AVG(p.average_rating) as avg_rating
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id IN ({placeholders})
        AND o.payment_status = 'paid'
        AND p.is_active = 1
        AND p.stock_quantity > 0
        AND oi.product_id NOT IN (
            SELECT product_id 
            FROM order_items oi2
            JOIN orders o2 ON oi2.order_id = o2.id
            WHERE o2.user_id = %s AND o2.payment_status = 'paid'
        )
        GROUP BY oi.product_id
        ORDER BY user_count DESC, avg_rating DESC
        LIMIT %s
    """
    
    cursor.execute(query, similar_user_ids + [user_id, limit])
    recommendations = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return [r['product_id'] for r in recommendations]

def content_based_recommendations(user_id, preferences, limit=20):
    """Content-based filtering using user preferences"""
    if not preferences:
        return []
    
    products_df = get_all_products()
    
    if products_df.empty:
        return []
    
    # Calculate scores for each product
    scores = []
    
    for _, product in products_df.iterrows():
        score = 0
        
        # Category match
        if product['category_id'] in preferences['categories']:
            score += preferences['categories'][product['category_id']] * 3
        
        # Brand match
        if product['brand'] and product['brand'] in preferences['brands']:
            score += preferences['brands'][product['brand']] * 2
        
        # Price range match
        price_min = preferences['price_range']['min']
        price_max = preferences['price_range']['max']
        if price_min <= product['price'] <= price_max:
            score += 5
        
        # Popularity boost
        score += product['view_count'] * 0.01
        score += product['order_count'] * 0.1
        score += product['average_rating'] * 2
        
        scores.append({
            'product_id': product['id'],
            'score': score
        })
    
    # Sort by score and return top products
    scores.sort(key=lambda x: x['score'], reverse=True)
    return [s['product_id'] for s in scores[:limit]]

def get_trending_products(limit=20):
    """Get trending products based on recent activity"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Products with high recent activity
    query = """
        SELECT 
            p.id,
            p.view_count,
            p.order_count,
            p.average_rating,
            COUNT(DISTINCT ua.user_id) as recent_views
        FROM products p
        LEFT JOIN user_activities ua ON p.id = ua.product_id 
            AND ua.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        WHERE p.is_active = 1 AND p.stock_quantity > 0
        GROUP BY p.id
        ORDER BY 
            recent_views DESC,
            p.order_count DESC,
            p.average_rating DESC
        LIMIT %s
    """
    
    cursor.execute(query, (limit,))
    products = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return [p['id'] for p in products]

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    """Main recommendation endpoint"""
    data = request.get_json()
    user_id = data.get('user_id')
    limit = data.get('limit', 12)
    
    if not user_id:
        # Return trending products for non-logged users
        product_ids = get_trending_products(limit)
        return jsonify({'product_ids': product_ids})
    
    try:
        # Calculate user preferences
        preferences = calculate_user_preferences(user_id)
        
        # Get recommendations from different methods
        collab_recs = collaborative_filtering_recommendations(user_id, limit)
        content_recs = content_based_recommendations(user_id, preferences, limit) if preferences else []
        
        # Merge and deduplicate recommendations
        all_recs = []
        seen = set()
        
        # Prioritize collaborative filtering (60%)
        for pid in collab_recs[:int(limit * 0.6)]:
            if pid not in seen:
                all_recs.append(pid)
                seen.add(pid)
        
        # Add content-based (40%)
        for pid in content_recs:
            if pid not in seen and len(all_recs) < limit:
                all_recs.append(pid)
                seen.add(pid)
        
        # Fill remaining with trending if needed
        if len(all_recs) < limit:
            trending = get_trending_products(limit)
            for pid in trending:
                if pid not in seen and len(all_recs) < limit:
                    all_recs.append(pid)
                    seen.add(pid)
        
        return jsonify({'product_ids': all_recs[:limit]})
        
    except Exception as e:
        print(f"Error generating recommendations: {str(e)}")
        # Fallback to trending
        product_ids = get_trending_products(limit)
        return jsonify({'product_ids': product_ids})

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
    