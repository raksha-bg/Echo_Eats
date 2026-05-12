import React, { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import './CSS/Cart.css'
import { GlobalStateContext } from '../context/GlobalStateContext'

const CartPage = () => {
    const { isLoggedIn, user, foodData, updateQuantity } = useContext(GlobalStateContext)
    const [cartItems, setCartItems] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showOrderPopup, setShowOrderPopup] = useState(false)
    const [orderMessage, setOrderMessage] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const itemsInCart = foodData.filter(item => item.Quantity > 0)
        setCartItems(itemsInCart)
        const totalPrice = itemsInCart.reduce((sum, item) =>
            sum + (parseFloat(item.Price) * item.Quantity), 0)
        setTotal(totalPrice)
    }, [foodData])

    const handleCheckout = () => {
        if (!isLoggedIn) {
            navigate('/login', { state: { from: { pathname: '/cart' } } })
            return
        }
        setShowPaymentModal(true)
    }

    // ── Cash on Delivery ─────────────────────────────────────────────────────
    const handleCOD = async () => {
        setShowPaymentModal(false)
        setLoading(true)
        try {
            const { collection, addDoc } = await import('firebase/firestore')
            const { db } = await import('../firebase')
            const orderId = 'ORD_' + Date.now()
            await addDoc(collection(db, 'orders'), {
                orderId,
                userId: user.user_id,
                amount: total,
                items: cartItems,
                paymentMethod: 'COD',
                status: 'placed',
                createdAt: new Date()
            })
            setOrderMessage('Order placed! Your food is on the way 🛵')
            setShowOrderPopup(true)
            for (const item of cartItems) {
                await updateQuantity(item.FoodID, -item.Quantity)
            }
            setTimeout(() => { setShowOrderPopup(false); navigate('/orders') }, 3000)
        } catch (error) {
            console.error('COD error:', error)
            alert('Failed to place order: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    // ── UPI / Razorpay ────────────────────────────────────────────────────────
    const handleUPI = async () => {
        setShowPaymentModal(false)
        setLoading(true)
        try {
            // 1. Load Razorpay script
            if (!window.Razorpay) {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script')
                    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
                    s.async = true
                    s.onload = resolve
                    s.onerror = () => reject(new Error('Razorpay SDK failed to load'))
                    document.body.appendChild(s)
                })
            }

            // 2. Create order via Node.js backend
            const resp = await fetch('/api/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: total, receipt: 'ORD_' + Date.now() })
            })
            const orderData = await resp.json()
            if (!orderData.success) throw new Error(orderData.error || 'Order creation failed')

            // 3. Open Razorpay
            const options = {
                key: 'rzp_test_SdTWYyzys8e6Zq',
                amount: total * 100,
                currency: 'INR',
                name: 'EchoEats',
                description: 'Food Order',
                order_id: orderData.razorpayOrderId,
                handler: async (response) => {
                    try {
                        const { collection, addDoc } = await import('firebase/firestore')
                        const { db } = await import('../firebase')
                        await addDoc(collection(db, 'orders'), {
                            orderId: orderData.orderId,
                            userId: user.user_id,
                            amount: total,
                            items: cartItems,
                            paymentMethod: 'UPI',
                            paymentId: response.razorpay_payment_id,
                            status: 'completed',
                            createdAt: new Date()
                        })
                        setOrderMessage('Payment successful! Order placed! 🍕')
                        setShowOrderPopup(true)
                        for (const item of cartItems) {
                            await updateQuantity(item.FoodID, -item.Quantity)
                        }
                        setTimeout(() => { setShowOrderPopup(false); navigate('/orders') }, 3000)
                    } catch (err) {
                        alert('Failed to save order: ' + err.message)
                    }
                },
                prefill: { name: user.name, email: user.email },
                theme: { color: '#a75e3d' },
                modal: { ondismiss: () => setLoading(false) }
            }
            const rzp = new window.Razorpay(options)
            rzp.open()
        } catch (error) {
            console.error('UPI error:', error)
            alert('Payment failed: ' + error.message)
            setLoading(false)
        }
    }

    return (
        <div className="cart-container">
            {showOrderPopup && (
                <div className="order-popup"><p>{orderMessage}</p></div>
            )}

            {showPaymentModal && (
                <div className="payment-modal" id="payment-modal">
                    <div className="payment-modal-content">
                        <h3>Select Payment Method</h3>
                        <button className="payment-option cod" onClick={handleCOD} disabled={loading}>
                            💵 Cash on Delivery
                        </button>
                        <button className="payment-option upi" onClick={handleUPI} disabled={loading}>
                            📱 UPI / Card / NetBanking
                        </button>
                        <button className="payment-option cancel" onClick={() => setShowPaymentModal(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <h1>Your Cart</h1>
            {cartItems.length === 0 ? (
                <div className="empty-cart">
                    <h2>Your cart is empty</h2>
                    <p>Add some delicious items from our menu!</p>
                    <button onClick={() => navigate('/')}>Browse Menu</button>
                </div>
            ) : (
                <>
                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div key={item.FoodID} className="cart-item">
                                <img src={item.ImageName} alt={item.FoodName} />
                                <div className="cart-item-details">
                                    <h3>{item.FoodName}</h3>
                                    <p>₹{parseFloat(item.Price).toFixed(2)}</p>
                                </div>
                                <div className="cart-item-quantity">
                                    <button onClick={() => updateQuantity(item.FoodID, item.Quantity > 1 ? -1 : -item.Quantity)}>-</button>
                                    <span>{item.Quantity}</span>
                                    <button onClick={() => updateQuantity(item.FoodID, 1)}>+</button>
                                </div>
                                <div className="cart-item-total">
                                    ₹{(parseFloat(item.Price) * item.Quantity).toFixed(2)}
                                </div>
                                <button className="remove-btn" onClick={() => updateQuantity(item.FoodID, -item.Quantity)}>
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="cart-total">
                        <h3>Total: ₹{total.toFixed(2)}</h3>
                        <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
                            {loading ? 'Processing...' : 'Proceed to Checkout'}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default CartPage