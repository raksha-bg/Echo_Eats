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

  // ── Derive cart totals from foodData instead of maintaining separate state ──
  const syncCartState = useCallback((data) => {
    const total = data.reduce((sum, item) => sum + (item.Quantity || 0), 0)
    setQuantity(total)
    setDisplayCart(total > 0)
  }, [])

  // ── Fetch food items once on mount ──────────────────────────────────────────
  const fetchFoodData = useCallback(async () => {
    try {
      const res = await fetch('/food-items/')
      const data = await res.json()
      setFoodData(data)
      syncCartState(data)
    } catch (error) {
      console.error('Error fetching food data:', error)
    }
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
      } else {
        setUser(null)
        setIsLoggedIn(false)
        localStorage.removeItem('user')
        localStorage.setItem('isLoggedIn', 'false')
      }
      setLoading(false)
      fetchFoodData()
    })

    return () => unsubscribe()
  }, [fetchFoodData])

  // ── Update quantity — optimistic local update, one API call ─────────────────
  const updateQuantity = useCallback(async (foodId, delta) => {
    // 1. Optimistically update local state so UI responds instantly
    setFoodData(prev => {
      const updated = prev.map(item => {
        if (item.FoodID !== foodId) return item
        return { ...item, Quantity: Math.max(0, (item.Quantity || 0) + delta) }
      })
      syncCartState(updated)
      return updated
    })

    // 2. Persist to backend
    try {
      let response

      if (isLoggedIn && user) {
        response = await fetch(`/update-quantity/${foodId}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: delta }),
        })
      } else {
        // Session cart: read current local quantity instead of fetching again
        const currentItem = foodData.find(item => item.FoodID === foodId)
        const currentQty = currentItem?.Quantity || 0
        const newQuantity = Math.max(0, currentQty + delta)

        response = await fetch('/session-cart/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, foodId, quantity: newQuantity }),
        })
      }

      if (!response.ok) {
        // Roll back optimistic update if backend rejected it
        console.error('Backend rejected quantity update — rolling back')
        fetchFoodData()
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      fetchFoodData()   // re-sync on network error
    }
  }, [isLoggedIn, user, sessionId, foodData, syncCartState, fetchFoodData])

  // ── Clear cart ──────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    try {
      if (isLoggedIn && user) {
        const itemsInCart = foodData.filter(item => item.Quantity > 0)
        for (const item of itemsInCart) {
          await fetch(`/update-quantity/${item.FoodID}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: -item.Quantity }),   // set to 0
          })
        }
      } else {
        await fetch(`/session-cart/clear/${sessionId}/`, {
          method: 'DELETE',
        })
      }

      // Clear locally
      setFoodData(prev => prev.map(item => ({ ...item, Quantity: 0 })))
      setQuantity(0)
      setDisplayCart(false)
    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }, [isLoggedIn, user, sessionId, foodData])

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
