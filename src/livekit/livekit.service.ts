import {
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
	AccessToken,
	RoomServiceClient,
	WebhookReceiver
} from 'livekit-server-sdk'

import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class LivekitService {
	private readonly logger = new Logger(LivekitService.name)
	private roomClient: RoomServiceClient
	private webhookReceiver: WebhookReceiver

	constructor(
		private configService: ConfigService,
		private readonly prismaService: PrismaService
	) {
		const url = this.configService.getOrThrow<string>('LIVEKIT_API_URL')
		const key = this.configService.getOrThrow<string>('LIVEKIT_API_KEY')
		const secret =
			this.configService.getOrThrow<string>('LIVEKIT_API_SECRET')

		this.roomClient = new RoomServiceClient(url, key, secret)
		this.webhookReceiver = new WebhookReceiver(key, secret)
	}

	async generateParticipiantToken(
		channelId: string,
		userId: string,
		name: string
	) {
		try {
			const user = await this.prismaService.user.findUnique({
				where: { id: userId },
				select: { avatarUrl: true }
			})

			if (!user) {
				throw new NotFoundException('Не удалось найти пользователя')
			}

			const metadata = JSON.stringify({ avatar: user.avatarUrl })

			const token = new AccessToken(
				this.configService.getOrThrow<string>('LIVEKIT_API_KEY'),
				this.configService.getOrThrow<string>('LIVEKIT_API_SECRET'),
				{
					identity: userId,
					name,
					metadata,
					ttl: '4h'
				}
			)

			token.addGrant({
				roomJoin: true,
				room: channelId,
				canPublish: true,
				canSubscribe: true,
				canPublishData: true
			})

			return {
				token: await token.toJwt(),
				serverUrl:
					this.configService.getOrThrow<string>('LIVEKIT_API_URL')
			}
		} catch (err: any) {
			this.logger.error(`Ошибка генерации токена LiveKit: ${err.message}`)
			throw new InternalServerErrorException(
				'Не удалось создать токен подключения к каналу'
			)
		}
	}

	async validateWebhookEvent(rawBody: string, authHeader: string) {
		try {
			return this.webhookReceiver.receive(rawBody, authHeader)
		} catch (error: any) {
			this.logger.warn(
				`Попытка несанкционированного вызова вебхука: ${error.message}`
			)
			throw new UnauthorizedException(
				'Невалидная подпись вебхука LiveKit'
			)
		}
	}
}
