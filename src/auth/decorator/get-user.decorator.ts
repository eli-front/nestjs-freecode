import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
    const reqestion = ctx.switchToHttp().getRequest()

    if (data) {
        return reqestion.user[data]
    }

    return reqestion.user
})