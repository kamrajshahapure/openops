// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  EndpointScope,
  Permission,
  Principal,
  PrincipalType,
} from '@openops/shared';
import fastify from 'fastify';
// eslint-disable-next-line @typescript-eslint/no-unused-vars

declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  export interface FastifyRequest {
    principal: Principal;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  export interface FastifyInstance {
    io: Server<{ hello: string }>;
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  export interface FastifyContextConfig {
    allowedPrincipals?: PrincipalType[];
    rawBody?: boolean;
    skipAuth?: boolean;
    scope?: EndpointScope;
    permission?: Permission;
  }
}
