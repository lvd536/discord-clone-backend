import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class DirectMessagesService {
	constructor(private readonly prismaService: PrismaService) {}

	async create(content: string, conversationId: string, userId: string) {
		return this.prismaService.directMessage.create({
			data: {
				content,
				conversationId,
				senderId: userId
			},
			include: {
				sender: {
					select: {
						id: true,
						displayName: true,
						avatarUrl: true
					}
				}
			}
		})
	}

	async edit(content: string, messageId: string) {
		return this.prismaService.directMessage.update({
			data: { content },
			where: { id: messageId },
			include: {
				sender: {
					select: {
						id: true,
						displayName: true,
						avatarUrl: true
					}
				}
			}
		})
	}

	async delete(messageId: string) {
		return this.prismaService.directMessage.delete({
			where: { id: messageId }
		})
	}

	async getDirectMessagesHistory(conversationId: string, limit = 50) {
		return this.prismaService.directMessage.findMany({
			where: { conversationId },
			take: limit,
			orderBy: {
				createdAt: 'desc'
			},
			include: {
				sender: {
					select: {
						id: true,
						displayName: true,
						avatarUrl: true
					}
				}
			}
		})
	}
}
