import { MailerService } from '@nestjs-modules/mailer'
import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { TokenType } from '@prisma/__generated__/enums'
import { v4 as uuidv4 } from 'uuid'

import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class MailService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly mailerService: MailerService
	) {}

	private async generateWelcomeMessage(email: string, displayName: string) {
		await this.mailerService.sendMail({
			to: email,
			subject: 'Успешная регистрация',
			template: './welcome',
			context: { email, displayName }
		})

		return { success: true }
	}

	async sendVerificationEmail(
		userId: string,
		email: string,
		displayName: string
	) {
		const token = uuidv4()

		await this.prismaService.token.create({
			data: {
				token,
				userId,
				type: TokenType.VERIFICATION,
				expiresIn: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
			}
		})

		await this.mailerService.sendMail({
			to: email,
			subject: 'Подтверждение аккаунта',
			template: './confirmation',
			context: { token, displayName }
		})

		return { success: true }
	}

	async verifyUser(token: string) {
		const { user, ...existingToken } =
			await this.prismaService.token.findUnique({
				where: {
					token_type: {
						token,
						type: TokenType.VERIFICATION
					}
				},
				include: { user: true }
			})

		if (!existingToken || existingToken.type !== TokenType.VERIFICATION) {
			throw new NotFoundException(
				'Токен верификации не найден или недействителен.'
			)
		}

		const hasExpired = new Date() > new Date(existingToken.expiresIn)
		if (hasExpired) {
			await this.prismaService.token.delete({
				where: { id: existingToken.id }
			})
			throw new BadRequestException(
				'Срок действия ссылки подтверждения истек.'
			)
		}

		await this.prismaService.$transaction([
			this.prismaService.user.update({
				where: { id: existingToken.userId },
				data: { isVerified: true }
			}),
			this.prismaService.token.delete({
				where: { id: existingToken.id }
			})
		])

		await this.generateWelcomeMessage(user.email, user.displayName)

		return { success: true, message: 'Аккаунт успешно подтвержден.' }
	}
}
