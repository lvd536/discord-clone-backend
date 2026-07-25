import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable
} from '@nestjs/common'

import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class ConversationAccessGuard implements CanActivate {
	constructor(private readonly prisma: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()
		const userId = request.user?.id
		const conversationId = request.params.conversationId

		if (!userId || !conversationId) return false

		const participant =
			await this.prisma.conversationParticipant.findUnique({
				where: {
					conversationId_userId: {
						conversationId,
						userId
					}
				}
			})

		if (!participant) {
			throw new ForbiddenException(
				'Вы не являетесь участником этой беседы'
			)
		}

		return true
	}
}
