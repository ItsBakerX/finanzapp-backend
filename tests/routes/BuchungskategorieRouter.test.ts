import app from "../../src/jestApp";
import supertest from "supertest";
import { createBenutzer } from "../../src/services/BenutzerService";

import { createBuchungsKategorie, getBuchungskategorie, standardKategorien } from "../../src/services/BuchungskategorieService";
import { HydratedDocument } from "mongoose";
import { Buchungskategorie, IBuchungskategorie } from "../../src/models/BuchungskategorieModel";
import { BenutzerResource, BuchungResource, BuchungskategorieResource } from "../../src/Resources";
import { Benutzer } from "../../src/models/BenutzerModel"


let benutzer: BenutzerResource
let kategorie1: HydratedDocument<IBuchungskategorie>
let kategorie2: HydratedDocument<IBuchungskategorie>

beforeEach(async () => {
    benutzer = await createBenutzer({
        name: "Dima",
        email: "dima@riffel.de",
        password: "1234abcdABCD..;,."
    })
    await Benutzer.updateOne({ email: "dima@riffel.de" }, { active: true });

    kategorie1 = await Buchungskategorie.create({ name: "kategorie1", benutzer: benutzer.id! })
    kategorie2 = await Buchungskategorie.create({ name: "kategorie2", benutzer: benutzer.id! })
})
test("Buchungskategorie getAlle", async () => {
    const testee = supertest(app);

    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token

    expect(benutzer).toBeDefined();


    const response = await testee.get("/api/buchungskategorie/alleKategorien").set("token", cookie);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(9)
})

test("Buchungskategorie getAlleEigene", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token
    expect(benutzer).toBeDefined();
    const response = await testee.get("/api/buchungskategorie/alleEigeneKategorien").set("token", cookie);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2)
})

test("Buchungskategorie getAlleStandard", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token
    expect(benutzer).toBeDefined();
    const response = await testee.get("/api/buchungskategorie/alleStandardKategorien").set("token", cookie);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(standardKategorien.length)
})

test("Buchungskategorie get", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;

    const response = await testee.get(`/api/buchungskategorie/${kategorie1.id}`).set("token", cookie);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe(kategorie1.name)
})

test("Buchungskategorie get", async () => {
    const testee = supertest(app);

    const response = await testee.get(`/api/buchungskategorie/${kategorie2.id}`);
    expect(response.status).toBe(401);
})

test("Buchungskategorie get", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;

    const response = await testee.get(`/api/buchungskategorie/notaValidId`).set("token", cookie);
    expect(response.status).toBe(400);
})

test("Buchungskategorie get", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;

    const response = await testee.get(`/api/buchungskategorie/000000000000000000000000`).set("token", cookie);
    expect(response.status).toBe(404);
})

test("Buchungskategorie post ohne Limit", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;

    const resource = { name: "neueKat", benutzer: benutzer.id }
    const response = await testee.post(`/api/buchungskategorie/`).set("token", cookie).send(resource);
    const find = await getBuchungskategorie(response.body.id)
    expect(response.status).toBe(200)
    expect(find).toBeDefined()
    expect(find.name).toBe(resource.name)
    expect(find.name).toBe(response.body.name)
    expect(find.benutzer).toBe(resource.benutzer)
    expect(find.benutzer).toBe(response.body.benutzer)
})

test("Buchungskategorie post mit Limit", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;

    const resource: BuchungskategorieResource = { name: "neueKat", benutzer: benutzer.id!, ausgabenlimit: 500 }
    const response = await testee.post(`/api/buchungskategorie/`).set("token", cookie).send(resource);
    expect(response.status).toBe(200)
    const find = await getBuchungskategorie(response.body.id)
    expect(find).toBeDefined()
    expect(find.name).toBe(resource.name)
    expect(find.name).toBe(response.body.name)
    expect(find.benutzer).toBe(resource.benutzer)
    expect(find.benutzer).toBe(response.body.benutzer)
    expect(find.ausgabenlimit).toBe(resource.ausgabenlimit)
    expect(find.ausgabenlimit).toBe(response.body.ausgabenlimit)
})


test("Buchungskategorie post Validation errors", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;

    let response = await testee.post(`/api/buchungskategorie/`).set("token", cookie).send({ name: 165, benutzer: benutzer.id!, ausgabenlimit: 500 });
    expect(response.status).toBe(400)

    response = await testee.post(`/api/buchungskategorie/`).set("token", cookie).send({ name: "test", benutzer: benutzer.id!, ausgabenlimit: "bier" });
    expect(response.status).toBe(400)

    response = await testee.post(`/api/buchungskategorie/`).set("token", cookie).send({ name: "test", benutzer: "invalidID" });
    expect(response.status).toBe(400)
})

test("Buchungskategorie post benutzer nicht gefunden", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;
    const response = await testee.post("/api/buchungskategorie/").set("token", cookie).send({ name: "test", benutzer: "000000000000000000000000", ausgabenlimit: 500 })
    expect(response.status).toBe(404)
})

