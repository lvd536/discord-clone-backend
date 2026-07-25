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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { MemberRole, RolePermissions } from '@prisma/__generated__/enums'

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { ChannelsService } from '@/channels/channels.service'
import { CreateChannelDto } from '@/channels/dto/create-channel.dto'
import { UpdateChannelDto } from '@/channels/dto/update-channel.dto'
import { ServerPermissions } from '@/servers/decorators/server-permissions.decorator'
import { ServerPermissionsGuard } from '@/servers/guards/server-permissions.guard'

@ApiTags('Каналы серверов (Голосовые и Текстовые)')
@ApiBearerAuth('JWT-auth')
@Controller('servers/:serverId/channels')
@UseGuards(JwtAuthGuard, ServerPermissionsGuard)
export class ChannelsController {
	constructor(private readonly channelsService: ChannelsService) {}

	@Get(':channelId')
	@ApiOperation({
		summary: 'Получить подробную информацию о конкретном канале'
	})
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	@ApiParam({ name: 'channelId', description: 'ID канала' })
	async channel(@Param('channelId') channelId: string) {
		return this.channelsService.channel(channelId)
	}

	@Post()
	@ServerPermissions(
		RolePermissions.OWNER,
		RolePermissions.CAN_CREATE_CHANNEL
	)
	@ApiOperation({ summary: 'Создать новый канал на сервере (Администрация)' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	async create(
		@Param('serverId') serverId: string,
		@Body() dto: CreateChannelDto
	) {
		return this.channelsService.createChannel(dto, serverId)
	}

	@Patch(':channelId')
	@ServerPermissions(RolePermissions.OWNER, RolePermissions.CAN_EDIT_CHANNEL)
	@ApiOperation({
		summary: 'Редактировать название / тип канала (Администрация)'
	})
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	@ApiParam({ name: 'channelId', description: 'ID канала' })
	async update(
		@Param('channelId') channelId: string,
		@Body() dto: UpdateChannelDto
	) {
		return this.channelsService.updateChannel(dto, channelId)
	}

	@Delete(':channelId')
	@ServerPermissions(
		RolePermissions.OWNER,
		RolePermissions.CAN_DELETE_CHANNEL
	)
	@ApiOperation({ summary: 'Удалить канал с сервера (Администрация)' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	@ApiParam({ name: 'channelId', description: 'ID канала' })
	async delete(@Param('channelId') channelId: string) {
		return this.channelsService.removeChannel(channelId)
	}
}
