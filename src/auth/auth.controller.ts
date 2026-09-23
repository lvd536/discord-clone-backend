import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Query,
	Req,
	Res,
	UseGuards
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Request, Response } from 'express'

import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { Public } from '@/common/decorators/public.decorator'
import { MailService } from '@/mail/mail.service'
import { CreateUserDto } from '@/users/dto/create-user.dto'
import { LoginUserDto } from '@/users/dto/login-user.dto'

import { AuthService } from './auth.service'
import { DiscordAuthGuard } from './guards/discord-auth.guard'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { RefreshJwtAuthGuard } from './guards/refresh-jwt.guard'
import { YandexAuthGuard } from './guards/yandex-auth.guard'

@ApiTags('Регистрация и Авторизация')
@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly mailService: MailService
	) {}

	@Public()
	@Post('register')
	@ApiOperation({
		summary: 'Зарегистрировать новую учетную запись пользователя'
	})
	async register(
		@Body() createUserDto: CreateUserDto,
		@Res({ passthrough: true }) res: Response
	) {
		return this.authService.signIn(createUserDto, res)
	}

	@Public()
	@UseGuards(LocalAuthGuard)
	@Post('login')
	@ApiOperation({ summary: 'Авторизоваться по почте и паролю (Credentials)' })
	async login(
		@Body() loginUserDto: LoginUserDto,
		@Res({ passthrough: true }) res: Response
	) {
		return this.authService.login(loginUserDto, res)
	}

	@Public()
	@UseGuards(RefreshJwtAuthGuard)
	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Обновить сессию (выпустить новые access/refresh токены)'
	})
	async refreshTokens(@Req() req: Request, @Res() res: Response) {
		const userId = req.user['id'] || req.user['sub']
		const refreshToken = req.user['refreshToken']

		const result = await this.authService.refreshTokens(
			userId,
			refreshToken,
			res
		)

		return res.send(result)
	}

	@Post('logout')
	@ApiBearerAuth('JWT-auth')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Выйти из системы (очистить сессию и куки)' })
	logout(@Req() req: Request, @Res() res: Response) {
		const userId = req.user['userId'] || req.user['sub']
		return this.authService.logout(userId, res)
	}

	@Post('send-code')
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Повторно отправить письмо верификации на email' })
	async triggerEmail(
		@CurrentUser('id') userId: string,
		@CurrentUser('email') email: string,
		@CurrentUser('displayName') displayName: string
	) {
		return this.mailService.sendVerificationEmail(
			userId,
			email,
			displayName
		)
	}

	@Public()
	@Post('verify')
	@ApiOperation({ summary: 'Подтвердить аккаунт по ссылке-токену из письма' })
	@ApiQuery({
		name: 'token',
		description: 'Уникальный uuid-токен верификации'
	})
	async verifyEmail(@Query('token') token: string) {
		return this.mailService.verifyUser(token)
	}

	@Public()
	@UseGuards(YandexAuthGuard)
	@Get('yandex')
	@ApiOperation({
		summary: 'Инициализировать авторизацию через Yandex OAuth'
	})
	async yandexAuth() {}

	@Public()
	@UseGuards(YandexAuthGuard)
	@Get('yandex/callback')
	@ApiOperation({
		summary: 'Callback Яндекс авторизации (Вызывается провайдером)'
	})
	async yandexAuthCallback(@Req() req: any, @Res() res: Response) {
		const oauthUser = await this.authService.validateOAuthUser({
			email: req.user.email,
			displayName: req.user.displayName,
			avatarUrl: req.user.avatarUrl,
			provider: 'yandex',
			providerAccountId: req.user.providerId,
			accessToken: req.user.accessToken,
			refreshToken: req.user.refreshToken
		})

		const accessToken = await this.authService.loginOAuthUser(
			oauthUser,
			res
		)

		const frontendUrl =
			process.env.ALLOWED_ORIGIN || 'http://localhost:3000'
		return res.redirect(`${frontendUrl}/oauth-success?token=${accessToken}`)
	}

	@Public()
	@UseGuards(DiscordAuthGuard)
	@Get('discord')
	@ApiOperation({
		summary: 'Инициализировать авторизацию через Discord OAuth'
	})
	async discordAuth() {}

	@Public()
	@UseGuards(DiscordAuthGuard)
	@Get('discord/callback')
	@ApiOperation({
		summary: 'Callback Discord авторизации (Вызывается провайдером)'
	})
	async discordAuthCallback(@Req() req: any, @Res() res: Response) {
		const oauthUser = await this.authService.validateOAuthUser({
			email: req.user.email,
			displayName: req.user.displayName,
			avatarUrl: req.user.avatarUrl,
			provider: 'discord',
			providerAccountId: req.user.providerId,
			accessToken: req.user.accessToken,
			refreshToken: req.user.refreshToken
		})

		const accessToken = await this.authService.loginOAuthUser(
			oauthUser,
			res
		)

		const frontendUrl =
			process.env.ALLOWED_ORIGIN || 'http://localhost:3000'
		return res.redirect(`${frontendUrl}/oauth-success?token=${accessToken}`)
	}
}
