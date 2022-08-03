import jwtDecode from "jwt-decode"
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next"
import { parseCookies } from "nookies"
import { validationUserPermissions } from "./validationUserPermissions"

interface WithSSRAuthOptions {
  permissions?: string[]
  roles?: string[]
}

export function withSSRAuth<T> (fn: GetServerSideProps<T>, options?: WithSSRAuthOptions) {
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<T>> => {
    const cookies = parseCookies(ctx)
    const token = cookies["nextauth.token"]

    if (!token) {
      return {
        redirect: {
          destination: "/",
          permanent: false
        }
      }
    }

    if (options) {
      const user = jwtDecode<{ permissions: string[], roles: string[] }>(token)
      const permissions = options?.permissions || []
      const roles = options?.roles || []

      const isValidateUserPermission = validationUserPermissions({ user, permissions, roles })

      if (!isValidateUserPermission) {
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false
          }
        }
      }
    }

    return await fn(ctx)
  }
}