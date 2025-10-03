<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\UserActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stripe\Stripe;
use Stripe\Charge;

class CartOrderController extends Controller
{
    // CART METHODS
    public function getCart(Request $request)
    {
        $cart = Cart::with(['product.primaryImage', 'product.category'])
            ->where('user_id', $request->user()->id)
            ->get();

        $subtotal = $cart->sum(function ($item) {
            return $item->product->price * $item->quantity;
        });

        return response()->json([
            'items' => $cart,
            'subtotal' => $subtotal,
            'total_items' => $cart->sum('quantity')
        ]);
    }

    public function addToCart(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $product = Product::findOrFail($validated['product_id']);

        if ($product->stock_quantity < $validated['quantity']) {
            return response()->json([
                'message' => 'Insufficient stock available'
            ], 400);
        }

        // Check if item already exists in cart
        $existingCartItem = Cart::where([
            'user_id' => $request->user()->id,
            'product_id' => $validated['product_id']
        ])->first();

        if ($existingCartItem) {
            // Update existing item
            $existingCartItem->quantity += $validated['quantity'];
            $existingCartItem->save();
            $cartItem = $existingCartItem;
        } else {
            // Create new item
            $cartItem = Cart::create([
                'user_id' => $request->user()->id,
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity']
            ]);
        }

        // Log activity
        UserActivity::create([
            'user_id' => $request->user()->id,
            'product_id' => $validated['product_id'],
            'activity_type' => 'add_to_cart'
        ]);

        return response()->json([
            'message' => 'Product added to cart',
            'cart_item' => $cartItem->fresh()->load('product')
        ]);
    }

    public function updateCartItem(Request $request, Cart $cartItem)
    {
        if ($cartItem->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        if ($cartItem->product->stock_quantity < $validated['quantity']) {
            return response()->json([
                'message' => 'Insufficient stock available'
            ], 400);
        }

        $cartItem->update($validated);

        return response()->json([
            'message' => 'Cart updated',
            'cart_item' => $cartItem->fresh()
        ]);
    }

    public function removeFromCart(Cart $cartItem, Request $request)
    {
        if ($cartItem->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $cartItem->delete();

        return response()->json(['message' => 'Item removed from cart']);
    }

    public function clearCart(Request $request)
    {
        Cart::where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'Cart cleared']);
    }

