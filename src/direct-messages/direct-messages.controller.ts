import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseGuards
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags
} from '@nestjs/swagger'

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'

import { DirectMessagesService } from './direct-messages.service'
import { ConversationAccessGuard } from './guards/conversation-access.guard'
import { DirectMessageOwnerGuard } from './guards/direct-message-owner.guard'

@ApiTags('Приватные сообщения (DMs)')
@ApiBearerAuth('JWT-auth')
@Controller('conversations/:conversationId/direct-messages')
@UseGuards(JwtAuthGuard, ConversationAccessGuard)
export class DirectMessagesController {
	constructor(
		private readonly directMessagesService: DirectMessagesService
	) {}

	@Get()
	@ApiOperation({ summary: 'Получить историю личных сообщений беседы' })
	@ApiResponse({
		status: 200,
		description: 'Список сообщений успешно получен.'
	})
	async getHistory(@Param('conversationId') conversationId: string) {
		return this.directMessagesService.getDirectMessagesHistory(
			conversationId
		)
	}

	@Post()
	@ApiOperation({ summary: 'Отправить новое личное сообщение в беседу' })
	async createDirectMessage(
		@Param('conversationId') conversationId: string,
		@Body('content') content: string,
		@CurrentUser('id') userId: string
	) {
		return this.directMessagesService.create(
			content,
			conversationId,
			userId
		)
	}

	@Patch(':messageId')
	@UseGuards(DirectMessageOwnerGuard)
	@ApiOperation({ summary: 'Отредактировать свое личное сообщение' })
	async editDirectMessage(
		@Param('messageId') messageId: string,
		@Body('content') content: string
	) {
		return this.directMessagesService.edit(content, messageId)
	}

	@Delete(':messageId')
	@UseGuards(DirectMessageOwnerGuard)
	@ApiOperation({ summary: 'Удалить свое личное сообщение' })
	async deleteDirectMessage(@Param('messageId') messageId: string) {
		return this.directMessagesService.delete(messageId)
	}
}
