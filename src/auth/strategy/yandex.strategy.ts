import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy } from 'passport-yandex'

import { jwtConstants } from '../constants'

@Injectable()
export class YandexStrategy extends PassportStrategy(Strategy, 'yandex') {
	constructor() {
		super({
			clientID: process.env.YANDEX_CLIENT_ID,
			clientSecret: process.env.YANDEX_CLIENT_SECRET,
			callbackURL: `${process.env.APPLICATION_URL}/auth/yandex/callback`
		})
	}

	async validate(
		accessToken: string,
		refreshToken: string,
		profile: Profile,
		done: (err: any, user: any, info?: any) => void
	) {
		const { id, displayName, emails, photos } = profile

		const user = {
			provider: 'yandex',
			providerId: id,
			email: emails?.[0]?.value,
			displayName: displayName || profile.username,
			avatarUrl: photos?.[0]?.value || null,
			accessToken,
			refreshToken
		}

		done(null, user)
	}
}
