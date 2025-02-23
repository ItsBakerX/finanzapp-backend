import jsonwebtoken from "jsonwebtoken";
import { verifyPasswordAndCreateJWT, verifyJWT } from "../../src/services/JWTService";
import { BenutzerResource } from "../../src/Resources";
import { createBenutzer } from "../../src/services/BenutzerService";
import dotenv from 'dotenv';
dotenv.config();

afterEach(() => {
    process.env.JWT_SECRET = "Exploring-Music-Disprove-Coral";
    process.env.JWT_TTL = "3600"
})

test("verifyPasswordAndCreateJWT .env Secret not declared", async () => {
    process.env.JWT_SECRET = "";
    await expect(verifyPasswordAndCreateJWT("Anna", "Password")).rejects.toThrow("Missing environment variables");
})

test("verifyPasswordAndCreateJWT .env TTL not declared", async () => {
    process.env.JWT_TTL = "";
    await expect(verifyPasswordAndCreateJWT("Anna", "Password")).rejects.toThrow("Missing environment variables");
})

test("verifyPasswordAndCreateJWT, login for nonexisting user", async () => {
    await expect(verifyPasswordAndCreateJWT("Anna", "Password")).resolves.toBe(undefined);
})

test("verifyPasswordAndCreateJWT, JWT create", async () => {
    const resource: BenutzerResource = { name: "Anna Maslennikova", password: "NE2%E3oEMqFc#ipE", email: "email@example.de" };
    const p = await createBenutzer(resource);
    const token = await verifyPasswordAndCreateJWT("email@example.de", "NE2%E3oEMqFc#ipE") as string;

    const secret = process.env.JWT_SECRET as string;

    const decoded = jsonwebtoken.verify(token, secret);

    expect(decoded.sub).toBe(p.id);
})

test("verifyJWT, string undefined", () => {
    expect(() => { verifyJWT(undefined) }).toThrow("Missing JWT");
})

test("verifyJWT, string not correct format", () => {
    expect(() => { verifyJWT("adawdafawfafaw") }).toThrow("Invalid JWT");
})

test("verifyJWT, empty string", () => {
    expect(() => { verifyJWT("") }).toThrow("Invalid JWT");
})

test("verifyJWT, testing user role", async () => {
    const resource: BenutzerResource = { name: "Anna Maslennikova", password: "NE2%E3oEMqFc#ipE", email: "email@example.de" };
    const p = await createBenutzer(resource);
    const token = await verifyPasswordAndCreateJWT("email@example.de", "NE2%E3oEMqFc#ipE") as string;
    const login = verifyJWT(token);
    expect(login).toMatchObject({
        id: p.id,
    })
})

test("verifyJWT, secret mismatch", async () => {
    const resource: BenutzerResource = { name: "Anna Maslennikova", password: "NE2%E3oEMqFc#ipE", email: "email@example.de" };
    const p = await createBenutzer(resource);
    const token = await verifyPasswordAndCreateJWT("email@example.de", "NE2%E3oEMqFc#ipE") as string;
    process.env.JWT_SECRET = "awfaw";
    expect(() => verifyJWT(token)).toThrow("Invalid JWT");
    expect(() => verifyJWT(token)).toThrow(jsonwebtoken.JsonWebTokenError);
})

test("verifyJWT .env Secret not declared", async () => {
    const resource: BenutzerResource = { name: "Anna Maslennikova", password: "NE2%E3oEMqFc#ipE", email: "email@example.de" };
    const p = await createBenutzer(resource);
    const token = await verifyPasswordAndCreateJWT("email@example.de", "NE2%E3oEMqFc#ipE") as string;
    process.env.JWT_SECRET = "";
    expect(() => verifyJWT(token)).toThrow("Missing environment variables");
})

test("verifyJWT, JWT expired", async () => {
    process.env.JWT_TTL = "0.0001";

    const resource: BenutzerResource = { name: "Anna Maslennikova", password: "NE2%E3oEMqFc#ipE", email: "email@example.de" };
    const p = await createBenutzer(resource);
    const token = await verifyPasswordAndCreateJWT("email@example.de", "NE2%E3oEMqFc#ipE") as string;
    expect(() => verifyJWT(token)).toThrow("Invalid JWT");
})
