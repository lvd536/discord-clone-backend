import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { ConversationType } from '@prisma/__generated__/enums'
import { NotFoundError } from 'rxjs'

import { PrismaService } from '@/prisma/prisma.service'

import { EditGroupDto } from './dto/edit-group.dto'

@Injectable()
export class ConversationsService {
	constructor(private readonly prismaService: PrismaService) {}

	async getOrCreateDirectConversation(userId: string, friendId: string) {
		if (userId === friendId) {
			throw new BadRequestException('Нельзя создать чат с самим собой')
		}

		const existingConversation =
			await this.prismaService.conversation.findFirst({
				where: {
					type: ConversationType.DIRECT,
					AND: [
						{ participants: { some: { userId } } },
						{ participants: { some: { userId: friendId } } }
					]
				},
				include: {
					participants: {
						include: {
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

		if (existingConversation) {
			return existingConversation
		}

		return this.prismaService.conversation.create({
			data: {
				type: ConversationType.DIRECT,
				participants: {
					create: [{ userId }, { userId: friendId }]
				}
			},
			include: {
				participants: {
					include: {
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

	async createGroupConversation(
		ownerId: string,
		name: string,
		friendIds: string[]
	) {
		if (friendIds.length < 1) {
			throw new BadRequestException(
				'Групповой чат должен содержать хотя бы одного друга'
			)
		}

		const participantData = [ownerId, ...friendIds].map(userId => ({
			userId
		}))

		return this.prismaService.conversation.create({
			data: {
				type: ConversationType.GROUP,
				name,
				ownerId,
				participants: {
					create: participantData
				}
			},
			include: {
				participants: {
					include: {
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

	async deleteConversation(userId: string, conversationId: string) {
		const existingConversation =
			await this.prismaService.conversation.findUnique({
				where: { id: conversationId },
				select: {
					id: true,
					type: true,
					ownerId: true,
					participants: { where: { userId } }
				}
			})

		if (
			!existingConversation ||
			existingConversation.participants.length < 1
		) {
			throw new NotFoundException('Не удалось найти указанный чат')
		}

		const canDelete =
			existingConversation.type === 'DIRECT' ||
			(existingConversation.ownerId === userId &&
				existingConversation.type === 'GROUP')

		if (canDelete) {
			return this.prismaService.conversation.delete({
				where: { id: conversationId }
			})
		} else {
			throw new NotFoundException('Не удалось найти указанный чат')
		}
	}

	async editGroupConversation(
		userId: string,
		conversationId: string,
		dto: EditGroupDto
	) {
		if (dto.participiantIds.length < 1) {
			throw new BadRequestException(
				'Групповой чат должен содержать хотя бы одного друга'
			)
		}

		const existingConversation =
			await this.prismaService.conversation.findUnique({
				where: { id: conversationId },
				select: {
					type: true,
					ownerId: true,
					participants: {
						where: { userId }
					}
				}
			})

		if (!existingConversation || existingConversation.type !== 'GROUP') {
			throw new NotFoundException('Указанный групповой чат не найден')
		}

		if (existingConversation.ownerId !== userId) {
			throw new ForbiddenException(
				'Вы не являетесь создателем этого чата'
			)
		}

		const uniqueUserIds = Array.from(
			new Set([userId, ...dto.participiantIds])
		)

		const participantData = uniqueUserIds.map(id => ({ userId: id }))

		return this.prismaService.conversation.update({
			where: { id: conversationId },
			data: {
				name: dto.name,
				participants: {
					deleteMany: {},
					create: participantData
				}
			},
			include: {
				participants: {
					include: {
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

	async leaveFromGroupConversation(userId: string, conversationId: string) {
		const existingConversation =
			await this.prismaService.conversation.findUnique({
				where: { id: conversationId },
				select: {
					type: true,
					ownerId: true,
					participants: {
						where: { userId }
					}
				}
			})

		if (!existingConversation || existingConversation.type !== 'GROUP') {
			throw new NotFoundException('Указанный групповой чат не найден')
		}

		const isParticipant = existingConversation.participants.length > 0
		if (!isParticipant) {
			throw new BadRequestException(
				'Вы не являетесь участником этого чата'
			)
		}

		if (existingConversation.ownerId === userId) {
			throw new BadRequestException(
				'Создатель не может покинуть чат. Передайте права владельца другому участнику или удалите чат.'
			)
		}

		return this.prismaService.conversation.update({
			where: { id: conversationId },
			data: {
				participants: {
					delete: {
						conversationId_userId: {
							conversationId,
							userId
						}
					}
				}
			}
		})
	}

	async getUserConversations(userId: string) {
		return this.prismaService.conversation.findMany({
			where: {
				participants: {
					some: { userId }
				}
			},
			include: {
				participants: {
					include: {
						user: {
							select: {
								id: true,
								displayName: true,
								avatarUrl: true,
								email: true
							}
						}
					}
				},
				messages: {
					take: 1,
					orderBy: { createdAt: 'desc' },
					select: { content: true, createdAt: true }
				}
			},
			orderBy: {
				updatedAt: 'desc'
			}
		})
	}
}
