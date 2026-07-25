import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class MessagesService {
	constructor(private readonly prismaService: PrismaService) {}

	async create(content: string, channelId: string, userId: string) {
		const channel = await this.prismaService.channel.findUnique({
			where: { id: channelId },
			select: { serverId: true }
		})

		if (!channel) {
			throw new NotFoundException('Канал не найден')
		}

		const member = await this.prismaService.member.findUnique({
			where: {
				userId_serverId: {
					serverId: channel.serverId,
					userId
				}
			},
			select: { id: true }
		})

		if (!member) {
			throw new NotFoundException(
				'Вы не являетесь участником этого сервера'
			)
		}

		return this.prismaService.message.create({
			data: {
				content,
				channelId,
				memberId: member.id
			},
			include: {
				member: {
					select: {
						user: {
							select: {
								id: true,
								displayName: true,
								avatarUrl: true
							}
						}
					}
				}
			}
		})
	}

	async edit(content: string, messageId: string) {
		return this.prismaService.message.update({
			data: { content },
			where: { id: messageId },
			include: {
				member: {
					select: {
						user: {
							select: {
								id: true,
								displayName: true,
								avatarUrl: true
							}
						}
					}
				}
			}
		})
	}

	async delete(messageId: string) {
		return this.prismaService.message.delete({
			where: { id: messageId }
		})
	}

	async getMessagesHistory(channelId: string, limit = 50) {
		return this.prismaService.message.findMany({
			where: { channelId },
			take: limit,
			orderBy: {
				createdAt: 'desc'
			},
			include: {
				member: {
					select: {
						user: {
							select: {
								id: true,
								displayName: true,
								avatarUrl: true
							}
						}
					}
				}
			}
		})
	}
}
