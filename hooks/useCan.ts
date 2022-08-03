import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import { validationUserPermissions } from "../utils/validationUserPermissions"

interface UseCanParams {
  permissions?: string[]
  roles?: string[]
}

export function useCan ({ permissions, roles }: UseCanParams) {
  const { isAuthenticated, user } = useContext(AuthContext)

  if (!isAuthenticated) {
    return false
  }
  
  return validationUserPermissions({ user, permissions, roles })
}