import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return false;

    const realmRoles: string[] = user?.realm_access?.roles || [];
    const clientId = process.env.KEYCLOAK_AUDIENCE || '';
    const clientRoles: string[] = user?.resource_access?.[clientId]?.roles || [];

    return required.some(r => realmRoles.includes(r) || clientRoles.includes(r));
  }
}
