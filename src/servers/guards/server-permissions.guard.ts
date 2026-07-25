import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RolePermissions } from '@prisma/__generated__/client'
import { PrismaService } from 'src/prisma/prisma.service'

import { PERMISSIONS_KEY } from '../decorators/server-permissions.decorator'

@Injectable()
export class ServerPermissionsGuard implements CanActivate {
	constructor(
		private prismaService: PrismaService,
		private reflector: Reflector
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredPermissions = this.reflector.getAllAndOverride<
			RolePermissions[]
		>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()])

		const request = context.switchToHttp().getRequest()
		const userId = request.user?.id
		const serverId = request.params.serverId

		if (!userId || !serverId) {
			throw new ForbiddenException(
				'Недостаточно данных для проверки прав'
			)
		}

		const server = await this.prismaService.server.findUnique({
			where: { id: serverId },
			select: {
				ownerId: true,
				members: {
					where: { userId: userId },
					select: { roles: true }
				}
			}
		})

		if (!server) {
			throw new NotFoundException('Сервер не найден')
		}

		const isOwner = server.ownerId === userId
		if (isOwner) return true

		const member = server.members[0]
		if (!member) {
			throw new ForbiddenException(
				'Вы не являетесь участником этого сервера'
			)
		}

		if (!requiredPermissions || requiredPermissions.length === 0) {
			return true
		}

		const userRoles = member.roles || []
		const userPermissionsFlat = userRoles.flatMap(r => r.permissions)
		const userPermissionsSet = new Set(userPermissionsFlat)

		const hasRequiredPermissions =
			requiredPermissions.every(p => userPermissionsSet.has(p)) ||
			userPermissionsSet.has(RolePermissions.OWNER)

		if (!hasRequiredPermissions) {
			throw new ForbiddenException(
				'У вас недостаточно прав для этого действия'
			)
		}

		return true
	}
}
