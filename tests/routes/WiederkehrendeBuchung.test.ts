import { createBuchung } from "../../src/services/BuchungService";
import { Benutzer } from "../../src/models/BenutzerModel";
import { BuchungResource } from "../../src/Resources";
import { dateToString } from "../../src/services/ServiceHelper";
import { Pocket } from "../../src/models/PocketModel";
import { Buchungskategorie } from "../../src/models/BuchungskategorieModel";
import { EinmaligeBuchung } from "../../src/models/EinmaligeBuchungModel";
import { WiederkehrendeBuchung } from "../../src/models/WiederkehrendeBuchungModel";
import { add, sub } from "date-fns";
import app from "../../src/jestApp";
import supertest from "supertest";

let benutzer: any;
let pock: any;
let kat: any;

beforeEach(async () => {
    benutzer = await Benutzer.create({ name: "Dima", email: "dima@riffel.de", password: "passWORT_123", active: true });
    pock = await Pocket.create({ name: "pocket", benutzer: benutzer._id, betrag: 100 });
    kat = await Buchungskategorie.create({ name: "kategorie", benutzer: benutzer._id });
})

test("wiederkehrende month test", async () => {
    expect(benutzer).toBeDefined();
    expect(pock).toBeDefined();
    expect(kat).toBeDefined();

    // date one month ago
    const date = sub(new Date(Date.now()), { months: 1 });
    // date one month in the future, as monthly is the intervall
    const newDate = add(date, { months: 1 });

    const resource: BuchungResource = {
        name: "buchung",
        pocket: pock.id,
        kategorie: kat.id,
        betrag: 10,
        datum: dateToString(date),
        intervall: "monat",
        typ: "ausgabe"
    }

    const created = await createBuchung(resource);
    expect(created).toBeDefined();

    // Checking in models
    const einmaligFind = await EinmaligeBuchung.findOne({ name: "buchung" }).exec();
    expect(einmaligFind).toBeDefined();
    expect(einmaligFind?.name).toBe("buchung");
    const wiederkehrendFind = await WiederkehrendeBuchung.findOne({ name: "buchung" }).exec();
    expect(wiederkehrendFind).toBeDefined();
    expect(wiederkehrendFind?.name).toBe("buchung");

    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token

    const response = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(response.status).toBe(200);

    const alleWiederkehrende = await testee.get("/api/buchung/wiederkehrend").set("token", cookie);
    expect(alleWiederkehrende.status).toBe(200);
    expect(alleWiederkehrende.body).toBeDefined();
    expect(alleWiederkehrende.body.length).toBe(1);
    expect(alleWiederkehrende.body[0].datum).toBe(dateToString(newDate));

    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(2);
    expect(alleBuchungen.body[0].fromWiederkehrend).toBe(true);
    expect(alleBuchungen.body[1].fromWiederkehrend).toBe(true);
})

test("wiederkehrende day test", async () => {
    expect(benutzer).toBeDefined();
    expect(pock).toBeDefined();
    expect(kat).toBeDefined();

    // date one month ago
    const date = sub(new Date(Date.now()), { days: 1 });

    const resource: BuchungResource = {
        name: "buchung",
        pocket: pock.id,
        kategorie: kat.id,
        betrag: 10,
        datum: dateToString(date),
        intervall: "tag",
        typ: "ausgabe"
    }

    const created = await createBuchung(resource);
    expect(created).toBeDefined();

    // Checking in models
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token

    const alleWiederkehrende = await testee.get("/api/buchung/wiederkehrend").set("token", cookie);
    expect(alleWiederkehrende.status).toBe(200);
    expect(alleWiederkehrende.body).toBeDefined();
    expect(alleWiederkehrende.body.length).toBe(1);

    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(2);
})
test("wiederkehrende day test, 7 days", async () => {
    expect(benutzer).toBeDefined();
    expect(pock).toBeDefined();
    expect(kat).toBeDefined();

    // date one month ago
    const date = sub(new Date(Date.now()), { days: 7 });
    // daily booking, so tomorrow should be the new date
    const newDate = new Date(Date.now());

    const resource: BuchungResource = {
        name: "buchung",
        pocket: pock.id,
        kategorie: kat.id,
        betrag: 10,
        datum: dateToString(date),
        intervall: "tag",
        typ: "ausgabe"
    }

    const created = await createBuchung(resource);
    expect(created).toBeDefined();

    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token

    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(8);

    const alleWiederkehrende = await testee.get("/api/buchung/wiederkehrend").set("token", cookie);
    expect(alleWiederkehrende.status).toBe(200);
    expect(alleWiederkehrende.body).toBeDefined();
    expect(alleWiederkehrende.body.length).toBe(1);
    expect(alleWiederkehrende.body[0].datum).toBe(dateToString(newDate));
})

