import { IsString, IsNotEmpty, IsOptional, IsEmail } from "class-validator";

export class EditUserDto {
    @IsEmail()
    @IsNotEmpty()
    @IsOptional()
    email: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name: string;
}