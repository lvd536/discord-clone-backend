import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy } from 'passport-discord'

import { jwtConstants } from '../constants'

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
	constructor() {
		super({
			clientID: process.env.DISCORD_CLIENT_ID,
			clientSecret: process.env.DISCORD_CLIENT_SECRET,
			callbackURL: `${process.env.APPLICATION_URL}/auth/discord/callback`,
			scope: ['identify', 'email']
		})
	}

	async validate(
		accessToken: string,
		refreshToken: string,
		profile: Profile,
		done: (err: any, user: any, info?: any) => void
	) {
		const { id, username, email, avatar } = profile
		const avatarUrl = avatar
			? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`
			: null

		const user = {
			provider: 'discord',
			providerId: id,
			email: email,
			displayName: username,
			avatarUrl,
			accessToken,
			refreshToken
		}

		done(null, user)
	}
}