test("wiederkehrende week test", async () => {
    expect(benutzer).toBeDefined();
    expect(pock).toBeDefined();
    expect(kat).toBeDefined();

    // date one month ago
    const date = sub(new Date(Date.now()), { weeks: 1 });

    const resource: BuchungResource = {
        name: "buchung",
        pocket: pock.id,
        kategorie: kat.id,
        betrag: 10,
        datum: dateToString(date),
        intervall: "woche",
        typ: "ausgabe"
    }

    const created = await createBuchung(resource);
    expect(created).toBeDefined();

    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token

    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(2);
})
test("wiederkehrende week test, fetch a few days after week started", async () => {
    expect(benutzer).toBeDefined();
    expect(pock).toBeDefined();
    expect(kat).toBeDefined();

    // date one week and 3 days ago, to simulate a login a few days after the week started
    const date = sub(new Date(Date.now()), { weeks: 1, days: 3 });

    const resource: BuchungResource = {
        name: "buchung",
        pocket: pock.id,
        kategorie: kat.id,
        betrag: 10,
        datum: dateToString(date),
        intervall: "woche",
        typ: "ausgabe"
    }

    const created = await createBuchung(resource);
    expect(created).toBeDefined();

    // Checking in models
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token

    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(2);
})
test("wiederkehrende week test, after 4 weeks passed", async () => {
    expect(benutzer).toBeDefined();
    expect(pock).toBeDefined();
    expect(kat).toBeDefined();

    // date 4 weeks ago
    const date = sub(new Date(Date.now()), { weeks: 4 });

    const resource: BuchungResource = {
        name: "buchung",
        pocket: pock.id,
        kategorie: kat.id,
        betrag: 10,
        datum: dateToString(date),
        intervall: "woche",
        typ: "ausgabe"
    }

    const created = await createBuchung(resource);
    expect(created).toBeDefined();

    // Checking in models
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token

    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(5);
})
test("wiederkehrende week test, after 3.5 weeks passed", async () => {
    expect(benutzer).toBeDefined();
    expect(pock).toBeDefined();
    expect(kat).toBeDefined();

    // date 4 weeks ago
    const date = sub(new Date(Date.now()), { weeks: 3, days: 3 });

    const resource: BuchungResource = {
        name: "buchung",
        pocket: pock.id,
        kategorie: kat.id,
        betrag: 10,
        datum: dateToString(date),
        intervall: "woche",
        typ: "ausgabe"
    }

    const created = await createBuchung(resource);
    expect(created).toBeDefined();

    // Checking in models
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token

    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(4);
})

test("wiederkehrende 14 days test", async () => {
    expect(benutzer).toBeDefined();
    expect(pock).toBeDefined();
    expect(kat).toBeDefined();

    // date one month ago
    const date = sub(new Date(Date.now()), { weeks: 2 });

    const resource: BuchungResource = {
        name: "buchung",
        pocket: pock.id,
        kategorie: kat.id,
        betrag: 10,
        datum: dateToString(date),
        intervall: "vierzehnTage",
        typ: "ausgabe"
    }

    const created = await createBuchung(resource);
    expect(created).toBeDefined();

    // Checking in models
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token

    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(2);
})
test("wiederkehrende quartal test", async () => {
    expect(benutzer).toBeDefined();
    expect(pock).toBeDefined();
    expect(kat).toBeDefined();

    // date one month ago
    const date = sub(new Date(Date.now()), { months: 3 });

    const resource: BuchungResource = {
        name: "buchung",
        pocket: pock.id,
        kategorie: kat.id,
        betrag: 10,
        datum: dateToString(date),
        intervall: "quartal",
        typ: "ausgabe"
    }

    const created = await createBuchung(resource);
    expect(created).toBeDefined();

    // Checking in models
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token

    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(2);
})
test("wiederkehrende halbes jahr test", async () => {
    expect(benutzer).toBeDefined();
    expect(pock).toBeDefined();
    expect(kat).toBeDefined();

    // date one month ago
    const date = sub(new Date(Date.now()), { months: 6 });

    const resource: BuchungResource = {
        name: "buchung",
        pocket: pock.id,
        kategorie: kat.id,
        betrag: 10,
        datum: dateToString(date),
        intervall: "halbesJahr",
        typ: "ausgabe"
    }

    const created = await createBuchung(resource);
    expect(created).toBeDefined();

    // Checking in models
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token

    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(2);
})
test("wiederkehrende jahr test", async () => {
    expect(benutzer).toBeDefined();
    expect(pock).toBeDefined();
    expect(kat).toBeDefined();

    // date one month ago
    const date = sub(new Date(Date.now()), { months: 12 });

    const resource: BuchungResource = {
        name: "buchung",
        pocket: pock.id,
        kategorie: kat.id,
        betrag: 10,
        datum: dateToString(date),
        intervall: "jahr",
        typ: "ausgabe"
    }

    const created = await createBuchung(resource);
    expect(created).toBeDefined();

    // Checking in models
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token

    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(2);
})
test("wiederkehrende no buchung", async () => {
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token
    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(0);
})
test("wiederkehrende no wiederkehrende buchung, 1 normal", async () => {
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({ email: "dima@riffel.de", password: "passWORT_123" });
    const cookie = loginResponse.body.token
    await testee.post("/api/buchung").send({
        name: "buchung",
        pocket: pock.id,
        kategorie: kat.id,
        betrag: 10,
        datum: dateToString(new Date(Date.now())),
        typ: "ausgabe"
    }).set("token", cookie);
    const alleBuchungen = await testee.get("/api/buchung/alle").set("token", cookie);
    expect(alleBuchungen.status).toBe(200);
    expect(alleBuchungen.body.length).toBe(1);
})