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
import { CurrentUser } from '@/common/decorators/current-user.decorator'

import { ServerPermissions } from './decorators/server-permissions.decorator'
import { CreateServerDto } from './dto/create-server.dto'
import { GrantRolesDto } from './dto/grant-roles.dto'
import { UpdateServerDto } from './dto/update-server.dto'
import { ServerPermissionsGuard } from './guards/server-permissions.guard'
import { ServersService } from './servers.service'

@ApiTags('Серверы')
@ApiBearerAuth('JWT-auth')
@Controller('servers')
@UseGuards(JwtAuthGuard)
export class ServersController {
	constructor(private readonly serversService: ServersService) {}

	@Post()
	@ApiOperation({ summary: 'Создать новый сервер' })
	async create(
		@Body() dto: CreateServerDto,
		@CurrentUser('id') userId: string
	) {
		return this.serversService.createServer(dto, userId)
	}

	@Get()
	@ApiOperation({
		summary:
			'Получить список всех серверов, на которых состоит текущий пользователь'
	})
	async serverList(@CurrentUser('id') userId: string) {
		return this.serversService.getUserServers(userId)
	}

	@Get(':serverId')
	@UseGuards(ServerPermissionsGuard)
	@ApiOperation({
		summary:
			'Получить полную детальную информацию о сервере (включая каналы)'
	})
	@ApiParam({ name: 'serverId', description: 'ID запрашиваемого сервера' })
	async server(@Param('serverId') serverId: string) {
		return this.serversService.getServerInfo(serverId)
	}

	@Get(':serverId/members')
	@UseGuards(ServerPermissionsGuard)
	@ApiOperation({
		summary: 'Получить полный список участников сервера с их ролями'
	})
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	async serverMembers(@Param('serverId') serverId: string) {
		return this.serversService.getServerMembers(serverId)
	}

	@Post('join/:inviteCode')
	@ApiOperation({
		summary: 'Присоединиться к серверу по его коду приглашения'
	})
	@ApiParam({
		name: 'inviteCode',
		description: 'Уникальный uuid-код приглашения сервера'
	})
	async join(
		@Param('inviteCode') inviteCode: string,
		@CurrentUser('id') userId: string
	) {
		return this.serversService.joinServer(inviteCode, userId)
	}

	@Post(':serverId/leave')
	@ApiOperation({ summary: 'Покинуть сервер (Для обычных участников)' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	async leave(
		@Param('serverId') serverId: string,
		@CurrentUser('id') userId: string
	) {
		return this.serversService.leaveServer(serverId, userId)
	}

	@Patch(':serverId')
	@UseGuards(ServerPermissionsGuard)
	@ServerPermissions(RolePermissions.OWNER, RolePermissions.CAN_EDIT_SERVER)
	@ApiOperation({
		summary: 'Редактировать настройки / название сервера (Администрация)'
	})
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	async update(
		@Param('serverId') serverId: string,
		@Body() dto: UpdateServerDto
	) {
		return this.serversService.updateServer(dto, serverId)
	}

	@Delete(':serverId')
	@UseGuards(ServerPermissionsGuard)
	@ServerPermissions(RolePermissions.OWNER, RolePermissions.CAN_DELETE_SERVER)
	@ApiOperation({ summary: 'Удалить сервер (Только владелец)' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	async remove(@Param('serverId') serverId: string) {
		return this.serversService.removeServer(serverId)
	}

	@Post(':serverId/members/:memberId/roles')
	@UseGuards(ServerPermissionsGuard)
	@ServerPermissions(RolePermissions.OWNER, RolePermissions.CAN_GRANT_ROLE)
	@ApiOperation({ summary: 'Выдать роли участнику сервера (Модерация)' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	@ApiParam({ name: 'memberId', description: 'ID записи участника (Member)' })
	async grantRole(
		@Param('memberId') memberId: string,
		@Body() dto: GrantRolesDto
	) {
		return this.serversService.grantRolesToMember(memberId, dto.roleIds)
	}

	@Delete(':serverId/members/:memberId/roles/:roleId')
	@UseGuards(ServerPermissionsGuard)
	@ServerPermissions(RolePermissions.OWNER, RolePermissions.CAN_GRANT_ROLE)
	@ApiOperation({ summary: 'Забрать роль у участника сервера (Модерация)' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	@ApiParam({ name: 'memberId', description: 'ID записи участника (Member)' })
	@ApiParam({ name: 'roleId', description: 'ID забираемой роли' })
	async revokeRole(
		@Param('memberId') memberId: string,
		@Param('roleId') roleId: string
	) {
		return this.serversService.revokeRoleFromMember(memberId, roleId)
	}

	@Delete(':serverId/members/:memberId')
	@UseGuards(ServerPermissionsGuard)
	@ServerPermissions(RolePermissions.OWNER, RolePermissions.CAN_KICK)
	@ApiOperation({ summary: 'Кикнуть участника с сервера (Модерация)' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	@ApiParam({ name: 'memberId', description: 'ID записи участника (Member)' })
	async kick(@Param('memberId') memberId: string) {
		return this.serversService.kickMember(memberId)
	}
}
