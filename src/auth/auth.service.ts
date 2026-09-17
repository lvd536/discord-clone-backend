import {
	ForbiddenException,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthMethod } from '@prisma/__generated__/enums'
import * as bcrypt from 'bcrypt'
import { Response } from 'express'

import { MailService } from '@/mail/mail.service'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateUserDto } from '@/users/dto/create-user.dto'
import { LoginUserDto } from '@/users/dto/login-user.dto'
import { UsersService } from '@/users/users.service'

import { jwtConstants } from './constants'

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly mailService: MailService,
		private readonly prismaService: PrismaService
	) {}

	async validateUser(email: string, pass: string): Promise<any> {
		const user = await this.usersService.findByEmail(email)

		if (!user) throw new UnauthorizedException()

		if (!user.password) {
			throw new UnauthorizedException(
				'Этот аккаунт зарегистрирован через социальные сети. Пожалуйста, войдите с помощью OAuth.'
			)
		}

		const isMatchingPassword = await bcrypt.compare(pass, user.password)

		if (user && isMatchingPassword) {
			const { password, ...result } = user
			return result
		}
		return null
	}

	async validateOAuthUser(profile: {
		email: string
		displayName: string
		avatarUrl?: string
		provider: string
		providerAccountId: string
		accessToken?: string
		refreshToken?: string
	}) {
		const account = await this.prismaService.account.findUnique({
			where: {
				provider_providerAccountId: {
					provider: profile.provider,
					providerAccountId: profile.providerAccountId
				}
			},
			include: { user: true }
		})

		if (account && account.user) {
			await this.prismaService.account.update({
				where: { id: account.id },
				data: {
					accessToken: profile.accessToken,
					refreshToken: profile.refreshToken
				}
			})
			return account.user
		}

		let user: any
		try {
			user = await this.usersService.findByEmail(profile.email)
		} catch (e) {
			user = null
		}

		if (!user) {
			user = await this.prismaService.user.create({
				data: {
					email: profile.email,
					displayName: profile.displayName,
					avatarUrl: profile.avatarUrl,
					isVerified: true,
					password: null
				}
			})
		}

		await this.prismaService.account.create({
			data: {
				userId: user.id,
				type: AuthMethod.OAUTH,
				provider: profile.provider,
				providerAccountId: profile.providerAccountId,
				accessToken: profile.accessToken,
				refreshToken: profile.refreshToken
			}
		})

		return user
	}

	async loginOAuthUser(user: any, res: Response) {
		const tokens = await this.getTokens(
			user.id,
			user.displayName,
			user.email,
			user.role,
			user.isVerified
		)

		await this.updateRefreshToken(user.id, tokens.refresh_token)
		this.sendRefreshTokenCookie(res, tokens.refresh_token)

		return tokens.access_token
	}

	async getTokens(
		userId: string,
		displayName: string,
		email: string,
		role: string,
		isVerified: boolean
	) {
		const payload = { sub: userId, displayName, email, role, isVerified }

		const [access_token, refresh_token] = await Promise.all([
			this.jwtService.signAsync(payload, {
				secret: jwtConstants.secret,
				expiresIn: '15m'
			}),
			this.jwtService.signAsync(payload, {
				secret: jwtConstants.refreshSecret,
				expiresIn: '14d'
			})
		])

		return { access_token, refresh_token }
	}

	async updateRefreshToken(userId: string, refreshToken: string) {
		if (!refreshToken) {
			await this.usersService.update(userId, { hashedRefreshToken: null })
			return
		}

		const salt = await bcrypt.genSalt(10)
		const hash = await bcrypt.hash(refreshToken, salt)
		await this.usersService.update(userId, { hashedRefreshToken: hash })
	}

	private sendRefreshTokenCookie(res: Response, refreshToken: string) {
		res.cookie('refresh_token', refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 14 * 24 * 60 * 60 * 1000
		})
	}

	async refreshTokens(userId: string, refreshToken: string, res: Response) {
		const user = await this.usersService.findById(userId)
		if (!user || !user.hashedRefreshToken)
			throw new ForbiddenException('Access Denied')

		const { id, displayName, email, role, isVerified, hashedRefreshToken } =
			user

		const refreshTokenMatches = await bcrypt.compare(
			refreshToken,
			hashedRefreshToken
		)
		if (!refreshTokenMatches) throw new ForbiddenException('Access Denied')

		const { access_token, refresh_token } = await this.getTokens(
			id,
			displayName,
			email,
			role,
			isVerified
		)
		await this.updateRefreshToken(id, refresh_token)
		this.sendRefreshTokenCookie(res, refresh_token)

		return { access_token: access_token }
	}

	async signIn(createUserDto: CreateUserDto, res: Response) {
		const { password, ...user } =
			await this.usersService.create(createUserDto)

		const { id, displayName, email, role, isVerified, hashedRefreshToken } =
			user

		const tokens = await this.getTokens(
			id,
			displayName,
			email,
			role,
			isVerified
		)

		await this.updateRefreshToken(user.id, tokens.refresh_token)
		this.sendRefreshTokenCookie(res, tokens.refresh_token)
		await this.mailService.sendVerificationEmail(id, email, displayName)

		return { user, access_token: tokens.access_token }
	}

	async login(userLoginDto: LoginUserDto, res: Response) {
		const user = await this.usersService.findByEmail(userLoginDto.email)

		if (!user) throw new UnauthorizedException()

		const isMatchingPassword = await bcrypt.compare(
			userLoginDto.password,
			user.password
		)

		if (isMatchingPassword) {
			const { password, ...result } = user

			const { id, displayName, email, role, isVerified } = result

			const { access_token, refresh_token } = await this.getTokens(
				id,
				displayName,
				email,
				role,
				isVerified
			)
			await this.updateRefreshToken(id, refresh_token)
			this.sendRefreshTokenCookie(res, refresh_token)
			return { user: result, access_token: access_token }
		}

		throw new UnauthorizedException('Неверная почта или пароль.')
	}

	async logout(userId: string, res: Response) {
		await this.usersService.update(userId, { hashedRefreshToken: null })
		res.clearCookie('refresh_token')
		return { message: 'Success' }
	}
}
