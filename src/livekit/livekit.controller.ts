import {
	Body,
	Controller,
	Headers,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	UnauthorizedException,
	UseGuards
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiHeader,
	ApiOperation,
	ApiTags
} from '@nestjs/swagger'

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { Public } from '@/common/decorators/public.decorator'

import { JoinChannelDto } from './dto/join-channel.dto'
import { LivekitChannelGuard } from './guards/livekit-channel.guard'
import { LivekitService } from './livekit.service'

@ApiTags('Интеграция LiveKit (WebRTC голоса/видео)')
@Controller('livekit')
export class LivekitController {
	constructor(private readonly livekitService: LivekitService) {}

	@Post('join')
	@UseGuards(JwtAuthGuard, LivekitChannelGuard)
	@ApiBearerAuth('JWT-auth')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary:
			'Получить временный токен подключения к WebRTC-комнате (голосовому каналу)'
	})
	async joinChannel(
		@Body() dto: JoinChannelDto,
		@CurrentUser('id') id: string,
		@CurrentUser('displayName') displayName: string,
		@CurrentUser('email') email: string
	) {
		const name = displayName ?? email.slice(0, 5) ?? email
		return this.livekitService.generateParticipiantToken(
			dto.channelId,
			id,
			name
		)
	}

	@Public()
	@Post('webhook')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Приемник вебхуков событий от LiveKit Server SDK (Public)'
	})
	@ApiHeader({
		name: 'authorization',
		description: 'Хэш-подпись верификации события'
	})
	async handleWebhook(
		@Req() req: Request & { rawBody?: string },
		@Headers('authorization') authHeader: string
	) {
		if (!authHeader) {
			throw new UnauthorizedException('Отсутствует заголовок авторизации')
		}

		const rawBody = req.rawBody || JSON.stringify(req.body)

		const event = await this.livekitService.validateWebhookEvent(
			rawBody,
			authHeader
		)

		const channelId = event.room?.name
		const userId = event.participant?.identity

		if (!channelId || !userId) {
			return { status: 'ignored' }
		}

		switch (event.event) {
			case 'participant_joined':
				console.log(
					`Юзер ${userId} зашел в голосовой канал ${channelId}`
				)
				break

			case 'participant_left':
				console.log(
					`Юзер ${userId} вышел из голосового канала ${channelId}`
				)
				break
		}

		return { status: 'processed' }
	}
}
