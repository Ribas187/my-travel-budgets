import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const CurrentTravelMember = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().travelMember;
});
