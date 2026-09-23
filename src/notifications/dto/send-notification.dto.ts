import { IsNotEmpty, IsString } from 'class-validator'

export class SendNotificationDto {
	@IsString({ message: 'Канал должен быть строкой' })
	@IsNotEmpty({ message: 'Канал не может быть пустым' })
	channelId: string

	@IsString({ message: 'Сообщение должно быть строкой' })
	@IsNotEmpty({ message: 'Сообщение не может быть пустым' })
	message: string

	@IsNotEmpty()
	type:
		'NEW_MESSAGE_NOTIFICATION' | 'FRIENDSHIP_REQUEST' | 'FRIENDSHIP_ACCEPT'
}
