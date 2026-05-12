import React, { useState, useContext } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "./CSS/Login.css"
import { GlobalStateContext } from '../context/GlobalStateContext'
const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  
  const { login } = useContext(GlobalStateContext)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      if (isLogin) {
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        const { auth } = await import('../firebase')
        await signInWithEmailAndPassword(auth, email, password)
        navigate('/', { replace: true })
      } else {
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
        const { auth } = await import('../firebase')
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(userCredential.user, { displayName: name })
        navigate('/', { replace: true })
      }
    } catch (error) {
      console.error("Auth error:", error)
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError("Invalid email or password")
      } else if (error.code === 'auth/email-already-in-use') {
        setError("Email already in use")
      } else if (error.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters")
      } else {
        setError("Authentication failed. Please try again.")
      }
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-card">
        <h2>{isLogin ? "Login" : "Sign Up"}</h2>
        
        {error && <div className="error-message">{error}</div>}

        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="login-input"
            required
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          required
        />

        <button type="submit" className="login-button">
          {isLogin ? "Login" : "Sign Up"}
        </button>

        <div className="social-login">
          <button 
            type="button" 
            className="google-button"
            onClick={async () => {
              try {
                const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
                const { auth } = await import('../firebase')
                const provider = new GoogleAuthProvider()
                await signInWithPopup(auth, provider)
                navigate(from, { replace: true })
              } catch (error) {
                console.error("Google login error:", error)
                setError("Google sign-in failed. Please try again.")
              }
            }}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Sign in with Google
          </button>
        </div>

        <p className="login-toggle">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)}>
            {" "}
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </p>
      </form>
    </div>
  )
}

export default LoginPage