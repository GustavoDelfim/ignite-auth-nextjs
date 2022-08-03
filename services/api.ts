import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { GetServerSidePropsContext } from "next";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../context/AuthContext";

let isRefreshing = false
let failedRequestQueue: {
  onSuccess (token: string): void
  onFailed (error: AxiosError): void
}[] = []

export function setupAPIClient (ctx: GetServerSidePropsContext | undefined = undefined) {
  let cookies = parseCookies(ctx)

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  })
  
  interface ErrorResponse {
    code: string
  }
  
  api.interceptors.response.use((res) => {
    return res
  }, (error: AxiosError<ErrorResponse>) => {
    const { response, config } = error
  
    if (response?.status == 401) {
      if (response.data?.code == 'token.expired') {
        cookies = parseCookies(ctx)
  
        const { 'nextauth.refreshToken': refreshToken } = cookies
        const originalConfig: AxiosRequestConfig = config
  
        if (!isRefreshing) {
          isRefreshing = true
          
          api.post('refresh', {
            refreshToken
          })
          .then(res => {
            const { token } = res.data
  
            setCookie(ctx, 'nextauth.token', token, {
              maxAge: 60 * 60 * 24 * 30, // 30 dias
              path: '/'
            })
            
            setCookie(ctx, 'nextauth.refreshToken', res.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30, // 30 dias
              path: '/'
            })
  
            api.defaults.headers.common['Authorization'] = `Bearer ${String(token)}` 
  
            failedRequestQueue.forEach(request => request.onSuccess(token))
            failedRequestQueue = []
          })
          .catch((error) => {
            failedRequestQueue.forEach(request => request.onFailed(error))
            failedRequestQueue = []
  
            // if (typeof window) {
            //   signOut()
            // }
          })
          .finally(() => {
            isRefreshing = false
          })
        }
  
        return new Promise((resolve, reject) => {
          failedRequestQueue.push({
            onSuccess: (token: string) => {
              if (originalConfig.headers) {
                originalConfig.headers.Authorization = `Bearer ${token}`
              }
              resolve(api(originalConfig))
            },
            onFailed: (error: AxiosError) => {
              reject(error)
            }
          })
        })
      } else {
        // if (typeof window) {
        //   signOut()
        // }
        // window.location.href = "/"
        console.log('Caiu aqui')
      }
    }
  
    return Promise.reject(error)
  })

  return api
}