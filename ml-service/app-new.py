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
    conn.row_factory = sqlite3.Row
    return conn

def get_user_activity_data(user_id):
    """Fetch user activity from database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
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
        WHERE ua.user_id = ?
        GROUP BY ua.product_id, ua.activity_type, p.category_id, p.price, p.brand
    """
    
    cursor.execute(query, (user_id,))
    rows = cursor.fetchall()
    
    data = []
    for row in rows:
        data.append({
            'product_id': row[0],
            'activity_type': row[1], 
            'category_id': row[2],
            'price': row[3],
            'brand': row[4],
            'interaction_count': row[5],
            'last_interaction': row[6]
        })
    
    conn.close()
    return pd.DataFrame(data)

def get_user_purchase_history(user_id):
    """Get user's purchase history"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
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
        WHERE o.user_id = ? AND o.payment_status = 'paid'
        GROUP BY oi.product_id, p.category_id, p.price, p.brand
    """
    
    cursor.execute(query, (user_id,))
    rows = cursor.fetchall()
    
    data = []
    for row in rows:
        data.append({
            'product_id': row[0],
            'category_id': row[1],
            'price': row[2],
            'brand': row[3],
            'total_purchased': row[4]
        })
    
    conn.close()
    return pd.DataFrame(data)

def get_all_products():
    """Fetch all active products"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT 
            id,
            name,
            category_id,
            price,
            brand,
            average_rating,
            review_count,
            view_count,
            order_count
        FROM products 
        WHERE is_active = 1
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()
    
    data = []
    for row in rows:
        data.append({
            'id': row[0],
            'name': row[1],
            'category_id': row[2],
            'price': row[3],
            'brand': row[4],
            'average_rating': row[5] or 0,
            'review_count': row[6] or 0,
            'view_count': row[7] or 0,
            'order_count': row[8] or 0
        })
    
    conn.close()
    return pd.DataFrame(data)

def get_product_recommendations(user_id, limit=10):
    """Get ML-based product recommendations for a user"""
    try:
        # Get user's purchase history
        purchase_history = get_user_purchase_history(user_id)
        
        # Get all products
        all_products = get_all_products()
        
        if all_products.empty:
            return []
        
        recommendations = []
        
        if purchase_history.empty:
            # New user - recommend trending/popular products
            print(f"New user {user_id}, recommending trending products")
            return get_trending_products(limit)
        
        # Simple content-based filtering based on categories and brands
        user_categories = purchase_history['category_id'].unique().tolist()
        user_brands = purchase_history['brand'].dropna().unique().tolist()
        
        print(f"User {user_id} preferences - Categories: {user_categories}, Brands: {user_brands}")
        
        # Get purchased product IDs to exclude
        purchased_products = purchase_history['product_id'].unique().tolist()
        
        # Score all products
        for _, product in all_products.iterrows():
            # Skip if user already purchased this product
            if product['id'] in purchased_products:
                continue
                
            score = 0
            
            # Category preference score (highest weight)
            if product['category_id'] in user_categories:
                score += 5  # Strong category match
            
            # Brand preference score
            if pd.notna(product['brand']) and product['brand'] in user_brands:
                score += 3  # Brand match
                
            # Rating score (normalized to 0-2)
            rating = product['average_rating'] or 0
            score += (rating / 5.0) * 2
            
            # Popularity scores (logarithmic to prevent dominance)
            score += np.log1p(product['view_count'] or 0) * 0.1
            score += np.log1p(product['order_count'] or 0) * 0.2
            score += np.log1p(product['review_count'] or 0) * 0.1
            
            if score > 0:  # Only include products with some score
                recommendations.append({
                    'product_id': int(product['id']),
                    'name': product['name'],
                    'score': score,
                    'category_match': product['category_id'] in user_categories,
                    'brand_match': pd.notna(product['brand']) and product['brand'] in user_brands,
                    'rating': rating,
                    'reason': 'Based on your purchase history'
                })
        
        # Sort by score and return top recommendations
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        print(f"Generated {len(recommendations)} recommendations for user {user_id}")
        
        # If we don't have enough recommendations, fill with trending products
        if len(recommendations) < limit:
            trending = get_trending_products(limit - len(recommendations))
            recommended_ids = {rec['product_id'] for rec in recommendations}
            
            for trend in trending:
                if trend['product_id'] not in recommended_ids:
                    recommendations.append(trend)
                    if len(recommendations) >= limit:
                        break
        
        return recommendations[:limit]
        
    except Exception as e:
        print(f"Error in recommendations: {e}")
        return get_trending_products(limit)

def get_trending_products(limit=10):
    """Get trending products based on recent activity"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT 
            p.id,
            p.name,
            p.average_rating,
            p.review_count,
            p.view_count,
            p.order_count,
            (p.view_count * 0.1 + p.order_count * 2 + p.average_rating * p.review_count * 0.5) as trending_score
        FROM products p 
        WHERE p.is_active = 1
        ORDER BY trending_score DESC, p.created_at DESC
        LIMIT ?
    """
    
    cursor.execute(query, (limit,))
    rows = cursor.fetchall()
    
    recommendations = []
    for row in rows:
        recommendations.append({
            'product_id': int(row[0]),
            'name': row[1],
            'score': row[6],
            'reason': 'Trending product'
        })
    
    conn.close()
    return recommendations

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    """Get personalized recommendations for a user"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        limit = data.get('limit', 10)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        recommendations = get_product_recommendations(user_id, limit)
        
        # Extract product IDs for Laravel backend compatibility
        product_ids = [rec['product_id'] for rec in recommendations]
        
        return jsonify({
            'status': 'success',
            'user_id': user_id,
            'product_ids': product_ids,  # Laravel expects this format
            'recommendations': recommendations,
            'total': len(recommendations)
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/trending', methods=['GET'])
def get_trending():
    """Get trending products"""
    try:
        limit = request.args.get('limit', 10, type=int)
        trending = get_trending_products(limit)
        
        return jsonify({
            'status': 'success',
            'trending_products': trending,
            'total': len(trending)
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ml-recommendations',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🤖 Starting ML Recommendation Service...")
    print("🔗 Available endpoints:")
    print("  POST /recommendations - Get personalized recommendations")
    print("  GET /trending - Get trending products") 
    print("  GET /health - Health check")
    app.run(debug=True, host='0.0.0.0', port=5001)