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
import { ApiOperation, ApiParam } from '@nestjs/swagger'

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'

import { ConversationsService } from './conversations.service'
import { EditGroupDto } from './dto/edit-group.dto'

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
	constructor(private readonly conversationsService: ConversationsService) {}

	@Get()
	async getConversations(@CurrentUser('id') userId: string) {
		return this.conversationsService.getUserConversations(userId)
	}

	@Post('dm/:friendId')
	async openDirectConversation(
		@CurrentUser('id') userId: string,
		@Param('friendId') friendId: string
	) {
		return this.conversationsService.getOrCreateDirectConversation(
			userId,
			friendId
		)
	}

	@Post('group')
	@ApiOperation({ summary: 'Создать групповой чат' })
	async createGroup(
		@CurrentUser('id') userId: string,
		@Body('name') name: string,
		@Body('friendIds') friendIds: string[]
	) {
		return this.conversationsService.createGroupConversation(
			userId,
			name,
			friendIds
		)
	}

	@Post(':conversationId/group/leave')
	@ApiOperation({ summary: 'Покинуть групповой чат' })
	async leaveFromGroup(
		@CurrentUser('id') userId: string,
		@Param('conversationId') conversationId: string
	) {
		return this.conversationsService.leaveFromGroupConversation(
			userId,
			conversationId
		)
	}

	@Patch(':conversationId/group')
	@ApiOperation({ summary: 'Редактировать групповой чат' })
	@ApiParam({ name: 'conversationId', description: 'ID беседы' })
	async editGroup(
		@Param('conversationId') conversationId: string,
		@Body()
		dto: { name?: string; friendIds?: string[]; participantIds?: string[] },
		@CurrentUser('id') userId: string
	) {
		return this.conversationsService.editGroupConversation(
			conversationId,
			dto,
			userId
		)
	}

	@Delete(':conversationId')
	@ApiOperation({ summary: 'Удалить групповой чат' })
	@ApiParam({ name: 'conversationId', description: 'ID беседы' })
	async deleteConversation(
		@CurrentUser('id') userId: string,
		@Param('conversationId') conversationId: string
	) {
		return this.conversationsService.deleteConversation(
			userId,
			conversationId
		)
	}
}
