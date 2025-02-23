import { sendConfirmationEmail } from "../../src/services/EmailService";
import app from "../../src/jestApp";
import supertest from "supertest";
import { Verification } from "../../src/models/VerificationModel";
import { Benutzer } from "../../src/models/BenutzerModel";


jest.mock('../../src/services/EmailService', () => ({
    sendConfirmationEmail: jest.fn().mockResolvedValue(true),
}));

test("BenutzerRouter successful GET", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login/").send({ email: b.email, password: "passWORT_123" });
    const cookie = loginResponse.body.token;
    const response = await testee.get(`/api/benutzer/${b.id}`).set("token", cookie);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
        name: "Dima",
        email: "dima@riffel.de"
    });
})
test("BenutzerRouter GET after deleted from DB", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login/").send({ email: b.email, password: "passWORT_123" });
    const cookie = loginResponse.body.token;
    await Benutzer.deleteOne({ _id: b.id });
    const response = await testee.get(`/api/benutzer/${b.id}`).set("token", cookie);
    expect(response.status).toBe(404);
})
test("BenutzerRouter GET not authenticated", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
    const testee = supertest(app);
    const response = await testee.get(`/api/benutzer/${b.id}`);
    expect(response.status).toBe(401);
})
test("BenutzerRouter GET different ID in params", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
    const c = await Benutzer.create({ email: "dima@rif.de", name: "Dima", password: "passWORT_123", active: true });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login/").send({ email: b.email, password: "passWORT_123" });
    const cookie = loginResponse.body.token;
    const response = await testee.get(`/api/benutzer/${c.id}`).set("token", cookie);
    expect(response.status).toBe(401);
})
test("BenutzerRouter successful POST", async () => {
    const testee = supertest(app);
    const response = await testee.post("/api/benutzer/register").send({
        name: "Dima",
        email: "dima@riffel.de",
        password: "passWORT_123"
    })
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
        id: expect.any(String),
        name: "Dima",
        email: "dima@riffel.de",
        active: false
    });

    expect(sendConfirmationEmail).toHaveBeenCalled();
    expect(sendConfirmationEmail).toHaveBeenCalledWith(
        "dima@riffel.de",
        expect.any(String)
    );
})
test("BenutzerRouter unsuccesful POST, password < 8", async () => {
    const testee = supertest(app);
    const response = await testee.post("/api/benutzer/register").send({
        name: "Dima",
        email: "dima@riffel.de",
        password: "1235"
    })
    expect(response.body.errors[0].path).toBe("password");
})
test("BenutzerRouter unsuccesful POST, no email", async () => {
    const testee = supertest(app);
    const response = await testee.post("/api/benutzer/register").send({
        name: "Dima",
        email: "dimariffel.de",
        password: "passWORT_123"
    })
    expect(response.body.errors[0].path).toBe("email");
})
test("BenutzerRouter unsuccesful POST, user exists already", async () => {
    const testee = supertest(app);
    const post = {
        name: "Dima",
        email: "dima@riffel.com",
        password: "passWORT_123"
    }
    const response = await testee.post("/api/benutzer/register").send(post)
    expect(response.status).toBe(201);

    const response2 = await testee.post("/api/benutzer/register").send(post)
    expect(response2.status).toBe(400);
    expect(response2.text).toBe("Benutzer existiert bereits");
})
test("BenutzerRouter POST verify Mitschnitt", async () => {
    const testee = supertest(app);
    const response = await testee.post("/api/benutzer/register").send({
        name: "Dima",
        email: "dima@riffel.de",
        password: "passWORT_123"
    })
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
        name: "Dima",
        email: "dima@riffel.de",
        active: false,
        id: expect.any(String)
    })
    const v = await Verification.findOne({ email: "dima@riffel.de" });
    expect(v).toBeDefined();
    expect(v?.verificationCode).toHaveLength(6);

    const response2 = await testee.post("/api/benutzer/verify").send({
        email: "dima@riffel.de",
        code: v?.verificationCode
    });
    expect(response2.status).toBe(204);
})
test("BenutzerRouter POST verify invalid email", async () => {
    const testee = supertest(app);
    const response = await testee.post("/api/benutzer/register").send({
        name: "Dima",
        email: "dima@riffel.de",
        password: "passWORT_123"
    })
    expect(response.status).toBe(201);
    const v = await Verification.findOne({ email: "dima@riffel.de" });
    expect(v).toBeDefined();
    expect(v?.verificationCode).toHaveLength(6);

    const response2 = await testee.post("/api/benutzer/verify").send({
        email: "dimäe@riffel.de",
        code: v?.verificationCode
    });
    expect(response2.status).toBe(400);
})
test("BenutzerRouter POST verify invalid code", async () => {
    const testee = supertest(app);
    const response = await testee.post("/api/benutzer/register").send({
        name: "Dima",
        email: "dima@riffel.de",
        password: "passWORT_123"
    })
    expect(response.status).toBe(201);

    const response2 = await testee.post("/api/benutzer/verify").send({
        email: "dima@riffel.de",
        code: "123456"
    });
    expect(response2.status).toBe(400);
})

