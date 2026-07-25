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

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { CurrentUser } from '@/decorators/current-user.decorator'

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
	async editGroup(
		@CurrentUser('id') userId: string,
		@Body() dto: EditGroupDto,
		@Param('conversationId') conversationId: string
	) {
		return this.conversationsService.editGroupConversation(
			userId,
			conversationId,
			dto
		)
	}

	@Delete(':conversationId')
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
