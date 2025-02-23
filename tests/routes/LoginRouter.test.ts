import { createBenutzer } from "../../src/services/BenutzerService";
import app from "../../src/jestApp";
import supertest from "supertest";
import { loginBenutzer } from "../../src/services/AuthenticationService";
import { Benutzer } from "../../src/models/BenutzerModel";
import { JwtPayload, sign } from "jsonwebtoken";

import dotenv from "dotenv";
dotenv.config();

test("LoginRouter POST with undefined user", async () => {
    const testee = supertest(app);
    const response = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
    expect(response.status).toBe(401);
    expect(response.body.token).toBeUndefined();
})

test("LoginRouter POST with defined user not verified", async () => {
    const testee = supertest(app);
    await createBenutzer({ email: "dima@riffel.de", password: "1234abcdABCD..;,.", name: "Dima" });
    const response = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
    expect(response.status).toBe(401);
})

test("LoginRouter POST with notStrongPassword Case 1", async () => {
    const testee = supertest(app);
    const response = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234" });
    expect(response.status).toBe(400);
    expect(response.body.token).toBeUndefined();
    expect(response.body.errors[0].msg).toBe("Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten");
})

test("LoginRouter POST with notStrongPassword Case 2", async () => {
    const testee = supertest(app);
    const response = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1Ab." });
    expect(response.status).toBe(400);
    expect(response.body.token).toBeUndefined();
    expect(response.body.errors[0].msg).toBe("Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten");
})

test("LoginRouter POST with notStrongPassword Case 3", async () => {
    const testee = supertest(app);
    const response = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1AB23456" });
    expect(response.status).toBe(400);
    expect(response.body.token).toBeUndefined();
    expect(response.body.errors[0].msg).toBe("Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten");
})

test("LoginRouter POST with notStrongPassword Case 4", async () => {
    const testee = supertest(app);
    const response = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1Ab23456" });
    expect(response.status).toBe(400);
    expect(response.body.token).toBeUndefined();
    expect(response.body.errors[0].msg).toBe("Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten");
})

test("LoginRouter POST with defined user verified", async () => {
    const testee = supertest(app);
    await createBenutzer({ email: "dima@riffel.de", password: "1234abcdABCD..;,.", name: "Dima" });
    await Benutzer.updateOne({ email: "dima@riffel.de" }, { active: true });
    const response = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();

    const cookie = response.body.token;
    expect(cookie).toContain("ey")
})

test("LoginRouter POST with defined user, wrong password", async () => {
    const testee = supertest(app);
    await createBenutzer({ email: "dima@riffel.de", password: "1234abcdABCD..;,.", name: "Dima" });
    const response = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
    expect(response.status).toBe(401);
    expect(response.body.token).toBeUndefined();
})

test("LoginRouter POST with defined user, wrong email", async () => {
    const testee = supertest(app);
    await createBenutzer({ email: "dima@riffel.de", password: "1234abcdABCD..;,.", name: "Dima" });
    const response = await testee.post("/api/login/").send({ email: "dima@riel.de", password: "1234abcdABCD..;,." });
    expect(response.status).toBe(401);
    expect(response.body.token).toBeUndefined();
})

test("LoginRouter logout DELETE", async () => {
    const testee = supertest(app);
    await createBenutzer({ email: "dima@riffel.de", password: "1234abcdABCD..;,.", name: "Dima" });
    await Benutzer.updateOne({ email: "dima@riffel.de" }, { active: true });
    const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
    expect(loginResponse.status).toBe(200);

    const cookie = loginResponse.body.token;
    expect(cookie).toContain("ey");

    const logoutResponse = await testee.delete("/api/login/").set("Cookie", cookie);
    expect(logoutResponse.status).toBe(204);
})

test("LoginRouter logout DELETE not verified", async () => {
    const testee = supertest(app);
    await createBenutzer({ email: "dima@riffel.de", password: "1234abcdABCD..;,.", name: "Dima" });
    const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
    expect(loginResponse.status).toBe(401);
})

test("LoginRouter GET with valid token", async () => {
    const b = await createBenutzer({ email: "dima@riffel.de", password: "1234abcdABCD..;,.", name: "Dima" });
    await Benutzer.updateOne({ email: "dima@riffel.de" }, { active: true });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
    expect(loginResponse.status).toBe(200);

    const cookie = loginResponse.body.token;

    const getResponse = await testee.get("/api/login/").set("token", cookie);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(b.id);
})

test("LoginRouter GET with invalid token", async () => {
    const testee = supertest(app);

    const getResponse = await testee.get("/api/login/").set("token", "ey");
    expect(getResponse.status).toBe(401);
})

test("LoginRouter GET with no token", async () => {
    const testee = supertest(app);

    const getResponse = await testee.get("/api/login/")
    expect(getResponse.status).toBe(401);
})

test(`/api/login GET, expired cookie`, async () => {
    await createBenutzer({ name: "Dima", password: "1234abcdABCD..;,.", email: "dima@riffel.de" })

    const expiredJWT = await generateExpiredJWT("dima@riffel.de", "1234abcdABCD..;,.");

    const testee = supertest(app);

    const response = await testee.get("/api/login/").set("token", `${expiredJWT}`);
    expect(response.status).toBe(401);
})

test("loginrouter not cookie but body", async () => {
    await Benutzer.create({ email: "dima@riffel.de", password: "1234abcdABCD..;,.", name: "Dima", active: true });
    const testee = supertest(app);
    const response = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    let token = response.body.token;
    const response2 = (await testee.get("/api/login/").set("token", token));
    expect(response2.status).toBe(200);
})


export async function generateExpiredJWT(name: string, password: string) {
    const SECRET = process.env.JWT_SECRET;
    const TTL = 1;
    const loginResult = await loginBenutzer(name, password);
    if (loginResult) {
        const payload: JwtPayload = {
            sub: loginResult,
        }
        const jwtString = sign(
            payload,
            SECRET!,
            { // SigningOptions
                expiresIn: TTL - 6000,
                algorithm: "HS256"
            });
        return jwtString;
    }
}

