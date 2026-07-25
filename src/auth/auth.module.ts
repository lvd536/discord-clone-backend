import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { MailService } from '@/mail/mail.service'
import { UsersService } from '@/users/users.service'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { DiscordStrategy } from './strategy/discord.strategy'
import { JwtStrategy } from './strategy/jwt.strategy'
import { LocalStrategy } from './strategy/local.strategy'
import { RefreshJwtStrategy } from './strategy/refresh-jwt.strategy'
import { YandexStrategy } from './strategy/yandex.strategy'

@Module({
	imports: [PassportModule, JwtModule.register({})],
	controllers: [AuthController],
	providers: [
		AuthService,
		LocalStrategy,
		JwtStrategy,
		RefreshJwtStrategy,
		YandexStrategy,
		DiscordStrategy,
		UsersService,
		MailService
	]
})
export class AuthModule {}
