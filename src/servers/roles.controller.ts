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
import { RolePermissions } from '@prisma/__generated__/enums'

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'

import { ServerPermissions } from './decorators/server-permissions.decorator'
import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto'
import { ServerPermissionsGuard } from './guards/server-permissions.guard'
import { RolesService } from './roles.service'

@ApiTags('Роли серверов (Модерация)')
@ApiBearerAuth('JWT-auth')
@Controller('servers/:serverId/roles')
@UseGuards(JwtAuthGuard, ServerPermissionsGuard)
export class RolesController {
	constructor(private readonly rolesService: RolesService) {}

	@Get()
	@ApiOperation({ summary: 'Получить полный список ролей сервера' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	async getRoles(@Param('serverId') serverId: string) {
		return this.rolesService.getServerRoles(serverId)
	}

	@Post()
	@ServerPermissions(RolePermissions.OWNER, RolePermissions.CAN_CREATE_ROLE)
	@ApiOperation({ summary: 'Создать новую роль на сервере (Администрация)' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	async create(
		@Param('serverId') serverId: string,
		@Body() dto: CreateRoleDto
	) {
		return this.rolesService.create(dto, serverId)
	}

	@Patch(':roleId')
	@ServerPermissions(RolePermissions.OWNER, RolePermissions.CAN_EDIT_ROLE)
	@ApiOperation({ summary: 'Обновить параметры роли (Администрация)' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	@ApiParam({ name: 'roleId', description: 'ID редактируемой роли' })
	async update(@Param('roleId') roleId: string, @Body() dto: UpdateRoleDto) {
		return this.rolesService.update(dto, roleId)
	}

	@Delete(':roleId')
	@ServerPermissions(RolePermissions.OWNER, RolePermissions.CAN_DELETE_ROLE)
	@ApiOperation({ summary: 'Удалить роль с сервера (Администрация)' })
	@ApiParam({ name: 'serverId', description: 'ID сервера' })
	@ApiParam({ name: 'roleId', description: 'ID удаляемой роли' })
	async remove(@Param('roleId') roleId: string) {
		return this.rolesService.remove(roleId)
	}
}
