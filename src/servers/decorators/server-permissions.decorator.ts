import { SetMetadata } from '@nestjs/common'
import { RolePermissions } from '@prisma/__generated__/client'

export const PERMISSIONS_KEY = 'server_permissions'
export const ServerPermissions = (...roles: RolePermissions[]) =>
	SetMetadata(PERMISSIONS_KEY, roles)
