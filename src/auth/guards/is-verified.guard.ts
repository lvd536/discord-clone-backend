import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator'

@Injectable()
export class IsVerifiedGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const isPublic = this.reflector.getAllAndOverride<boolean>(
			IS_PUBLIC_KEY,
			[context.getHandler(), context.getClass()]
		)

		if (isPublic) {
			return true
		}

		const { user } = context.switchToHttp().getRequest()

		if (!user) throw new ForbiddenException('Пользователь не авторизован')
		if (!user.isVerified)
			throw new ForbiddenException('Аккаунт не верифицирован')

		return true
	}
}
