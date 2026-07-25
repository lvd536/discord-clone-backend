import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'

import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class ChannelMessageOwnerGuard implements CanActivate {
	constructor(private readonly prisma: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()
		const userId = request.user?.id
		const messageId = request.params.messageId

		if (!userId || !messageId) return false

		const message = await this.prisma.message.findUnique({
			where: { id: messageId },
			select: {
				member: {
					select: { userId: true }
				}
			}
		})

		if (!message) {
			throw new NotFoundException('Сообщение не найдено')
		}

		if (message.member.userId !== userId) {
			throw new ForbiddenException(
				'Вы не являетесь автором этого сообщения'
			)
		}

		return true
	}
}
