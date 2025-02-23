import app from "../../src/jestApp";
import supertest from "supertest";
import { createBenutzer } from "../../src/services/BenutzerService";
import { createPocket } from "../../src/services/PocketService";
import { NON_EXISTING_ID } from "../../tests/model/BuchungskategorieModel.test";
import { HydratedDocument, Types } from "mongoose";
import { IPocket, Pocket } from "../../src/models/PocketModel";
import { Benutzer, IBenutzer } from "../../src/models/BenutzerModel";
import { createBuchung, deleteBuchung, getAlleBuchungen, getAlleBuchungenBenutzer, getAlleWiederkehrendeBuchungen, getAlleZukunftBuchungen } from "../../src/services/BuchungService";
import { EinmaligeBuchung } from "../../src/models/EinmaligeBuchungModel";
import { WiederkehrendeBuchung } from "../../src/models/WiederkehrendeBuchungModel";
import { dateToString, stringToDate } from "../../src/services/ServiceHelper";
import { Buchungskategorie, IBuchungskategorie } from "../../src/models/BuchungskategorieModel";
import { Ubertrag } from "../../src/models/UbertragModel";
import { BuchungResource } from "../../src/Resources";
import { IBuchung } from "../../src/models/BuchungModel";
import { authenticate } from "../../src/routes/Authentication";

