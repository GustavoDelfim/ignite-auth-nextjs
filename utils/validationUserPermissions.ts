type User = {
  permissions: string[]
  roles: string[]
}

interface ValidationUserPermissionsParams {
  user: User | null
  permissions?: string[]
  roles?: string[]
}

export function validationUserPermissions ({
  user,
  permissions,
  roles
}: ValidationUserPermissionsParams) {
  if (permissions && permissions?.length > 0) {
    const hasAllPermissions = permissions.every(permission => {
      return user?.permissions.includes(permission)
    })

    if (!hasAllPermissions) {
      return false
    }
  }

  if (roles && roles?.length > 0) {
    const hasAllRoles = roles.some(permission => {
      return user?.roles.includes(permission)
    })

    if (!hasAllRoles) {
      return false
    }
  }

  return true
}