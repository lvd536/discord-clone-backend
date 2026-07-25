import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'

import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class DirectMessageOwnerGuard implements CanActivate {
	constructor(private readonly prisma: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()
		const userId = request.user?.id
		const messageId = request.params.messageId

		if (!userId || !messageId) return false

		const message = await this.prisma.directMessage.findUnique({
			where: { id: messageId },
			select: { senderId: true }
		})

		if (!message) {
			throw new NotFoundException('Сообщение не найдено')
		}

		if (message.senderId !== userId) {
			throw new ForbiddenException(
				'Вы не являетесь автором этого сообщения'
			)
		}

		return true
	}
}
