import { createRemoteJWKSet, jwtVerify } from "jose";

const domain = process.env.AUTH0_DOMAIN!;
const audience = process.env.AUTH0_API_AUDIENCE!;
const issuer = process.env.AUTH0_ISSUER!;

const jwks = createRemoteJWKSet(
  new URL(`https://${domain}/.well-known/jwks.json`)
);

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience,
    algorithms: ["RS256"],
  });

  if (!payload.sub) {
    throw new Error("Token does not contain a user identity");
  }

  return {
    userId: payload.sub,
    claims: payload,
  };
}
