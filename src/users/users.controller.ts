import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'

import { UsersService } from './users.service'

@ApiTags('Пользователи')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('profile')
	@ApiOperation({
		summary: 'Получить актуальные данные профиля текущего пользователя'
	})
	async getProfile(@Req() req: any) {
		const userId = req.user.id
		return this.usersService.findById(userId)
	}

	@Patch('profile')
	@ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
	async updateProfile(
		@CurrentUser('id') userId: string,
		@Body() dto: { displayName?: string; email?: string }
	) {
		return this.usersService.update(userId, dto)
	}

	@Get('accounts')
	@ApiOperation({
		summary:
			'Получить список подключенных соцсетей (Yandex, Discord) пользователя'
	})
	async getAccounts(@Req() req: any) {
		const userId = req.user.id
		return this.usersService.findAccountsByUserId(userId)
	}
}
