import { IsOptional, IsString, MinLength } from 'class-validator'

export class CreateServerDto {
	@IsString({ message: 'Название сервера должно быть строкой' })
	@MinLength(4, { message: 'Минимальная длина названия сервера 4 символа' })
	name: string

	@IsOptional()
	@IsString()
	imageUrl?: string
}
