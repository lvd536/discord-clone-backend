import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { jwtConstants } from '../constants'

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
	Strategy,
	'refresh-jwt'
) {
	constructor() {
		super({
			jwtFromRequest: (req: Request) => {
				if (req && req.cookies) {
					return req.cookies['refresh_token']
				}
				return null
			},
			ignoreExpiration: false,
			secretOrKey: jwtConstants.refreshSecret,
			passReqToCallback: true
		})
	}

	async validate(req: Request, payload: any) {
		const refreshToken = req.cookies['refresh_token']
		return { ...payload, refreshToken }
	}
}
