import {
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	UseGuards
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags
} from '@nestjs/swagger'
import { FriendshipStatus } from '@prisma/__generated__/enums'

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { CurrentUser } from '@/decorators/current-user.decorator'

import { FriendshipsService } from './friendships.service'

@ApiTags('Друзья и Отношения')
@ApiBearerAuth('JWT-auth')
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
	constructor(private readonly friendshipsService: FriendshipsService) {}

	@Get()
	@ApiOperation({
		summary: 'Получить список друзей или исходящих/входящих запросов'
	})
	@ApiQuery({
		name: 'status',
		enum: FriendshipStatus,
		required: false,
		description: 'Фильтр по статусу отношений (PENDING, ACCEPTED, BLOCKED)'
	})
	async getFriends(
		@CurrentUser('id') userId: string,
		@Query('status') status?: FriendshipStatus
	) {
		return this.friendshipsService.getFriendsList(userId, status)
	}

	@Post('request/:friendId')
	@ApiOperation({ summary: 'Отправить запрос в друзья' })
	@ApiParam({
		name: 'friendId',
		description: 'ID пользователя, которому отправляется запрос'
	})
	async sendRequest(
		@CurrentUser('id') userId: string,
		@Param('friendId') friendId: string
	) {
		return this.friendshipsService.sendFriendRequest(userId, friendId)
	}

	@Post('accept/:requesterId')
	@ApiOperation({ summary: 'Принять входящий запрос в друзья' })
	@ApiParam({
		name: 'requesterId',
		description: 'ID пользователя, отправившего запрос'
	})
	async acceptRequest(
		@CurrentUser('id') userId: string,
		@Param('requesterId') requesterId: string
	) {
		return this.friendshipsService.acceptFriendRequest(userId, requesterId)
	}

	@Delete(':targetId')
	@ApiOperation({
		summary: 'Удалить пользователя из друзей / Отклонить запрос'
	})
	@ApiParam({ name: 'targetId', description: 'ID целевого пользователя' })
	async removeFriend(
		@CurrentUser('id') userId: string,
		@Param('targetId') targetId: string
	) {
		return this.friendshipsService.removeFriendship(userId, targetId)
	}
}
