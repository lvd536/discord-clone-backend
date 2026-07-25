import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { join } from 'path'
import { Resend } from 'resend'

import { AuthModule } from './auth/auth.module'
import { IsVerifiedGuard } from './auth/guards/is-verified.guard'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { MailModule } from './mail/mail.module'
import { PrismaModule } from './prisma/prisma.module'
import { UsersModule } from './users/users.module'
import { LivekitModule } from './livekit/livekit.module';
import { ServersModule } from './servers/servers.module';
import { ChannelsModule } from './channels/channels.module';
import { MessagesModule } from './messages/messages.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DirectMessagesModule } from './direct-messages/direct-messages.module';
import { FriendshipsModule } from './friendships/friendships.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env'
		}),
		PrismaModule,
		AuthModule,
		UsersModule,
		MailerModule.forRoot({
			transport: {
				name: 'resend',
				version: '1.0.0',
				send: async (mail, callback) => {
					const resend = new Resend(
						're_iSBRQrSA_HHjJXumMmokc8nL6PBCajyUR'
					)

					try {
						const { data, error } = await resend.emails.send({
							from: mail.data.from as string,
							to: mail.data.to as string,
							subject: mail.data.subject,
							html: mail.data.html
						})

						if (error) {
							return callback(new Error(error.message), null)
						}
						callback(null, data)
					} catch (err) {
						callback(err, null)
					}
				}
			},
			defaults: {
				from: '"No Reply" <noreply@lvdcode.online>'
			},
			template: {
				dir: join(__dirname, 'mail', 'templates'),
				adapter: new HandlebarsAdapter(),
				options: {
					strict: true
				}
			}
		}),
		MailModule,
		LivekitModule,
		ServersModule,
		ChannelsModule,
		MessagesModule,
		ConversationsModule,
		DirectMessagesModule,
		FriendshipsModule
	],
	controllers: [],
	providers: [
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard
		},
		{
			provide: APP_GUARD,
			useClass: IsVerifiedGuard
		}
	]
})
export class AppModule {}
