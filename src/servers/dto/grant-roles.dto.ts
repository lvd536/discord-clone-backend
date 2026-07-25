import { IsArray, IsOptional, IsString, MinLength } from 'class-validator'

export class GrantRolesDto {
	@IsOptional()
	@IsArray()
	roleIds: string[]
}
