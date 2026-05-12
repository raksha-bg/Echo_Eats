import React, { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { auth } from '../firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'

export const GlobalStateContext = createContext()

export const GlobalStateProvider = ({ children }) => {
  const [Quantity, setQuantity] = useState(0)
  const [Togg, setTogg] = useState(false)
  const [displayCart, setDisplayCart] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState('')
  const [foodData, setFoodData] = useState([])
  const navigate = useNavigate()

  const SAMPLE_FOODS = [
    { FoodID: 1, FoodName: 'Margherita Pizza', Price: 199, Category: 'Pizza', Quantity: 0, ImageName: '01_Margherita.jpeg' },
    { FoodID: 2, FoodName: 'Farmhouse Pizza', Price: 249, Category: 'Pizza', Quantity: 0, ImageName: '02_Farmhouse.jpeg' },
    { FoodID: 3, FoodName: 'Pepperoni Pizza', Price: 299, Category: 'Pizza', Quantity: 0, ImageName: '03_Pepperoni.jpeg' },
    { FoodID: 4, FoodName: 'Veggie Burger', Price: 129, Category: 'Burger', Quantity: 0, ImageName: '04_VeggieBurger.jpeg' },
    { FoodID: 5, FoodName: 'Chicken Burger', Price: 179, Category: 'Burger', Quantity: 0, ImageName: '05_ChickenBurger.jpeg' },
    { FoodID: 6, FoodName: 'Cheese Burger', Price: 149, Category: 'Burger', Quantity: 0, ImageName: '06_CheeseBurger.jpeg' },
    { FoodID: 7, FoodName: 'Chicken Biryani', Price: 299, Category: 'Main Course', Quantity: 0, ImageName: '07_ChickenBiryani.jpeg' },
    { FoodID: 8, FoodName: 'North Indian Thali', Price: 349, Category: 'Main Course', Quantity: 0, ImageName: '08_Thali.jpeg' },
    { FoodID: 9, FoodName: 'Masala Dosa', Price: 89, Category: 'Snacks', Quantity: 0, ImageName: '09_MasalaDosa.jpeg' },
    { FoodID: 10, FoodName: 'Obbattu', Price: 49, Category: 'Dessert', Quantity: 0, ImageName: '10_Obbattu.jpeg' },
    { FoodID: 11, FoodName: 'Vangi Bath', Price: 79, Category: 'Main Course', Quantity: 0, ImageName: '11_VangiBath.jpeg' },
  ]

  // ── Fetch food items ──────────────────────────────────────────────────────────
  const fetchFoodData = useCallback(async () => {
    // If not logged in, don't show any food items (as requested)
    if (!localStorage.getItem('isLoggedIn') || localStorage.getItem('isLoggedIn') === 'false') {
      setFoodData([])
      setQuantity(0)
      setDisplayCart(false)
      return
    }

    // Use hardcoded items for stability instead of Django
    setFoodData(SAMPLE_FOODS)
    syncCartState(SAMPLE_FOODS)
  }, [syncCartState])

  // ── Firebase Auth Listener + Session Setup ──────────────────────────────────
  useEffect(() => {
    // 1. Session ID setup
    let sid = localStorage.getItem('sessionId')
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('sessionId', sid)
    }
    setSessionId(sid)

    // 2. Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          user_id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email
        }
        setUser(userData)
        setIsLoggedIn(true)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('isLoggedIn', 'true')
        fetchFoodData() // Load items after login
      } else {
        setUser(null)
        setIsLoggedIn(false)
        setFoodData([]) // Clear items on logout
        localStorage.removeItem('user')
        localStorage.setItem('isLoggedIn', 'false')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [fetchFoodData])

  // ── Update quantity — local only (using Firestore for real orders later) ─────
  const updateQuantity = useCallback(async (foodId, delta) => {
    setFoodData(prev => {
      const updated = prev.map(item => {
        if (item.FoodID !== foodId) return item
        return { ...item, Quantity: Math.max(0, (item.Quantity || 0) + delta) }
      })
      syncCartState(updated)
      return updated
    })
  }, [syncCartState])

  // ── Clear cart ──────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    setFoodData(prev => prev.map(item => ({ ...item, Quantity: 0 })))
    setQuantity(0)
    setDisplayCart(false)
  }, [])

  // ── Transfer guest session cart → logged-in user ────────────────────────────
  const transferSessionCartToUser = useCallback(async () => {
    try {
      const sessionRes = await fetch(`/session-cart/${sessionId}/`)
      const sessionCart = await sessionRes.json()

      for (const item of sessionCart) {
        await fetch(`/update-quantity/${item.food_id}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: item.quantity }),
        })
      }

      await fetch(`/session-cart/clear/${sessionId}/`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error transferring cart:', error)
    }
  }, [sessionId])

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (userData) => {
    await transferSessionCartToUser()

    setUser(userData)
    setIsLoggedIn(true)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('isLoggedIn', 'true')

    // Refresh food data so DB quantities (merged from session cart) show up
    fetchFoodData()
  }, [transferSessionCartToUser, fetchFoodData])

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await signOut(auth)
      await clearCart()
      localStorage.removeItem('user')
      localStorage.removeItem('isLoggedIn')
      setUser(null)
      setIsLoggedIn(false)
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [clearCart, navigate])

  const value = {
    Quantity, setQuantity,
    Togg, setTogg,
    displayCart, setDisplayCart,
    user, setUser,
    isLoggedIn, setIsLoggedIn,
    loading,
    sessionId,
    logout,
    login,
    updateQuantity,
    foodData,
    fetchFoodData,   // exposed so other components can manually refresh if needed
  }

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  )
}
