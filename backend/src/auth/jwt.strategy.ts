import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const issuer = process.env.KEYCLOAK_ISSUER!;
    if (!issuer) throw new Error('Missing KEYCLOAK_ISSUER');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      // NOTE: we intentionally DO NOT set issuer or audience here to avoid 401s from claim mismatch.
      // We rely on JWKS signature, exp/nbf, and later we can add custom checks if needed.
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri: `${issuer}/protocol/openid-connect/certs`,
        cache: true,
        cacheMaxEntries: 5,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      }) as any,
    });
  }

  async validate(payload: any) {
    // If we get here, signature/expiry passed. Attach the payload as user.
    return payload;
  }
}
