import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AccessTokenClaims {
  sub: string; // userId
  tenantId: string;
  role: string;
  email: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(claims: AccessTokenClaims): string {
    return this.jwt.sign(claims);
  }

  verify(token: string): AccessTokenClaims {
    return this.jwt.verify<AccessTokenClaims>(token);
  }

  safeVerify(token: string): AccessTokenClaims | null {
    try {
      return this.verify(token);
    } catch {
      return null;
    }
  }
}