    // ORDER METHODS
    public function getOrders(Request $request)
    {
        $orders = Order::with(['items.product.primaryImage'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json($orders);
    }

    public function getOrder(Order $order, Request $request)
    {
        if ($order->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($order->load(['items.product', 'user']));
    }

    public function createOrder(Request $request)
    {
        $validated = $request->validate([
            'payment_method' => 'required|in:stripe,paypal,cod',
            'shipping_name' => 'required|string',
            'shipping_email' => 'required|email',
            'shipping_phone' => 'required|string',
            'shipping_address' => 'required|string',
            'shipping_city' => 'required|string',
            'shipping_state' => 'required|string',
            'shipping_country' => 'required|string',
            'shipping_postal_code' => 'required|string',
            'billing_same_as_shipping' => 'boolean',
            'billing_name' => 'required_if:billing_same_as_shipping,false',
            'billing_email' => 'required_if:billing_same_as_shipping,false',
            'billing_phone' => 'required_if:billing_same_as_shipping,false',
            'billing_address' => 'required_if:billing_same_as_shipping,false',
            'billing_city' => 'required_if:billing_same_as_shipping,false',
            'billing_state' => 'required_if:billing_same_as_shipping,false',
            'billing_country' => 'required_if:billing_same_as_shipping,false',
            'billing_postal_code' => 'required_if:billing_same_as_shipping,false',
            'notes' => 'nullable|string',
            'stripe_token' => 'required_if:payment_method,stripe',
        ]);

        $user = $request->user();
        $cartItems = Cart::with('product')
            ->where('user_id', $user->id)
            ->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        // Check stock availability
        foreach ($cartItems as $item) {
            if ($item->product->stock_quantity < $item->quantity) {
                return response()->json([
                    'message' => "Insufficient stock for {$item->product->name}"
                ], 400);
            }
        }

        DB::beginTransaction();
        try {
            // Calculate totals
            $subtotal = $cartItems->sum(function ($item) {
                return $item->product->price * $item->quantity;
            });

            $tax = $subtotal * 0.1; // 10% tax
            $shippingCost = 50; // Fixed shipping
            $total = $subtotal + $tax + $shippingCost;

            // Set billing same as shipping if needed
            if ($validated['billing_same_as_shipping'] ?? true) {
                $validated['billing_name'] = $validated['shipping_name'];
                $validated['billing_email'] = $validated['shipping_email'];
                $validated['billing_phone'] = $validated['shipping_phone'];
                $validated['billing_address'] = $validated['shipping_address'];
                $validated['billing_city'] = $validated['shipping_city'];
                $validated['billing_state'] = $validated['shipping_state'];
                $validated['billing_country'] = $validated['shipping_country'];
                $validated['billing_postal_code'] = $validated['shipping_postal_code'];
            }

            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'shipping_cost' => $shippingCost,
                'total' => $total,
                'payment_method' => $validated['payment_method'],
                'payment_status' => $validated['payment_method'] === 'cod' ? 'pending' : 'pending',
                'status' => 'pending',
                'shipping_name' => $validated['shipping_name'],
                'shipping_email' => $validated['shipping_email'],
                'shipping_phone' => $validated['shipping_phone'],
                'shipping_address' => $validated['shipping_address'],
                'shipping_city' => $validated['shipping_city'],
                'shipping_state' => $validated['shipping_state'],
                'shipping_country' => $validated['shipping_country'],
                'shipping_postal_code' => $validated['shipping_postal_code'],
                'billing_name' => $validated['billing_name'],
                'billing_email' => $validated['billing_email'],
                'billing_phone' => $validated['billing_phone'],
                'billing_address' => $validated['billing_address'],
                'billing_city' => $validated['billing_city'],
                'billing_state' => $validated['billing_state'],
                'billing_country' => $validated['billing_country'],
                'billing_postal_code' => $validated['billing_postal_code'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create order items and update stock
            foreach ($cartItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name,
                    'product_sku' => $item->product->sku,
                    'quantity' => $item->quantity,
                    'price' => $item->product->price,
                    'total' => $item->product->price * $item->quantity,
                ]);

                // Update product stock and order count
                $item->product->decrement('stock_quantity', $item->quantity);
                $item->product->increment('order_count');

                // Log purchase activity
                UserActivity::create([
                    'user_id' => $user->id,
                    'product_id' => $item->product_id,
                    'activity_type' => 'purchase',
                    'metadata' => ['order_id' => $order->id]
                ]);
            }

            // Process payment if not COD
            if ($validated['payment_method'] === 'stripe') {
                $this->processStripePayment($order, $validated['stripe_token']);
            }

            // Clear cart
            Cart::where('user_id', $user->id)->delete();

            DB::commit();

            return response()->json([
                'message' => 'Order created successfully',
                'order' => $order->load('items')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error creating order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function processStripePayment(Order $order, $token)
    {
        try {
            Stripe::setApiKey(config('services.stripe.secret'));

            $charge = Charge::create([
                'amount' => $order->total * 100, // Convert to cents
                'currency' => 'usd',
                'description' => 'Order #' . $order->order_number,
                'source' => $token,
                'metadata' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number
                ]
            ]);

            $order->update([
                'payment_status' => 'paid',
                'transaction_id' => $charge->id,
                'status' => 'processing'
            ]);

            return true;
        } catch (\Exception $e) {
            \Log::error('Stripe payment error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function cancelOrder(Order $order, Request $request)
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!in_array($order->status, ['pending', 'processing'])) {
            return response()->json([
                'message' => 'Order cannot be cancelled'
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Restore stock
            foreach ($order->items as $item) {
                $item->product->increment('stock_quantity', $item->quantity);
            }

            $order->update(['status' => 'cancelled']);

            DB::commit();

            return response()->json(['message' => 'Order cancelled successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error cancelling order'], 500);
        }
    }
}