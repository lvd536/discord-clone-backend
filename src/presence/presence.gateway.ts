import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

import { jwtConstants } from '@/auth/constants'
import { PrismaService } from '@/prisma/prisma.service'

import { PresenceService } from './presence.service'

@WebSocketGateway({
	cors: {
		origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
		credentials: true
	},
	namespace: 'presence'
})
@Injectable()
export class PresenceGateway
	implements OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server: Server

	private readonly logger = new Logger(PresenceGateway.name)

	constructor(
		private readonly jwtService: JwtService,
		private readonly presenceService: PresenceService,
		private readonly prismaService: PrismaService
	) {}

	async handleConnection(client: Socket) {
		try {
			const token = client.handshake.auth?.token
			if (!token) return client.disconnect()

			const payload = await this.jwtService.verifyAsync(token, {
				secret: jwtConstants.secret
			})
			const userId = payload.sub || payload.id
			client.data.userId = userId

			client.join(`user:${userId}`)

			const isFirsSession = await this.presenceService.addSocket(
				userId,
				client.id
			)

			if (isFirsSession) {
				this.logger.log(
					`Пользователь ${userId} ОНЛАЙН. Рассылаем статус...`
				)
				await this.notifyMutuals(userId, true)
			}
		} catch (err: any) {
			this.logger.error(`Ошибка авторизации сокета: ${err.message}`)
			client.disconnect()
		}
	}

	async handleDisconnect(client: Socket) {
		const { userId, isNowOffline } =
			await this.presenceService.removeSocket(client.id)

		if (isNowOffline && userId) {
			await this.notifyMutuals(userId, false)
		}
	}

	@SubscribeMessage('subscribe_server')
	handleSubscribeServer(
		@ConnectedSocket() client: Socket,
		@MessageBody() serverId: string
	) {
		client.join(`server:${serverId}`)
	}

	@SubscribeMessage('unsubscribe_server')
	handleUnsubscribeServer(
		@ConnectedSocket() client: Socket,
		@MessageBody() serverId: string
	) {
		client.leave(`server:${serverId}`)
	}

	@SubscribeMessage('check_users_presence')
	async handleCheckPresence(
		@ConnectedSocket() client: Socket,
		@MessageBody() userIds: string[]
	) {
		const onlineIds =
			await this.presenceService.filteredOnlineUsers(userIds)
		client.emit('presence_checked_result', onlineIds)
	}

	@SubscribeMessage('heartbeat')
	async handleHeartbeat(@ConnectedSocket() client: Socket) {
		const userId = client.data.userId
		if (userId) {
			await this.presenceService.touchPresence(userId)
		}
	}

	private async notifyMutuals(userId: string, isOnline: boolean) {
		const userMemberships = await this.prismaService.member.findMany({
			where: { userId },
			select: { serverId: true }
		})

		userMemberships.forEach(m => {
			this.server
				.to(`server:${m.serverId}`)
				.emit('presence_change', { userId, isOnline })
		})

		const friendships = await this.prismaService.friendship.findMany({
			where: {
				OR: [
					{ userId, status: 'ACCEPTED' },
					{ friendId: userId, status: 'ACCEPTED' }
				]
			},
			select: { userId: true, friendId: true }
		})

		friendships.forEach(f => {
			const friendId = f.userId === userId ? f.friendId : f.userId
			this.server
				.to(`user:${friendId}`)
				.emit('presence_change', { userId, isOnline })
		})
	}
}
