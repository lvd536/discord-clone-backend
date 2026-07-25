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
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiTags
} from '@nestjs/swagger'

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { ServerPermissionsGuard } from '@/servers/guards/server-permissions.guard'

import { ChannelMessageOwnerGuard } from './guards/channel-message-owner.guard'
import { MessagesService } from './messages.service'

@ApiTags('Сообщения каналов (Серверы)')
@ApiBearerAuth('JWT-auth')
@Controller('servers/:serverId/channels/:channelId/messages')
@UseGuards(JwtAuthGuard, ServerPermissionsGuard)
export class MessagesController {
	constructor(private readonly messagesService: MessagesService) {}

	@Post()
	@ApiOperation({ summary: 'Отправить сообщение в текстовый канал сервера' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	@ApiParam({ name: 'channelId', description: 'ID канала' })
	@ApiBody({
		schema: {
			type: 'object',
			required: ['content'],
			properties: { content: { type: 'string', example: 'Привет всем!' } }
		}
	})
	async createMessage(
		@Param('channelId') channelId: string,
		@Body('content') content: string,
		@CurrentUser('id') userId: string
	) {
		return this.messagesService.create(content, channelId, userId)
	}

	@Patch(':messageId')
	@UseGuards(ChannelMessageOwnerGuard)
	@ApiOperation({ summary: 'Отредактировать свое сообщение на сервере' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	@ApiParam({ name: 'channelId', description: 'ID канала' })
	@ApiParam({ name: 'messageId', description: 'ID изменяемого сообщения' })
	@ApiBody({
		schema: {
			type: 'object',
			required: ['content'],
			properties: {
				content: {
					type: 'string',
					example: 'Измененный текст сообщения'
				}
			}
		}
	})
	async editMessage(
		@Param('messageId') messageId: string,
		@Body('content') content: string
	) {
		return this.messagesService.edit(content, messageId)
	}

	@Delete(':messageId')
	@UseGuards(ChannelMessageOwnerGuard)
	@ApiOperation({ summary: 'Удалить свое сообщение на сервере' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	@ApiParam({ name: 'channelId', description: 'ID канала' })
	@ApiParam({ name: 'messageId', description: 'ID удаляемого сообщения' })
	async deleteMessage(@Param('messageId') messageId: string) {
		return this.messagesService.delete(messageId)
	}

	@Get()
	@ApiOperation({ summary: 'Получить историю сообщений текстового канала' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	@ApiParam({ name: 'channelId', description: 'ID канала' })
	async getHistory(@Param('channelId') channelId: string) {
		return this.messagesService.getMessagesHistory(channelId)
	}
}
