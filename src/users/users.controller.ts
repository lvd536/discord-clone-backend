import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'

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
