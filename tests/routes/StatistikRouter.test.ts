
import { createBenutzer } from "../../src/services/BenutzerService"
import { BenutzerResource, BuchungskategorieResource, PocketResource } from "../../src/Resources"
import { createBuchungsKategorie } from "../../src/services/BuchungskategorieService"
import { createBuchung } from "../../src/services/BuchungService"
import { createPocket } from "../../src/services/PocketService"
import { dateToString } from "../../src/services/ServiceHelper"
import { Benutzer } from "../../src/models/BenutzerModel"
import supertest from "supertest"
import app from "../../src/jestApp";
import { getAnzahlBuchungen, getAusgaben12Monate, getAusgaben4Wochen, getAusgabenAlleJahre, getAusgabenMonat, getAusgabenWoche, getEinahmenMonat, getEinahmenWoche, getGesamtvermoegen, jahresAusgabenKat, katAusgabenLimit, monatsAusgabenKat, wochenAusgabenKat } from "../../src/services/StatistikService"

let benutzer: BenutzerResource
const passwort = "abcACB123_"
let pocket: PocketResource
let kategorie: BuchungskategorieResource

beforeEach(async () => {

    benutzer = await createBenutzer({ name: "Bruno", email: "test@mail.de", password: passwort })
    await Benutzer.updateOne({ email: benutzer.email }, { active: true })
    pocket = await createPocket({ name: "testPocket", benutzer: benutzer.id!, betrag: 0 })
    kategorie = await createBuchungsKategorie({ name: "testkat", benutzer: benutzer.id! })
    const datum = new Date()
    const datumString = dateToString(datum)
    const monat = datum.getMonth() + 1
    const jahr = datum.getFullYear()
    await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeWoche", datum: datumString, betrag: 50, typ: "einzahlung" })
    await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeWoche2", datum: datumString, betrag: 150, typ: "einzahlung" })
    await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeWoche", datum: `01.${monat}.${jahr}`, betrag: 75, typ: "einzahlung" })
    await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeJahr", datum: `01.01.${jahr}`, betrag: 100, typ: "einzahlung" })
    await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeAlt", datum: "10.10.2023", betrag: 50, typ: "einzahlung" })
    await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "ausgabe1", datum: datumString, betrag: 50, typ: "ausgabe" })
    await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "ausgabe2", datum: datumString, betrag: 100, typ: "ausgabe" })
    await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "ausgabeMonat", datum: `01.${monat}.${jahr}`, betrag: 75, typ: "ausgabe" })
    await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "ausgabeJahr", datum: `01.01.${jahr}`, betrag: 100, typ: "ausgabe" })
    await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "ausgabeAlt", datum: "01.11.2023", betrag: 100, typ: "ausgabe" })

})



test("get einahmen Woche", async () => {
    const testee = supertest(app)
    const einnahmen = await getEinahmenWoche(benutzer.id!)
    // const loginResponse = await testee.post("/api/login/").send({ email: "test@mail.de", password: "abc123_ABC" });
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const response = await testee.get("/api/statistik/einnahmenWoche").set("token", cookie)
    expect(response.status).toBe(200);
    expect(response.body.value).toBe(einnahmen)
})

test("get ausgaben Woche", async () => {
    const ausgaben = await getAusgabenWoche(benutzer.id!)
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const response = await testee.get("/api/statistik/ausgabenWoche").set("token", cookie)
    expect(response.status).toBe(200);
    expect(response.body.value).toBe(ausgaben)
})

test("get einahmen Monat", async () => {
    const einnahmen = await getEinahmenMonat(benutzer.id!)
    const testee = supertest(app)
    // const loginResponse = await testee.post("/api/login/").send({ email: "test@mail.de", password: "abc123_ABC" });
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const response = await testee.get("/api/statistik/einnahmenMonat").set("token", cookie)
    expect(response.status).toBe(200);
    expect(response.body.value).toBe(einnahmen)
})

test("get ausgaben Monat", async () => {
    const ausgaben = await getAusgabenMonat(benutzer.id!)
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const response = await testee.get("/api/statistik/ausgabenMonat").set("token", cookie)
    expect(response.status).toBe(200);
    expect(response.body.value).toBe(ausgaben)
})

test("get einahmen Jahr", async () => {
    const testee = supertest(app)
    // const loginResponse = await testee.post("/api/login/").send({ email: "test@mail.de", password: "abc123_ABC" });
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const response = await testee.get("/api/statistik/einnahmenJahr").set("token", cookie)
    expect(response.status).toBe(200);
    expect(response.body.value).toBe(375)
})

test("get ausgaben Jahr", async () => {
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const response = await testee.get("/api/statistik/ausgabenJahr").set("token", cookie)
    expect(response.status).toBe(200);
    expect(response.body.value).toBe(325)
})

test("get einahmen ", async () => {
    const testee = supertest(app)
    // const loginResponse = await testee.post("/api/login/").send({ email: "test@mail.de", password: "abc123_ABC" });
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const response = await testee.get("/api/statistik/alleEinnahmen").set("token", cookie)
    expect(response.status).toBe(200);
    expect(response.body.value).toBe(425)
})

