import dotenv from 'dotenv';
dotenv.config()

import { sign, verify, JwtPayload, JsonWebTokenError } from 'jsonwebtoken';
import { loginBenutzer, registerBenutzer } from '../../src/services/AuthenticationService';
import { LoginResource } from '../../src/Resources';

export async function verifyPasswordAndCreateJWT(email: string, password: string): Promise<string | undefined> {
    const SECRET = process.env.JWT_SECRET;
    let TTL: string | number = (process.env.JWT_TTL!);
    if (!SECRET || !TTL) {
        throw new Error('Missing environment variables');
    }
    TTL = parseInt(TTL);
    const loginResult: string | false = await loginBenutzer(email, password);
    if (loginResult) {
        const payload: JwtPayload = {
            sub: loginResult,
        }
        const jwtstring = sign(payload, SECRET, { expiresIn: TTL, algorithm: 'HS256' });
        return jwtstring;
    }
    return undefined;
}

export function verifyJWT(jwtString: string | undefined): LoginResource {
    const SECRET = process.env.JWT_SECRET;
    const TTL = process.env.JWT_TTL;
    if (jwtString === undefined) {
        throw new Error("Missing JWT");
    }
    if (!SECRET || !TTL) {
        throw new Error('Missing environment variables');
    }
    let payload: JwtPayload
    try {
        payload = verify(jwtString, SECRET) as JwtPayload;;
    } catch (e) {
        throw new JsonWebTokenError("Invalid JWT");
    }
    const loginResource: LoginResource = {
        id: payload.sub!,
        expiresIn: payload.exp!
    }
    return loginResource;
}