test("Buchungskategorie put Validation errors", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;

    let response = await testee.put(`/api/buchungskategorie/${kategorie1.id}`).set("token", cookie).send({ name: 165, ausgabenlimit: 500 });
    expect(response.status).toBe(400)

    response = await testee.put(`/api/buchungskategorie/${kategorie1.id}`).set("token", cookie).send({ name: "test", ausgabenlimit: "bier" });
    expect(response.status).toBe(400)

    response = await testee.put(`/api/buchungskategorie/invalidID`).set("token", cookie).send({ name: "test" });
    expect(response.status).toBe(400)
})

test("Buchungskategorie put kategorie nicht gefunden", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;
    const response = await testee.put("/api/buchungskategorie/000000000000000000000000").set("token", cookie).send({ name: "test", ausgabenlimit: 500 })
    expect(response.status).toBe(404)
})

test("Buchungskategorie put name ändern", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;
    const response = await testee.put(`/api/buchungskategorie/${kategorie1.id}`).set("token", cookie).send({ name: "update" })
    expect(response.status).toBe(200)
    const find = await getBuchungskategorie(response.body.id)
    expect(find).toBeDefined()
    expect(find.name).toBe(response.body.name)
    expect(find.name).toBe("update")
    expect(find.benutzer).toBe(response.body.benutzer)
    expect(find.ausgabenlimit).toBe(response.body.ausgabenlimit)
    expect(find.ausgabenlimit).toBe(kategorie1.ausgabenlimit)
})

test("Buchungskategorie put limit ändern", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;
    const response = await testee.put(`/api/buchungskategorie/${kategorie1.id}`).set("token", cookie).send({ ausgabenlimit: 654 })
    expect(response.status).toBe(200)
    const find = await getBuchungskategorie(response.body.id)
    expect(find).toBeDefined()
    expect(find.name).toBe(response.body.name)
    expect(find.name).toBe(kategorie1.name)
    expect(find.benutzer).toBe(response.body.benutzer)
    expect(find.ausgabenlimit).toBe(response.body.ausgabenlimit)
    expect(find.ausgabenlimit).toBe(654)
})

test("Buchungskategorie put limit und name ändern", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;
    const response = await testee.put(`/api/buchungskategorie/${kategorie1.id}`).set("token", cookie).send({ name: "update", ausgabenlimit: 654 })
    expect(response.status).toBe(200)
    const find = await getBuchungskategorie(response.body.id)
    expect(find).toBeDefined()
    expect(find.name).toBe(response.body.name)
    expect(find.name).toBe("update")
    expect(find.benutzer).toBe(response.body.benutzer)
    expect(find.ausgabenlimit).toBe(response.body.ausgabenlimit)
    expect(find.ausgabenlimit).toBe(654)
})

test("Buchungskategorie put limit ändern 0", async () => {
    kategorie1 = await Buchungskategorie.create({ name: "kategorie1", benutzer: benutzer.id!, ausgabenlimit: 200 })
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;
    const response = await testee.put(`/api/buchungskategorie/${kategorie1.id}`).set("token", cookie).send({ ausgabenlimit: 0 })
    expect(response.status).toBe(200)
    const find = await getBuchungskategorie(response.body.id)
    expect(find).toBeDefined()
    expect(find.name).toBe(response.body.name)
    expect(find.name).toBe(kategorie1.name)
    expect(find.benutzer).toBe(response.body.benutzer)
    expect(find.ausgabenlimit).toBe(response.body.ausgabenlimit)
    expect(find.ausgabenlimit).toBe(0)
})

test("Buchungskategorie put limit ändern null", async () => {
    kategorie1 = await Buchungskategorie.create({ name: "kategorie1", benutzer: benutzer.id!, ausgabenlimit: 200 })
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;
    const response = await testee.put(`/api/buchungskategorie/${kategorie1.id}`).set("token", cookie).send({ ausgabenlimit: null })
    expect(response.status).toBe(200)
    const find = await getBuchungskategorie(response.body.id)
    expect(find).toBeDefined()
    expect(find.name).toBe(response.body.name)
    expect(find.name).toBe(kategorie1.name)
    expect(find.benutzer).toBe(response.body.benutzer)
    expect(find.ausgabenlimit).toBe(response.body.ausgabenlimit)
    expect(find.ausgabenlimit).toBe(null)
})

test("Buchungskategorie delete Validation errors", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;

    const response = await testee.delete(`/api/buchungskategorie/invalidID`).set("token", cookie).send();
    expect(response.status).toBe(400)
})

test("Buchungskategorie delete kategorie nicht gefunden", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;
    const response = await testee.delete("/api/buchungskategorie/000000000000000000000000").set("token", cookie).send()
    expect(response.status).toBe(404)
})

test("Buchungskategorie delete ", async () => {
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login/").send({
        email: "dima@riffel.de", password: "1234abcdABCD..;,."
    })
    const cookie = loginResponse.body.token;
    const response = await testee.delete(`/api/buchungskategorie/${kategorie1.id}`).set("token", cookie).send()
    expect(response.status).toBe(204)
    expect(async () => { await getBuchungskategorie(kategorie1.id) }).rejects.toThrow("Buchungskategorie nicht gefunden")

})

