import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '@prisma/__generated__/enums'

import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()]
		)

		if (!requiredRoles) return true

		const { user } = context.switchToHttp().getRequest()

		if (!user) throw new ForbiddenException('Пользователь не авторизован')

		const hasRole = requiredRoles.includes(user.role)
		if (!hasRole)
			throw new ForbiddenException('У вас нет доступа к этому ресурсу')

		return true
	}
}
