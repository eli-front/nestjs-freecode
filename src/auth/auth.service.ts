import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from 'argon2'
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService
    ) { }

    async signup(dto: AuthDto) {
        // generate the password hash
        const hash = await argon.hash(dto.password)

        // save the user to the database
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    password: hash
                }
            })

            delete user.password;

            // return the token
            return this.signToken(user.id, user.email)
        }
        catch (err) {
            if (err instanceof PrismaClientKnownRequestError) {
                if (err.code === 'P2002') {
                    throw new ForbiddenException('Email already in use')
                }
            }
        }


    }

    async signin(dto: AuthDto) {
        // find user by email
        // if user not found, throw error
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        })

        if (!user) {
            throw new ForbiddenException('Invalid credentials')
        }

        // compare password with hash
        const valid = await argon.verify(user.password, dto.password)

        // if password is incorrect, throw error
        if (!valid) {
            throw new ForbiddenException('Invalid credentials')
        }

        delete user.password;

        // return token
        return this.signToken(user.id, user.email)
    }

    async signToken(userId: number, email: string) {

        const payload = {
            sub: userId,
            email
        }

        const secret = this.config.get('JWT_SECRET')

        const token = await this.jwt.signAsync(payload, {
            expiresIn: '15m',
            secret
        })

        return {
            access_token: token
        }
    }
}