describe("get", () => {
    let benutzer: HydratedDocument<IBenutzer>;
    let pocket: HydratedDocument<IPocket>
    let pocket2: HydratedDocument<IPocket>
    let kategorie: HydratedDocument<IBuchungskategorie>
    let kategorie2: HydratedDocument<IBuchungskategorie>

    beforeEach(async () => {
        benutzer = await Benutzer.create({
            email: "example@email.com",
            name: "Test",
            password: "1234abcdABCD..;,.",
            active: true
        });
        pocket = await Pocket.create({
            name: "TestPocket",
            betrag: 1000,
            benutzer: benutzer.id
        })
        pocket2 = await Pocket.create({
            name: "TestPocket2",
            betrag: 500,
            benutzer: benutzer.id
        })
        kategorie = await Buchungskategorie.create({
            name: "TestKategorie",
            benutzer: benutzer.id
        })
        kategorie2 = await Buchungskategorie.create({
            name: "TestKategorie2",
            benutzer: benutzer.id
        })
    });

    test("get: getAlleBuchungenBenutzer: 1 Buchung", async () => {
        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get("/api/buchung/alle").send({ userId: benutzer.id }).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(1)
    })

    test("get: getAlleBuchungenBenutzer: 2 Buchungen", async () => {
        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung"
        })
        await createBuchung({
            name: "TestBuchung2",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "21.10.2024",
            betrag: 100,
            typ: "einzahlung"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get("/api/buchung/alle").send({ userId: benutzer.id }).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(2)
    })

    test("get: getAlleBuchungen von Pocket: 1 Buchung", async () => {
        expect(benutzer.id).toBeDefined();

        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/${pocket.id}/buchungen`).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(1)
    })

    test("get: getAlleBuchungen von Pocket: 2 Buchung", async () => {
        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung"
        })
        await createBuchung({
            name: "TestBuchung2",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "21.10.2024",
            betrag: 100,
            typ: "einzahlung"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/${pocket.id}/buchungen`).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(2)
        // added fromWiederkehrend should be false
        expect(response.body[0].fromWiederkehrend).toBe(false)
    })

    test("get: getAlleBuchungen von Zukunft: 1 Buchung", async () => {
        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2524",
            betrag: 50,
            typ: "einzahlung"
        })
        await createBuchung({
            name: "TestBuchung2",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "21.10.2024",
            betrag: 100,
            typ: "einzahlung"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/alleZukunft`).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(1)
        // added fromWiederkehrend should be false
        expect(response.body[0].zukunft).toBe(true)
    })

    test("get: getAlleBuchungen handleZukunft Middleware: 1 Buchung", async () => {
        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2524",
            betrag: 50,
            typ: "einzahlung"
        })
        await EinmaligeBuchung.create({
            name: "TestBuchung2",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: new Date(),
            betrag: 100,
            typ: "einzahlung",
            zukunft: true
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/alle`).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(1)
        // added fromWiederkehrend should be false
        expect((await getAlleZukunftBuchungen(benutzer.id!)).length).toBe(1)
    })

    test("patch: Zukunft BuchungAusführen", async () => {
        const buchung = await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2524",
            betrag: 50,
            typ: "einzahlung"
        })

        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        expect((await getAlleZukunftBuchungen(benutzer.id!)).length).toBe(1)
        const response = await testee.patch(`/api/buchung/zukunftAusfuehren/${buchung.id!}`).set("token", cookie)
        expect(response.status).toBe(200)
        // added fromWiederkehrend should be false
        expect((await getAlleZukunftBuchungen(benutzer.id!)).length).toBe(0)
    })

    test("get: getAlleBuchungen von Pocket: keine Buchungen", async () => {
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/${pocket.id}/buchungen`).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(0)
    })

    test("get: getAlleBuchungen von Pocket: Fehler: Pocket gibts nicht", async () => {
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/${NON_EXISTING_ID}/buchungen`).set("token", cookie)
        expect(response.status).toBe(404)
        expect(response.body.errors[0].msg).toBe(`Pocket mit ID ${NON_EXISTING_ID} nicht gefunden`)
    })

    test("get: getAlleBuchungen von Pocket: Fehler: PocketID ist keine MongoID", async () => {
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/blablabla/buchungen`).set("token", cookie)
        expect(response.status).toBe(400)
        expect(response.body.errors[0].msg).toBe("Invalid value")
    })

    test("get: getAlleWiederkehrendeBuchungen: 1 Buchung", async () => {
        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            intervall: "monat"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get("/api/buchung/wiederkehrend").send({ userId: benutzer.id }).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(1)
    })

    test("get: getAlle: testing if einmaligeBuchung has fromWiederkehrend attribute", async () => {
        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            intervall: "monat"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get("/api/buchung/alle").send({ userId: benutzer.id }).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBeGreaterThan(0)
        expect(response.body[0].fromWiederkehrend).toBe(true)
    })

    test("get: getAlleWiederkehrendeBuchungen: 2 Buchungen", async () => {
        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            intervall: "monat"
        })

        await createBuchung({
            name: "TestBuchung2",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "20.10.2024",
            betrag: 100,
            typ: "ausgabe",
            intervall: "monat"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get("/api/buchung/wiederkehrend").send({ userId: benutzer.id }).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(2)
    })

    test("get: getAlleWiederkehrendeBuchungen: keine Wiederkehrende, 1 Normale Buchung", async () => {
        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get("/api/buchung/wiederkehrend").send({ userId: benutzer.id }).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(0)
    })

    test("get: getAlleWiederkehrendeBuchungen: keine Wiederkehrende, 2 Normale Buchungen", async () => {
        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung"
        })

        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get("/api/buchung/wiederkehrend").send({ userId: benutzer.id }).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(0)
    })

    test("get: getAlleWiederkehrendeBuchungen: 1 Wiederkehrende, 2 Normale Buchungen", async () => {
        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung"
        })

        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung"
        })

        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            intervall: "monat"
        })

        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get("/api/buchung/wiederkehrend").send({ userId: benutzer.id }).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(1)
    })

    test("get: getAlleWiederkehrendeBuchungen: Fehler", async () => {

        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const response = await testee.get("/api/buchung/wiederkehrend");
        expect(response.status).toBe(401);

    })

    test("get: getAlleBuchungenBenutzer: Fehler", async () => {

        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "exampleblabla@email.com", password: "1234abcdABCD..;,." });
        const response = await testee.get("/api/buchung/alle");
        expect(response.status).toBe(401)
    })

    test("get: getAlleBuchungen von Kategorie: 2 Buchung", async () => {

        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung"
        })
        await createBuchung({
            name: "TestBuchung2",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "21.10.2024",
            betrag: 100,
            typ: "einzahlung"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/${kategorie.id}/kategorie/buchungen`).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(2)

    })

    test("get: getAlleBuchungen von Kategorie: 1 Buchung", async () => {

        await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung"
        })
        await createBuchung({
            name: "TestBuchung2",
            pocket: pocket.id,
            kategorie: kategorie2.id,
            datum: "21.10.2024",
            betrag: 100,
            typ: "einzahlung"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/${kategorie.id}/kategorie/buchungen`).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(1)

    })

    test("get: getAlleBuchungen von Kategorie: invalid id", async () => {
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/invalidID/kategorie/buchungen`).set("token", cookie)
        expect(response.status).toBe(400)
    })

    test("get: getAlleBuchungen von Kategorie: id not Found", async () => {
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/000000000000000000000000/kategorie/buchungen`).set("token", cookie)
        expect(response.status).toBe(400)
    })

    test("get: getAlleBuchungen von Kategorie: unauthorized", async () => {
        const testee = supertest(app)
        const response = await testee.get(`/api/buchung/${kategorie.id}/kategorie/buchungen`)
        expect(response.status).toBe(401)
    })

    test("get: id not found", async () => {
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/single/${NON_EXISTING_ID}`).set("token", cookie)
        expect(response.status).toBe(404)
    })

    test("get: invalid id", async () => {
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/single/invalidID`).set("token", cookie)
        expect(response.status).toBe(400)
    })

    test("get: unauthorized", async () => {
        const testee = supertest(app)
        const response = await testee.get(`/api/buchung/single/${kategorie.id}`)
        expect(response.status).toBe(401)
    })

    test("get: get single einmalige Buchung", async () => {
        const buchung = await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/single/${buchung.id}`).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.name).toBe("TestBuchung")
    })
    test("get: get single wiederkehrende Buchung", async () => {
        const buchung = await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung",
            intervall: "monat"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/single/${buchung.id}`).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.name).toBe("TestBuchung")
        expect(response.body.intervall).toBe("monat")
    })
    test("get: get single ubertrag Buchung", async () => {
        const buchung = await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            zielPocket: pocket2.id
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/single/${buchung.id}`).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.name).toBe("TestBuchung")
        expect(response.body.intervall).toBe(undefined)
        expect(response.body.zielPocket).toBe(pocket2.id)
    })

    test("get: getAlle only ubertrag", async () => {
        const buchung = await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            zielPocket: pocket2.id
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/buchung/alle`).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(1)
        expect(response.body[0].zielPocket).toBe(pocket2.id)
        expect(response.body[0].fromWiederkehrend).toBe(false)
    })
})

describe("post", () => {
    let benutzer: HydratedDocument<IBenutzer>;
    let pocket: HydratedDocument<IPocket>
    let pocket2: HydratedDocument<IPocket>
    let kategorie: HydratedDocument<IBuchungskategorie>

    beforeEach(async () => {
        benutzer = await Benutzer.create({
            email: "example@email.com",
            name: "Test",
            password: "1234abcdABCD..;,."

        });

        await Benutzer.updateOne({ email: "example@email.com" }, { active: true });
        pocket = await Pocket.create({
            name: "TestPocket",
            betrag: 1000,
            benutzer: benutzer.id
        })
        pocket2 = await Pocket.create({
            name: "TestPocket2",
            betrag: 500,
            benutzer: benutzer.id
        })
        kategorie = await Buchungskategorie.create({
            name: "TestKategorie",
            benutzer: benutzer.id
        })
    });

    test("post: createBuchung: Einmalige Buchung", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            notiz: "TestNotiz"
        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post(`/api/buchung`).send(buchung).set("token", cookie);
        expect(response.status).toBe(201);
        expect(response.body.notiz).toBe("TestNotiz");
        expect(response.body.intervall).toBe(undefined);
    })

    test("post: createBuchung: Einmalige Buchung", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: -50,
            typ: "ausgabe",
            notiz: "TestNotiz"
        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post(`/api/buchung`).send(buchung).set("token", cookie);
        expect(response.status).toBe(400);
    })

    test("post: createBuchung: Einmalige Buchung: Ausgabe", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            notiz: "TestNotiz"
        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post(`/api/buchung`).send(buchung).set("token", cookie);
        expect(response.status).toBe(201);
        expect(response.body.notiz).toBe("TestNotiz");
    })

    test("post: createBuchung: Einmalige Buchung: Einzahlung", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung",
        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post(`/api/buchung`).send(buchung).set("token", cookie);
        expect(response.status).toBe(201);
    })

    test("post: createBuchung: Wiederkehrende Buchung: Ausgabe", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            intervall: "monat"
        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post(`/api/buchung`).send(buchung).set("token", cookie);
        expect(response.status).toBe(201);
    })

    test("post: createBuchung: Wiederkehrende Buchung: Einzahlung", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung",
            intervall: "monat"
        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post(`/api/buchung`).send(buchung).set("token", cookie);
        expect(response.status).toBe(201);
        expect(response.body.intervall).toBe("monat");
    })

    test("post: createBuchung: Uebertrag", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            zielPocket: pocket2.id
        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post(`/api/buchung`).send(buchung).set("token", cookie);
        expect(response.status).toBe(201);
    })

    test("post: createBuchung: Uebertrag, Fehler, Einzahlung not applicable for Uebertrag", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung",
            zielPocket: pocket2.id
        }

        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post(`/api/buchung`).send(buchung).set("token", cookie);
        expect(response.status).toBe(400);
        expect(response.body.errors[0]).toHaveProperty("msg");
        const expectedMessage = "typ: einzahlung not applicable for Uebertrag";
        response.body.errors.forEach((error: any) => {
            expect(error.msg).toBe(expectedMessage);
            expect(error.msg).not.toBe("Bla-Bla-Bla");
        });
    })

    test("post: createBuchung: Uebertrag, Fehler, ZielPocket not found", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            zielPocket: NON_EXISTING_ID
        }

        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post(`/api/buchung`).send(buchung).set("token", cookie);
        expect(response.status).toBe(404);
        expect(response.body.errors[0].msg).toBe("ZielPocket not found");
    })

    test("post: createBuchung: Einmalige/wiederkehrende Buchung, Fehler, Typ ist falsch", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "blabal",
        }

        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post(`/api/buchung`).send(buchung).set("token", cookie);
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toBe("Typ must be 'einzahlung' or 'ausgabe'");
    })

    test("post: createBuchung: Allgemein, Fehler, Pocket not found", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: NON_EXISTING_ID,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
        }

        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
        expect(response.status).toBe(404);
        expect(response.body.errors[0].msg).toBe("Pocket not found");
    })

})

describe('put', () => {
    let benutzer: HydratedDocument<IBenutzer>;
    let pocket: HydratedDocument<IPocket>
    let pocket2: HydratedDocument<IPocket>
    let pocket3: HydratedDocument<IPocket>
    let kategorie: HydratedDocument<IBuchungskategorie>
    let buchungEinmalig: HydratedDocument<IBuchung>
    let kategorie2: HydratedDocument<IBuchungskategorie>
    beforeEach(async () => {
        benutzer = await Benutzer.create({
            email: "example@email.com",
            name: "Test",
            password: "1234abcdABCD..;,."

        });

        await Benutzer.updateOne({ email: "example@email.com" }, { active: true });
        pocket = await Pocket.create({
            name: "TestPocket",
            betrag: 1000,
            benutzer: benutzer.id
        })
        pocket2 = await Pocket.create({
            name: "TestPocket2",
            betrag: 500,
            benutzer: benutzer.id
        })
        pocket3 = await Pocket.create({
            name: "TestPocket3",
            betrag: 2000,
            benutzer: benutzer.id
        })
        kategorie = await Buchungskategorie.create({
            name: "TestKategorie",
            benutzer: benutzer.id
        })

        kategorie2 = await Buchungskategorie.create({
            name: "TestKategorie2",
            benutzer: benutzer.id
        })

    });

    describe('put: EinmaligeBuchung', () => {
        test('put: EinmaligeBuchung, update betrag, typ', async () => {
            const buchung: BuchungResource = {
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "einzahlung",
            }
            const testee = supertest(app);
            const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
            const cookie = loginResponse.body.token
            const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
            expect(responseCreate.status).toBe(201);

            const updateBuchung: BuchungResource = {
                id: responseCreate.body.id,
                name: 'TestBuchungUpdated',
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 200,
                typ: "ausgabe",
            }
            const responseUpdate = await testee.put(`/api/buchung/${responseCreate.body.id}`).send(updateBuchung).set('token', cookie);
            console.log(responseUpdate.body);
            expect(responseUpdate.status).toBe(200);
            const responseGet = await testee.get(`/api/buchung/single/${responseUpdate.body.id}`).set("token", cookie)
            expect(responseGet.status).toBe(200);
            expect(responseGet.body.name).toBe('TestBuchungUpdated');
            expect(responseGet.body.betrag).toBe(200);
            expect(responseGet.body.typ).toBe('ausgabe');
        })

        test('put: EinmaligeBuchung, update datum', async () => {
            const buchung: BuchungResource = {
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "einzahlung",
            }
            const testee = supertest(app);
            const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
            const cookie = loginResponse.body.token
            const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
            expect(responseCreate.status).toBe(201);

            const updateBuchung: BuchungResource = {
                id: responseCreate.body.id,
                name: 'TestBuchungUpdated',
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "11.10.2024",
                betrag: 50,
                typ: "einzahlung",
            }
            const responseUpdate = await testee.put(`/api/buchung/${responseCreate.body.id}`).send(updateBuchung).set('token', cookie);
            console.log(responseUpdate.body);
            expect(responseUpdate.status).toBe(200);
            const responseGet = await testee.get(`/api/buchung/single/${responseUpdate.body.id}`).set("token", cookie)
            expect(responseGet.status).toBe(200);
            expect(responseGet.body.name).toBe('TestBuchungUpdated');
            expect(responseGet.body.betrag).toBe(50);
            expect(responseGet.body.datum).toBe('11.10.2024');
        })

        test('put: EinmaligeBuchung, update kategorie', async () => {
            const buchung: BuchungResource = {
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "einzahlung",
            }
            const testee = supertest(app);
            const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
            const cookie = loginResponse.body.token
            const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
            expect(responseCreate.status).toBe(201);

            const updateBuchung: BuchungResource = {
                id: responseCreate.body.id,
                name: 'TestBuchungUpdated',
                pocket: pocket.id,
                kategorie: kategorie2.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "einzahlung",
            }
            const responseUpdate = await testee.put(`/api/buchung/${responseCreate.body.id}`).send(updateBuchung).set('token', cookie);
            console.log(responseUpdate.body);
            expect(responseUpdate.status).toBe(200);
            const responseGet = await testee.get(`/api/buchung/single/${responseUpdate.body.id}`).set("token", cookie)
            expect(responseGet.status).toBe(200);
            expect(responseGet.body.name).toBe('TestBuchungUpdated');
            expect(responseGet.body.betrag).toBe(50);
            expect(responseGet.body.kategorie).toBe(kategorie2.id);
        })

        test('put: EinmaligeBuchung, update pocket', async () => {
            const buchung: BuchungResource = {
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "einzahlung",
            }
            const testee = supertest(app);
            const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
            const cookie = loginResponse.body.token
            const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
            expect(responseCreate.status).toBe(201);

            const updateBuchung: BuchungResource = {
                id: responseCreate.body.id,
                name: 'TestBuchungUpdated',
                pocket: pocket2.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "einzahlung",
            }
            const responseUpdate = await testee.put(`/api/buchung/${responseCreate.body.id}`).send(updateBuchung).set('token', cookie);
            console.log(responseUpdate.body);
            expect(responseUpdate.status).toBe(200);
            const responseGet = await testee.get(`/api/buchung/single/${responseUpdate.body.id}`).set("token", cookie)
            expect(responseGet.status).toBe(200);
            expect(responseGet.body.name).toBe('TestBuchungUpdated');
            expect(responseGet.body.betrag).toBe(50);
            expect(responseGet.body.pocket).toBe(pocket2.id);
        })
    })

    describe('put: WiederkehrendeBuchung', () => {
        test('put: wiederkehrendeBuchung, update betrag, typ', async () => {
            const buchung: BuchungResource = {
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                intervall: 'monat'
            }
            const testee = supertest(app);
            const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
            const cookie = loginResponse.body.token
            const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
            expect(responseCreate.status).toBe(201);

            const updateBuchung: BuchungResource = {
                name: "TestBuchungUpdated",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 100,
                typ: "einzahlung",
                intervall: 'monat'
            }

            const responseUpdate = await testee.put(`/api/buchung/${responseCreate.body.id}`).send(updateBuchung).set('token', cookie);
            console.log(responseUpdate.body);
            expect(responseUpdate.status).toBe(200);
            const responseGet = await testee.get(`/api/buchung/single/${responseUpdate.body.id}`).set("token", cookie)
            expect(responseGet.status).toBe(200);
            expect(responseGet.body.name).toBe('TestBuchungUpdated');
            expect(responseGet.body.betrag).toBe(100);
            expect(responseGet.body.typ).toBe('einzahlung');
        })

        test('put: wiederkehrendeBuchung, update datum, intervall', async () => {
            const buchung: BuchungResource = {
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                intervall: 'monat'
            }
            const testee = supertest(app);
            const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
            const cookie = loginResponse.body.token
            const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
            expect(responseCreate.status).toBe(201);

            const updateBuchung: BuchungResource = {
                name: "TestBuchungUpdated",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "13.09.2024",
                betrag: 50,
                typ: "ausgabe",
                intervall: 'woche'
            }

            const responseUpdate = await testee.put(`/api/buchung/${responseCreate.body.id}`).send(updateBuchung).set('token', cookie);
            console.log(responseUpdate.body);
            expect(responseUpdate.status).toBe(200);
            const responseGet = await testee.get(`/api/buchung/single/${responseUpdate.body.id}`).set("token", cookie)
            expect(responseGet.status).toBe(200);
            expect(responseGet.body.name).toBe('TestBuchungUpdated');
            expect(responseGet.body.betrag).toBe(50);
            expect(responseGet.body.datum).toBe('13.09.2024');
            expect(responseGet.body.intervall).toBe('woche');
        })

        test('put: wiederkehrendeBuchung, update kategorie', async () => {
            const buchung: BuchungResource = {
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                intervall: 'monat'
            }
            const testee = supertest(app);
            const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
            const cookie = loginResponse.body.token
            const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
            expect(responseCreate.status).toBe(201);

            const updateBuchung: BuchungResource = {
                name: "TestBuchungUpdated",
                pocket: pocket.id,
                kategorie: kategorie2.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                intervall: 'monat'
            }

            const responseUpdate = await testee.put(`/api/buchung/${responseCreate.body.id}`).send(updateBuchung).set('token', cookie);
            console.log(responseUpdate.body);
            expect(responseUpdate.status).toBe(200);
            const responseGet = await testee.get(`/api/buchung/single/${responseUpdate.body.id}`).set("token", cookie)
            expect(responseGet.status).toBe(200);
            expect(responseGet.body.name).toBe('TestBuchungUpdated');
            expect(responseGet.body.betrag).toBe(50);
            expect(responseGet.body.kategorie).toBe(kategorie2.id);
        })

        test('put: wiederkehrendeBuchung, update pocket', async () => {
            const buchung: BuchungResource = {
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                zielPocket: pocket2.id,
            }
            const testee = supertest(app);
            const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
            const cookie = loginResponse.body.token
            const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
            expect(responseCreate.status).toBe(201);

            const updateBuchung: BuchungResource = {
                name: "TestBuchungUpdated",
                pocket: pocket2.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                intervall: 'monat'
            }

            const responseUpdate = await testee.put(`/api/buchung/${responseCreate.body.id}`).send(updateBuchung).set('token', cookie);
            console.log(responseUpdate.body);
            expect(responseUpdate.status).toBe(200);
            const responseGet = await testee.get(`/api/buchung/single/${responseUpdate.body.id}`).set("token", cookie)
            expect(responseGet.status).toBe(200);
            expect(responseGet.body.name).toBe('TestBuchungUpdated');
            expect(responseGet.body.betrag).toBe(50);
            expect(responseGet.body.pocket).toBe(pocket2.id);
        })

    })


    describe('put: Uebertrag', () => {
        test('put: Uebertrag, update betrag, datum', async () => {
            const buchung: BuchungResource = {
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                zielPocket: pocket2.id
            }
            const testee = supertest(app);
            const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
            const cookie = loginResponse.body.token
            const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
            expect(responseCreate.status).toBe(201);

            const updateBuchung: BuchungResource = {
                name: "TestBuchungUpdated",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "11.10.2024",
                betrag: 100,
                typ: "ausgabe",
                zielPocket: pocket2.id
            }

            const responseUpdate = await testee.put(`/api/buchung/${responseCreate.body.id}`).send(updateBuchung).set('token', cookie);
            console.log(responseUpdate.body);
            expect(responseUpdate.status).toBe(200);
            const responseGet = await testee.get(`/api/buchung/single/${responseUpdate.body.id}`).set("token", cookie)
            expect(responseGet.status).toBe(200);
            expect(responseGet.body.name).toBe('TestBuchungUpdated');
            expect(responseGet.body.betrag).toBe(100);
            expect(responseGet.body.datum).toBe('11.10.2024');
        })

        test('put: Uebertrag, update pocket', async () => {
            const buchung: BuchungResource = {
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                zielPocket: pocket2.id
            }
            const testee = supertest(app);
            const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
            const cookie = loginResponse.body.token
            const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
            expect(responseCreate.status).toBe(201);

            const updateBuchung: BuchungResource = {
                name: "TestBuchungUpdated",
                pocket: pocket3.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                zielPocket: pocket2.id
            }

            const responseUpdate = await testee.put(`/api/buchung/${responseCreate.body.id}`).send(updateBuchung).set('token', cookie);
            console.log(responseUpdate.body);
            expect(responseUpdate.status).toBe(200);
            const responseGet = await testee.get(`/api/buchung/single/${responseUpdate.body.id}`).set("token", cookie)
            expect(responseGet.status).toBe(200);
            expect(responseGet.body.name).toBe('TestBuchungUpdated');
            expect(responseGet.body.betrag).toBe(50);
            expect(responseGet.body.pocket).toBe(pocket3.id);
            expect(responseGet.body.zielPocket).toBe(pocket2.id);
        })

        test('put: Uebertrag, update zielPocket', async () => {
            const buchung: BuchungResource = {
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                zielPocket: pocket.id
            }
            const testee = supertest(app);
            const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
            const cookie = loginResponse.body.token
            const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
            expect(responseCreate.status).toBe(201);

            const updateBuchung: BuchungResource = {
                name: "TestBuchungUpdated",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                zielPocket: pocket3.id
            }

            const responseUpdate = await testee.put(`/api/buchung/${responseCreate.body.id}`).send(updateBuchung).set('token', cookie);
            console.log(responseUpdate.body);
            expect(responseUpdate.status).toBe(200);
            const responseGet = await testee.get(`/api/buchung/single/${responseUpdate.body.id}`).set("token", cookie)
            expect(responseGet.status).toBe(200);
            expect(responseGet.body.name).toBe('TestBuchungUpdated');
            expect(responseGet.body.betrag).toBe(50);
            expect(responseGet.body.pocket).toBe(pocket.id);
            expect(responseGet.body.zielPocket).toBe(pocket3.id);
        })

        test('put: Uebertrag, update kategorie', async () => {
            const buchung: BuchungResource = {
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                zielPocket: pocket.id
            }
            const testee = supertest(app);
            const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
            const cookie = loginResponse.body.token
            const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
            expect(responseCreate.status).toBe(201);

            const updateBuchung: BuchungResource = {
                name: "TestBuchungUpdated",
                pocket: pocket.id,
                kategorie: kategorie.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "ausgabe",
                zielPocket: pocket3.id
            }

            const responseUpdate = await testee.put(`/api/buchung/${responseCreate.body.id}`).send(updateBuchung).set('token', cookie);
            console.log(responseUpdate.body);
            expect(responseUpdate.status).toBe(200);
            const responseGet = await testee.get(`/api/buchung/single/${responseUpdate.body.id}`).set("token", cookie)
            expect(responseGet.status).toBe(200);
            expect(responseGet.body.name).toBe('TestBuchungUpdated');
            expect(responseGet.body.betrag).toBe(50);
            expect(responseGet.body.pocket).toBe(pocket.id);
            expect(responseGet.body.zielPocket).toBe(pocket3.id);
        })
    })
})

describe("delete", () => {
    let benutzer: HydratedDocument<IBenutzer>;
    let pocket: HydratedDocument<IPocket>
    let pocket2: HydratedDocument<IPocket>
    let kategorie: HydratedDocument<IBuchungskategorie>
    let buchungEinmalig: HydratedDocument<IBuchung>
    beforeEach(async () => {
        benutzer = await Benutzer.create({
            email: "example@email.com",
            name: "Test",
            password: "1234abcdABCD..;,."

        });

        await Benutzer.updateOne({ email: "example@email.com" }, { active: true });
        pocket = await Pocket.create({
            name: "TestPocket",
            betrag: 1000,
            benutzer: benutzer.id
        })
        pocket2 = await Pocket.create({
            name: "TestPocket2",
            betrag: 500,
            benutzer: benutzer.id
        })
        kategorie = await Buchungskategorie.create({
            name: "TestKategorie",
            benutzer: benutzer.id
        })

    });

    test("delete: deleteBuchung: Einmalige Buchung Einzahlung", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung",
        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
        expect(responseCreate.status).toBe(201);

        const responseDelete = await testee.delete(`/api/buchung/${responseCreate.body.id}`).set("token", cookie);
        expect(responseDelete.status).toBe(204);

        const responseGet = await testee.get(`/api/buchung/${responseCreate.body.id}`);
        expect(responseGet.status).toBe(404);
    })

    test("delete: deleteBuchung: Einmalige Buchung Ausgabe", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",

        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
        expect(responseCreate.status).toBe(201);

        const responseDelete = (await testee.delete(`/api/buchung/${responseCreate.body.id}`).set("token", cookie));
        expect(responseDelete.status).toBe(204);

        const responseGet = await testee.get(`/api/buchung/${responseCreate.body.id}`);
        expect(responseGet.status).toBe(404);
    })

    test("delete: deleteBuchung: Wiederkehrendebuchung Buchung Einzahlung", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung",
            intervall: "monat"
        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
        expect(responseCreate.status).toBe(201);

        const responseDelete = await testee.delete(`/api/buchung/${responseCreate.body.id}`).set("token", cookie);
        expect(responseDelete.status).toBe(204);

        const responseGet = await testee.get(`/api/buchung/${responseCreate.body.id}`);
        expect(responseGet.status).toBe(404);
    })

    test("delete: deleteBuchung: Wiederkehrendebuchung Buchung Ausgabe", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            intervall: "monat"
        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
        expect(responseCreate.status).toBe(201);

        const responseDelete = await testee.delete(`/api/buchung/${responseCreate.body.id}`).set("token", cookie);
        expect(responseDelete.status).toBe(204);

        const responseGet = await testee.get(`/api/buchung/${responseCreate.body.id}`);
        expect(responseGet.status).toBe(404);
    })

    test("delete: deleteBuchung: Uebertrag Einzahlung: Fehler", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung",
            zielPocket: pocket2.id
        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
        expect(responseCreate.status).toBe(400);
    })

    test("delete: deleteBuchung: Uebertrag Auszahlung", async () => {
        const buchung: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            zielPocket: pocket2.id
        }
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const responseCreate = await testee.post(`/api/buchung`).set("token", cookie).send(buchung);
        expect(responseCreate.status).toBe(201);

        const responseDelete = await testee.delete(`/api/buchung/${responseCreate.body.id}`).set("token", cookie);
        expect(responseDelete.status).toBe(204);

        const responseGet = await testee.get(`/api/buchung/${responseCreate.body.id}`);
        expect(responseGet.status).toBe(404);
    })

    test("delete: deleteBuchung: Buchung existiert nicht", async () => {
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login/").send({ email: "example@email.com", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const responseGet = await testee.delete(`/api/buchung/${NON_EXISTING_ID}`).set("token", cookie);
        expect(responseGet.status).toBe(404);
        expect(responseGet.body.errors[0].msg).toBe("keine Buchung mit dieser Id gefunden");
    })
})

test("get einnahmen/ausgaben einzeln", async () => {
    const benutzer = await Benutzer.create({
        email: "example@email.com",
        name: "Test",
        password: "1234abcdABCD..;,.",
        active: true
    });
    const pocket = await Pocket.create({
        name: "TestPocket",
        betrag: 1000,
        benutzer: benutzer.id
    })
    const kategorie = await Buchungskategorie.create({
        name: "TestKategorie",
        benutzer: benutzer.id
    })
    await createBuchung({
        name: "TestBuchung",
        pocket: pocket.id,
        kategorie: kategorie.id,
        datum: "22.10.2024",
        betrag: 50,
        typ: "einzahlung"
    })
    await createBuchung({
        name: "TestBuchung",
        pocket: pocket.id,
        kategorie: kategorie.id,
        datum: "23.10.2024",
        betrag: 50,
        typ: "einzahlung"
    })
    await createBuchung({
        name: "TestBuchung",
        pocket: pocket.id,
        kategorie: kategorie.id,
        datum: "22.10.2024",
        betrag: 50,
        typ: "ausgabe"
    })
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: "1234abcdABCD..;,." });
    const cookie = loginResponse.body.token
    let response = await testee.get("/api/buchung/einnahmen").set("token", cookie).send({ userId: benutzer.id })
    expect(response.status).toBe(200)
    expect(response.body.length).toBe(2)
    response = await testee.get("/api/buchung/ausgaben").set("token", cookie).send({ userId: benutzer.id })
    expect(response.status).toBe(200)
    expect(response.body.length).toBe(1)
})