test("get ausgaben ", async () => {
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const response = await testee.get("/api/statistik/alleAusgaben").set("token", cookie)
    expect(response.status).toBe(200);
    expect(response.body.value).toBe(425)
})

test("get prozent", async () => {
    const pocket1 = await createPocket({ name: "testPocket1", benutzer: benutzer.id!, betrag: 99 })
    const pocket2 = await createPocket({ name: "testPocket2", benutzer: benutzer.id!, betrag: 451 })
    const pocket3 = await createPocket({ name: "testPocket3", benutzer: benutzer.id!, betrag: 250 })
    const pocket4 = await createPocket({ name: "testPocket4", benutzer: benutzer.id!, betrag: 200 })

    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const response = await testee.get(`/api/statistik/pocketProzent`).set("token", cookie)
    expect(response.status).toBe(200);
    // Die erwarteten Ergebnisse basieren auf den Beträgen
    const expected = {
        [pocket.id!]: 0, // Anteil von pocket1
        [pocket1.id!]: 99 * 100 / (99 + 451 + 250 + 200), // Anteil von pocket1
        [pocket2.id!]: 451 * 100 / (99 + 451 + 250 + 200), // Anteil von pocket2
        [pocket3.id!]: 250 * 100 / (99 + 451 + 250 + 200), // Anteil von pocket1
        [pocket4.id!]: 200 * 100 / (99 + 451 + 250 + 200), // Anteil von pocket2

    };

    // Antwort-Daten prüfen
    const received = response.body; // Geht davon aus, dass `Object.fromEntries` ein Objekt liefert
    expect(received).toEqual(expected);
})

test("get ausgaben Wochen", async () => {
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const ausgaben = await getAusgaben4Wochen(benutzer.id!)
    const response = await testee.get("/api/statistik/wochenAusgaben").set("token", cookie)
    expect(response.status).toBe(200);
    expect(response.body.wochen).toEqual(ausgaben[0])
    expect(response.body.values).toEqual(ausgaben[1])
})

test("get ausgaben Monate", async () => {
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const ausgaben = await getAusgaben12Monate(benutzer.id!)
    const response = await testee.get("/api/statistik/monateAusgaben").set("token", cookie)
    expect(response.status).toBe(200);
    expect(response.body.wochen).toEqual(ausgaben[0])
    expect(response.body.values).toEqual(ausgaben[1])
})

test("get ausgaben Jahre", async () => {
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const ausgaben = await getAusgabenAlleJahre(benutzer.id!)
    const response = await testee.get("/api/statistik/jahreAusgaben").set("token", cookie)
    expect(response.status).toBe(200);
    expect(response.body.wochen).toEqual(ausgaben[0])
    expect(response.body.values).toEqual(ausgaben[1])
})

test("get anzahl buchungen pro kat", async () => {
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const anzahl = await getAnzahlBuchungen(benutzer.id!)
    const response = await testee.get("/api/statistik/anzahlBuchungen").set("token", cookie)
    const resmap = new Map(Object.entries(response.body))
    expect(response.status).toBe(200);
    expect(resmap.get(kategorie.id!)).toBe(anzahl.get(kategorie.id!))
})


test("get gesamtvermoegen", async () => {
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const vermoegen = await getGesamtvermoegen(benutzer.id!)
    const response = await testee.get("/api/statistik/gesamtvermoegen").set("token", cookie)
    expect(response.status).toBe(200);
    expect(response.body.value).toBe(vermoegen)
})

test("KategorieAusgaben Woche", async () => {
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const map = await wochenAusgabenKat(benutzer.id!)
    const response = await testee.get("/api/statistik/kategorieAusgaben/woche").set("token", cookie)
    const resmap = new Map(Object.entries(response.body))
    expect(response.status).toBe(200);
    expect(resmap).toEqual(map)
})

test("KategorieAusgaben Monat", async () => {
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const map = await monatsAusgabenKat(benutzer.id!)
    const response = await testee.get("/api/statistik/kategorieAusgaben/monat").set("token", cookie)
    const resmap = new Map(Object.entries(response.body))
    expect(response.status).toBe(200);
    expect(resmap).toEqual(map)
})

test("KategorieAusgaben Jahr", async () => {
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const map = await jahresAusgabenKat(benutzer.id!)
    const response = await testee.get("/api/statistik/kategorieAusgaben/jahr").set("token", cookie)
    const resmap = new Map(Object.entries(response.body))
    expect(response.status).toBe(200);
    expect(resmap).toEqual(map)
})

test("KategorieLimitAusgaben", async () => {
    const testee = supertest(app)
    const loginResponse = await testee.post("/api/login/").send({ email: benutzer.email, password: passwort })
    const cookie = loginResponse.body.token
    const map = await katAusgabenLimit(benutzer.id!)
    const response = await testee.get("/api/statistik/kategorieLimitAusgaben").set("token", cookie)
    const resmap = new Map(Object.entries(response.body))
    expect(response.status).toBe(200);
    expect(resmap).toEqual(map)
})