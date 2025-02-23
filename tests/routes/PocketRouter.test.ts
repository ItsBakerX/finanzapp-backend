import app from "../../src/jestApp";
import supertest from "supertest";
import { createBenutzer } from "../../src/services/BenutzerService";
import { createPocket, getPocket } from "../../src/services/PocketService";
import { NON_EXISTING_ID } from "../../tests/model/BuchungskategorieModel.test";
import { Benutzer } from "../../src/models/BenutzerModel";
import { PocketResource } from "../../src/Resources";
import { createBuchungsKategorie } from "../../src/services/BuchungskategorieService";
import { createBuchung, getAlleBuchungen, getAlleBuchungenBenutzer } from "../../src/services/BuchungService";

describe("PocketRouter", () => {

    let benutzerid: string

    beforeEach(async () => {
        const benutzer = await createBenutzer({
            name: "Dima",
            email: "dima@riffel.de",
            password: "1234abcdABCD..;,."
        })
        await Benutzer.updateOne({ email: "dima@riffel.de" }, { active: true })
        benutzerid = benutzer.id!
    });

    test("GET /alle", async () => {
        await createPocket({
            name: "TestPocket",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        })
        // Login
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get("/api/pocket/alle").set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body.length).toBe(1)
    });

    test("GET /:id", async () => {
        const pocket = await createPocket({
            name: "TestPocket",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/pocket/${pocket.id}`).send({ userId: benutzerid }).set("token", cookie);
        expect(response.status).toBe(200)
        expect(response.body.name).toBe("TestPocket")
    });

    test("GET /:id - not found", async () => {
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.get(`/api/pocket/${NON_EXISTING_ID}`).send({ userId: benutzerid }).set("token", cookie);
        expect(response.status).toBe(404)
    });

    test("DELETE /:id", async () => {
        const pocket = await createPocket({
            name: "TestPocket",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.delete(`/api/pocket/${pocket.id}`)
            .send({ userId: benutzerid }).set("token", cookie);
        expect(response.status).toBe(204)
    });

    test("DELETE /:id deleteBuchungen", async () => {
        const pocket = await createPocket({
            name: "TestPocket",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        })
        const kat = await createBuchungsKategorie({
            name: "TestKat",
            benutzer: benutzerid
        })
        const buchung = await createBuchung({
            name: "testBuchung",
            kategorie: kat.id!,
            pocket: pocket.id!,
            betrag: 200,
            typ: "ausgabe",
            datum: "12.12.2012"
        })
        const alleBuchungen = await getAlleBuchungenBenutzer(benutzerid)
        expect(alleBuchungen).toHaveLength(1)
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.delete(`/api/pocket/${pocket.id}`)
            .send({ userId: benutzerid, deleteBuchungen: true }).set("token", cookie);
        expect(response.status).toBe(204)
        const alleBuchungenafterDelete = await getAlleBuchungenBenutzer(benutzerid)
        expect(alleBuchungenafterDelete).toHaveLength(0)
    });

    test("DELETE /:id - not found", async () => {
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.delete(`/api/pocket/${NON_EXISTING_ID}`)
            .send({ userId: benutzerid }).set("token", cookie);
        expect(response.status).toBe(404)
    });

    test("POST /", async () => {
        const testee = supertest(app)

        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post("/api/pocket").send({
            name: "TestPocket",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        }).set("token", cookie);
        expect(response.status).toBe(201)
        expect(response.body.name).toBe("TestPocket")
    });

    test("POST / - benutzer not found", async () => {
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.post("/api/pocket").send({
            name: "TestPocket",
            benutzer: NON_EXISTING_ID,
            betrag: "100",
            notiz: "TestNotiz"
        }).set("token", cookie);
        expect(response.status).toBe(404)
        expect(response.body.errors[0].msg).toBe("Benutzer existiert nicht");
    });

    test("PUT /:id Namen ändern", async () => {
        const pocket = await createPocket({
            name: "TestPocket",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.put(`/api/pocket/${pocket.id}`).send({
            name: "NeuerName",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        }).set("token", cookie);
        expect(response.status).toBe(200)
        expect(response.body.name).toBe("NeuerName")
        const found = await getPocket(pocket.id!)
        expect(found.name).toBe("NeuerName")
        expect(found.notiz).toBe("TestNotiz")
    })

    test("PUT /:id Notiz ändern", async () => {
        const pocket = await createPocket({
            name: "TestPocket",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.put(`/api/pocket/${pocket.id}`).send({
            notiz: "NeueNotiz",
            betrag: pocket.betrag,
            name: "TestPocket",
            benutzer: benutzerid,
        }).set("token", cookie);
        expect(response.status).toBe(200)
        expect(response.body.name).toBe("TestPocket")
        expect(response.body.notiz).toBe("NeueNotiz")
        const found = await getPocket(pocket.id!)
        expect(found.notiz).toBe("NeueNotiz")
    })

    test("PUT /:id Notiz und Name ändern", async () => {
        const pocket = await createPocket({
            name: "TestPocket",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.put(`/api/pocket/${pocket.id}`).send({
            name: "NeuerName",
            notiz: "NeueNotiz",
            benutzer: benutzerid,
            betrag: 100,
        }).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body).toMatchObject({
            name: "NeuerName",
            notiz: "NeueNotiz"
        })
    })

    test("PUT /:id keine Änderung", async () => {
        const pocket = await createPocket({
            name: "TestPocket",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.put(`/api/pocket/${pocket.id}`).send({
            name: "TestPocket",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        }).set("token", cookie)
        expect(response.status).toBe(200)
        expect(response.body).toMatchObject({
            name: "TestPocket",
            notiz: "TestNotiz"
        })
    })

    test("PUT /:id Update zum Namen einer vorhandenen Pocket", async () => {
        const pocket1 = await createPocket({
            name: "TestPocket",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        })
        const pocket2 = await createPocket({
            name: "AnderesTestPocket",
            benutzer: benutzerid,
            betrag: 100,
            notiz: "TestNotiz"
        })
        const testee = supertest(app)
        const loginResponse = await testee.post("/api/login/").send({ email: "dima@riffel.de", password: "1234abcdABCD..;,." });
        const cookie = loginResponse.body.token
        const response = await testee.put(`/api/pocket/${pocket1.id}`).send({
            name: "AnderesTestPocket",
        }).set("token", cookie);
        expect(response.status).toBe(400)
    })
});