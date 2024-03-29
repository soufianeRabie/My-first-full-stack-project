import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiServices } from '../../services/axiosServices.js'
import { useAuth } from '../../Context/GlobalState.jsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { BiLoader } from 'react-icons/bi'
import { Library } from '../../Library/Library.jsx'
import Loading from '../Loadings/Loading.jsx'

function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const [loginIsLoading, setLoginIsLoading] = useState(false)
  const [registerIsLoading, setRegisterIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [message, setMessage] = useState('')
  const { dispatch, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    if (location.state && location.state.mustLogin) {
      Library.showToast('you need to login first', 'info')
    }
  }, [location.state])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        navigate('/')
      } catch (error) {
        dispatch({
            type: 'EMPTY_BASKET',
            user: null,
          })
          navigate('/')
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const handleRegister = async (e) => {
    setRegisterIsLoading(true)
    e.preventDefault()
    try {
      const response = await ApiServices.register({ email, password })

      if (response.status === 200) {
        Library.showToast(
          'account created successfully ',
          'success',
          'top-right',
          4000,
        )
      }
    } catch ({ response }) {
      Library.showToast(response.data.message, 'error', 'top-right', 4000)
    } finally {
      setRegisterIsLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginIsLoading(true)
    try {
      const response = await ApiServices.login({ email, password })
      if (response.status === 401) {
        setIsError(true)
        setMessage(response.error)
      } else {
        try {
          await ApiServices.getUser().then(async (responseUser) => {
            if (responseUser.data.role === 0) {
              await ApiServices.addGeustCartToUser()
              await ApiServices.UserCart().then(({ data }) => {
                const cartItems = data.cart.map((item) => ({
                  itemId: item.product_id,
                  quantity: item.quantity,
                }))
                dispatch({
                  type: 'SET_BASKET',
                  payload: cartItems,
                })
                Library.setUser(dispatch, responseUser)
              })
              return navigate('/', { state: { welcomeMessage: true } })
            } else if (
              responseUser.data.role ===
              parseInt(import.meta.env.VITE_APP_ADMIN_ROLE_NUMBER)
            ) {
              Library.setUser(dispatch, responseUser)
              return navigate('/admin', { state: { welcomeMessage: true } })
            } else {
              logout(navigate, dispatch)
            }
          })
        } catch (error) {
          setIsError(true)
          setMessage(error)
        }
      }
    } catch (error) {
      setIsError(true)
      setMessage(error.response.data.error)
    } finally {
      setLoginIsLoading(false)
    }
  }
  if (isLoading) {
    return <Loading />
  }

  return (
    <div className={'h-screen flex justify-center items-center'}>
      <div>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          pauseOnHover
          draggable={true}
        />
      </div>
      <div
        className={
          'w-80 sm:w-96 h-fit bg-white border border-gray-200 rounded shadow-black'
        }
      >
        <div className={'mx-3 p-4'}>
          <h1 className={'text-xl font-bold'}>Sign in</h1>
        </div>
        <form>
          <div className={'px-5 mb-4'}>
            <label className={'block mb-2 font-bold'}>Email</label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              className={'text-red-600 w-full h-8 p-1 border border-gray-900'}
              type="email"
              name={'email'}
            />
            {isError && (
              <span className={'text-red-600 font-semibold text-sm'}>
                {message}
              </span>
            )}
          </div>

          <div className={'px-5 mb-4'}>
            <label className={'block mb-2 font-bold'}>Password</label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              className={'text-red-600 h-8 p-1 w-full border border-gray-900'}
              type="password"
              name={'password'}
            />
          </div>
          <div className={'px-5 mb-4'}>
            <button
              disabled={loginIsLoading}
              type={'submit'}
              onClick={handleLogin}
              className={'bg-amber-800 font-bold rounded-md w-full p-1'}
            >
              {loginIsLoading ? (
                <span className={'font-mono text-sm'}>loading...</span>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </div>
          <div className={'px-5 mb-4'}>
            <p className={'text-sm'}>
              by contunui you agree to Amazons's Fake Clone Conditions of Use
              and Privacy Notice
            </p>
          </div>
          <div className={'px-5 mb-5'}>
            <button
              disabled={registerIsLoading}
              type={'submit'}
              onClick={handleRegister}
              className={'bg-gray-200 font-semibold rounded-md w-full p-1'}
            >
              {registerIsLoading ? (
                <span
                  className={
                    'font-mono text-sm flex justify-center items-center gap-1'
                  }
                >
                  <BiLoader className={'animate-spin'} /> loading...
                </span>
              ) : (
                <span>Create your amazon account</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Auth
