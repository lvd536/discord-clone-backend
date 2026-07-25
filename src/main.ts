import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'
import * as express from 'express'

import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { bodyParser: false })

	const config = app.get(ConfigService)

	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

	app.use(
		'/livekit/webhook',
		express.raw({ type: 'application/webhook+json' })
	)
	app.use('/livekit/webhook', (req: any, res, next) => {
		if (Buffer.isBuffer(req.body)) {
			req.rawBody = req.body.toString('utf-8')
		}
		next()
	})

	app.use(express.json())
	app.use(express.urlencoded({ extended: true }))
	app.use(cookieParser())
	app.enableCors({
		origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
		credentials: true,
		exposedHeaders: ['set-cookie']
	})

	const swaggerConfig = new DocumentBuilder()
		.setTitle('lvd Fullstack Discord')
		.setDescription('Интерактивная спецификация REST API для клона Discord')
		.setVersion('1.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				name: 'JWT',
				description: 'Введите ваш JWT access_token',
				in: 'header'
			},
			'JWT-auth'
		)
		.build()

	const document = SwaggerModule.createDocument(app, swaggerConfig)

	SwaggerModule.setup('docs', app, document, {
		swaggerOptions: {
			persistAuthorization: true
		}
	})

	await app.listen(config.getOrThrow<number>('APPLICATION_PORT'))
}
bootstrap()
