import { Router, useRouter } from "next/router";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/apiClient";

type ResponseMe = {
  email: string
  token: string
  refreshToken: string
  permissions: string[]
  roles: string[]
}

type User = {
  email: string
  permissions: string[]
  roles: string[]
}

interface SignInCredentials {
  email: string
  password: string
}

interface AuthContextData {
  signIn (credentials: SignInCredentials): Promise<void>
  signOut (): void
  isAuthenticated: boolean,
  user: User | null
}

export const AuthContext = createContext({} as AuthContextData)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider ({children}: AuthProviderProps) {
  const {push} = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const isAuthenticated = !!user

  let authChannel: BroadcastChannel

  if (process.browser) {
    authChannel = new BroadcastChannel('auth')
  }

  useEffect(() => {
    authChannel.onmessage = (message) => {
      switch (message.data) {
        case 'signOut':
          signOut()
          break;
          break;
        default:
          break;
      }
    }
  }, [])
  
  useEffect(() => {
    const {'nextauth.token': token} = parseCookies()

    if (token) {
      api.get<ResponseMe>('me')
      .then((res) => {
        if (!res || res?.status != 200) return

        const {email, permissions, roles} = res.data
        
        setUser({
          email,
          permissions,
          roles
        })
      })
      .catch((error) => {
        signOut()
        push("/")
      })
    }
  }, [])

  async function signIn ({ email, password }: SignInCredentials) {
    try {
      const { data } = await api.post('sessions', {
        email,
        password
      })

      const { token, refreshToken, permissions, roles } = data

      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: '/'
      })
      
      setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: '/'
      })
      
      setUser({
        email,
        permissions,
        roles
      })

      api.defaults.headers.common['Authorization'] = `Bearer ${String(token)}`
      
      push('/dashboard')
    } catch (error) {
      console.log(error)
    }
  }

  function signOut () {
    destroyCookie(undefined, 'nextauth.token')
    destroyCookie(undefined, 'nextauth.refrashToken')
    authChannel.postMessage('signOut')
    push('/')
  }
  
  return (
    <AuthContext.Provider value={{isAuthenticated, signIn, user, signOut}}>
      {children}
    </AuthContext.Provider>
  )
}