test("BenutzerRouter PUT name, password", async () => {
    const b = await Benutzer.create({ email: "test@mail.de", name: "benutzer", password: "password123A-", active: true });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login/").send({ email: b.email, password: "password123A-" });
    const cookie = loginResponse.body.token;
    const res = await testee.put(`/api/benutzer/${b.id}`).send({ name: "updatedBenutzer", password: "updatedPassword123." }).set("token", cookie)
    expect(res.status).toBe(200)
    expect(res.body.name).toBe("updatedBenutzer")
    const loginResponse2 = await testee.post("/api/login/").send({ email: b.email, password: "password123A-" });
    expect(loginResponse2.status).toBe(401)
    const loginResponse3 = await testee.post("/api/login/").send({ email: b.email, password: "updatedPassword123." });
    expect(loginResponse3.status).toBe(200)
})

test("BenutzerRouter PUT name, password validation error", async () => {
    const b = await Benutzer.create({ email: "test@mail.de", name: "benutzer", password: "password123A-", active: true });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login/").send({ email: b.email, password: "password123A-" });
    const cookie = loginResponse.body.token;
    const res = await testee.put(`/api/benutzer/${b.id}`).send({ name: "updatedBenutzer", password: "u" }).set("token", cookie)
    expect(res.status).toBe(400)
})

test("BenutzerRouter PUT name, password unterschiedliche id", async () => {
    const b = await Benutzer.create({ email: "test@mail.de", name: "benutzer", password: "password123A-", active: true });
    const b2 = await Benutzer.create({ email: "test2@mail.de", name: "benutzer2", password: "password123A-", active: true });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login/").send({ email: b.email, password: "password123A-" });
    const cookie = loginResponse.body.token
    const res = await testee.put(`/api/benutzer/${b2.id}`).send({ name: "updatedBenutzer", password: "updatedPasswod123" }).set("token", cookie)
    expect(res.status).toBe(501)
})

test("BenutzerRouter PUT email", async () => {
    const b = await Benutzer.create({ email: "test@mail.de", name: "benutzer", password: "password123A-", active: true });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login/").send({ email: b.email, password: "password123A-" });
    const cookie = loginResponse.body.token
    const res = await testee.put(`/api/benutzer/${b.id}`).send({ email: "update@email.de" }).set("token", cookie);
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
        name: "benutzer",
        email: "update@email.de",
        id: expect.any(String)
    })
    expect(sendConfirmationEmail).toHaveBeenCalled();
    expect(sendConfirmationEmail).toHaveBeenCalledWith(
        "update@email.de",
        expect.any(String)
    );
    const v = await Verification.findOne({ email: "update@email.de" });
    expect(v).toBeDefined();
    expect(v?.verificationCode).toHaveLength(6);
    const benutzer = await Benutzer.findById(b.id);
    expect(benutzer?.active).toBe(false);

    const response2 = await testee.post("/api/benutzer/verify").send({
        email: "update@email.de",
        code: v?.verificationCode
    });
    expect(response2.status).toBe(204);

    const updatedUser = await Benutzer.findById(b.id);
    expect(updatedUser?.active).toBe(true); // Bestätigt, dass die E-Mail tatsächlich aktualisiert wurde
})

test("BenutzerRouter DELETE successful", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login/").send({ email: b.email, password: "passWORT_123" });
    const cookie = loginResponse.body.token
    const response = await testee.delete(`/api/benutzer/${b.id}`).set("token", cookie);
    expect(response.status).toBe(204);
})
test("BenutzerRouter DELETE different param id", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
    const c = await Benutzer.create({ email: "riffel@dima.de", name: "Dima", password: "passWORT_123", active: true });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login/").send({ email: b.email, password: "passWORT_123" });
    const cookie = loginResponse.body.token
    const response = await testee.delete(`/api/benutzer/${c.id}`).set("token", cookie);
    expect(response.status).toBe(401);
})
test("BenutzerRouter DELETE not authenticated", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login/").send({ email: b.email, password: "passWORT_123" });
    const response = await testee.delete(`/api/benutzer/${b.id}`)
    expect(response.status).toBe(401);
})
test("BenutzerRouter DELETE not active", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: false });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login/").send({ email: b.email, password: "passWORT_123" });
    try {
        expect(loginResponse.status).toBe(401);
        const cookie = loginResponse.headers["set-cookie"][0];
        const response = await testee.delete(`/api/benutzer/${b.id}`).set("Cookie", cookie);
    } catch (e) {
        expect(e).toBeDefined();
    }
})