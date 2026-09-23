import { Injectable, Logger, UseGuards } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

import { jwtConstants } from '@/auth/constants'
import { CurrentWsUser } from '@/common/decorators/current-ws-user.decorator'
import { WsJwtGuard } from '@/common/guards/ws-jwt.guard'

import { JoinNotificationChannelDto } from './dto/join-notification-channel.dto'
import { SendNotificationDto } from './dto/send-notification.dto'
import { NotificationsService } from './notifications.service'

@WebSocketGateway({
	cors: {
		origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
		credentials: true
	},
	namespace: 'notifications'
})
@Injectable()
export class NotificationsGateway
	implements OnGatewayInit, OnGatewayConnection
{
	@WebSocketServer()
	server: Server

	private readonly logger = new Logger(NotificationsGateway.name)

	constructor(
		private readonly jwtService: JwtService,
		private readonly notificationsService: NotificationsService
	) {}

	afterInit(server: Server) {
		this.notificationsService.setServer(server)
		this.logger.log(
			'NotificationsGateway инициализирован и привязан к NotificationsService'
		)
	}

	async handleConnection(client: Socket) {
		try {
			const token = client.handshake.auth?.token
			if (!token) return client.disconnect()

			const payload = await this.jwtService.verifyAsync(token, {
				secret: jwtConstants.secret
			})
			const userId = payload.sub || payload.id
			client.data.userId = userId
			client.data.displayName = payload.displayName || payload.email

			await client.join(`users:${userId}`)

			const serverRooms =
				await this.notificationsService.getUserServerRooms(userId)
			if (serverRooms.length > 0) {
				await client.join(serverRooms)
				this.logger.log(
					`Юзер ${userId} подключен к комнатам: ${serverRooms.length}`
				)
			}

			const convRooms =
				await this.notificationsService.getUserConversationRooms(userId)
			if (convRooms.length > 0) {
				await client.join(convRooms)
			}
		} catch (err: any) {
			this.logger.error(`Ошибка авторизации сокета: ${err.message}`)
			client.disconnect()
		}
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('send_notification')
	handleSendNotification(
		@ConnectedSocket() client: Socket,
		@MessageBody() dto: SendNotificationDto,
		@CurrentWsUser('id') senderId: string
	) {
		this.notificationsService.sendToRoomClient(
			dto.channelId,
			{
				channelId: dto.channelId,
				message: dto.message,
				type: dto.type,
				metadata: {
					senderName: client.data.displayName || senderId
				}
			},
			client
		)
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('join_channel')
	handleJoinChannel(
		@ConnectedSocket() client: Socket,
		@MessageBody() dto: JoinNotificationChannelDto
	) {
		client.join(`channel:${dto.channelId}`)
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('leave_channel')
	handleLeaveChannel(
		@ConnectedSocket() client: Socket,
		@MessageBody() dto: JoinNotificationChannelDto
	) {
		client.leave(`channel:${dto.channelId}`)
	}
}
