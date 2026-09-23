import { Injectable, Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'

import { PrismaService } from '@/prisma/prisma.service'

export interface NotificationPayload {
	channelId: string
	message: string
	type:
		'NEW_MESSAGE_NOTIFICATION' | 'FRIENDSHIP_REQUEST' | 'FRIENDSHIP_ACCEPT'
	metadata?: {
		serverId?: string
		channelName?: string
		senderName?: string
		conversationId?: string
	}
}

@Injectable()
export class NotificationsService {
	private server: Server | null = null
	private readonly logger = new Logger(NotificationsService.name)

	constructor(private readonly prismaService: PrismaService) {}

	setServer(server: Server) {
		this.server = server
	}

	async getUserServerRooms(userId: string): Promise<string[]> {
		const userServers = await this.prismaService.member.findMany({
			where: { userId },
			select: { serverId: true }
		})

		return userServers.map(s => `servers:${s.serverId}`)
	}

	async getUserConversationRooms(userId: string): Promise<string[]> {
		const conversations =
			await this.prismaService.conversationParticipant.findMany({
				where: { userId },
				select: { conversationId: true }
			})
		return conversations.map(c => `conversations:${c.conversationId}`)
	}

	notifyServer(serverId: string, payload: NotificationPayload) {
		if (!this.server) {
			return this.logger.warn(
				'Попытка отправки сокет-уведомления до инициализации сервера'
			)
		}
		this.server.to(`servers:${serverId}`).emit('notification', payload)
	}

	notifyUser(userId: string, payload: NotificationPayload) {
		if (!this.server) {
			return this.logger.warn(
				'Попытка отправки сокет-уведомления до инициализации сервера'
			)
		}
		this.server.to(`users:${userId}`).emit('notification', payload)
	}

	sendToRoomClient(
		room: string,
		payload: NotificationPayload,
		client: Socket
	) {
		client.to(room).emit('notification', payload)
	}
}
