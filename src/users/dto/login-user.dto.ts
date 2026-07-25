import { IsEmail, IsNotEmpty, MinLength } from 'class-validator'

export class LoginUserDto {
	@IsEmail({}, { message: 'Некорректный формат Email' })
	@IsNotEmpty({ message: 'Email не может быть пустым' })
	email: string

	@IsNotEmpty({ message: 'Пароль не может быть пустым' })
	@MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
	password: string
}
