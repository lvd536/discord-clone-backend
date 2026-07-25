import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class LivekitChannelGuard implements CanActivate {
	constructor(private prismaService: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()
		const userId = request.user?.id
		const serverId = request.body.serverId
		const channelId = request.body.channelId

		if (!userId || !channelId) {
			throw new ForbiddenException(
				'Недостаточно данных для проверки прав'
			)
		}

		if (serverId) {
			const server = await this.prismaService.server.findUnique({
				where: { id: serverId },
				select: {
					ownerId: true,
					members: {
						where: { userId: userId },
						select: { id: true }
					},
					channels: {
						where: {
							id: channelId
						}
					}
				}
			})

			if (!server || !server.channels || server.channels.length < 1) {
				throw new NotFoundException('Сервер или чат не найден')
			}

			if (server.members.length < 1) {
				throw new ForbiddenException('Вы не состоите на этом сервере')
			}

			return true
		}

		const participant =
			await this.prismaService.conversationParticipant.findUnique({
				where: {
					conversationId_userId: {
						conversationId: channelId,
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
