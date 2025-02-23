import { Benutzer } from "../../src/models/BenutzerModel";
import app from "../../src/jestApp";
import supertest from "supertest";
import { Sparziel } from "../../src/models/SparzielModel";
import { dateToString, stringToDate } from "../../src/services/ServiceHelper";
import exp from "constants";
import { createSparziel } from "../../src/services/SparzielService";
import { add, sub } from "date-fns"

test("Sparziel get /alle, nicht authentifiziert", async () => {
    const testee = supertest(app);
    const response = await testee.get("/api/sparziel/alle");
    expect(response.status).toBe(401);
})

test("Sparziel get /alle, authentifiziert, keine Sparziele", async () => {
    await Benutzer.create({
        name: "Dima", email: "dima@riffel.de", password: "passWORT_123", active: true
    })
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    });
    const cookie = loginResponse.body.token
    const response = await testee.get("/api/sparziel/alle").set("token", cookie);
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
})

test("Sparziel get /alle, authentifiziert, 2 Sparziele", async () => {
    const b = await Benutzer.create({
        name: "Dima", email: "dima@riffel.de", password: "passWORT_123", active: true
    })
    await Sparziel.create({
        name: "Urlaub", benutzer: b.id, betrag: 0, zielbetrag: 1000
    })
    await Sparziel.create({
        name: "Auto", benutzer: b.id, betrag: 20, zielbetrag: 800
    })
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    });
    const cookie = loginResponse.body.token

    const response = await testee.get("/api/sparziel/alle").set("token", cookie);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject([
        { name: "Urlaub", benutzer: b.id, betrag: 0, zielbetrag: 1000 },
        { name: "Auto", benutzer: b.id, betrag: 20, zielbetrag: 800 }
    ])
})

test("Sparziel get /:id, nicht authentifiziert", async () => {
    const testee = supertest(app);
    const response = await testee.get("/api/sparziel/123");
    expect(response.status).toBe(401);
})

test("Sparziel get /:id, authentifiziert, ungültige ID", async () => {
    await Benutzer.create({
        name: "Dima", email: "dima@riffel.de", password: "passWORT_123", active: true
    })
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    });
    const cookie = loginResponse.body.token
    const response = await testee.get("/api/sparziel/123").set("token", cookie);
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject([{ value: "123", msg: "Invalid value", path: "id", location: "params" }])
});

test("Sparziel get /:id, authentifiziert, ID nicht gefunden", async () => {
    await Benutzer.create({
        name: "Dima", email: "dima@riffel.de", password: "passWORT_123", active: true
    })
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    });
    const cookie = loginResponse.body.token
    const response = await testee.get("/api/sparziel/123456789012345678901234").set("token", cookie);
    expect(response.status).toBe(400);
});

test("Sparziel get /:id, authentifiziert, Sparziel gefunden", async () => {
    const b = await Benutzer.create({
        name: "Dima", email: "dima@riffel.de", password: "passWORT_123", active: true
    })
    const s = await Sparziel.create({
        name: "Urlaub", benutzer: b.id, betrag: 0, zielbetrag: 1000
    })
    const testee = supertest(app);
    // login
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    });
    const cookie = loginResponse.body.token
    const response = await testee.get(`/api/sparziel/${s.id}`).set("token", cookie);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: "Urlaub", benutzer: b.id, betrag: 0, zielbetrag: 1000 })
});

test("Sparziel post, nicht authentifiziert", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true })
    const testee = supertest(app);
    const response = await testee.post("/api/sparziel").send({
        name: "Urlaub", benutzer: b.id, betrag: 0, zielbetrag: 1000
    });
    expect(response.status).toBe(401);
})
test("Sparziel post, succesful authentifiziert", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true })
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    });
    const cookie = loginResponse.body.token
    const response = await testee.post("/api/sparziel").send({
        name: "Urlaub", benutzer: b.id, betrag: 0, zielbetrag: 1000
    }).set("token", cookie);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: "Urlaub", benutzer: b.id, betrag: 0, zielbetrag: 1000 })
})
test("Sparziel post, validation error not numeric", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true })
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    });
    const cookie = loginResponse.body.token
    const response = await testee.post("/api/sparziel").send({
        name: "Urlaub", benutzer: b.id, betrag: "abc", zielbetrag: "1000"
    }).set("token", cookie);
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject([{ value: "abc", msg: "Invalid value", path: "betrag", location: "body" }])
})
test("Sparziel delete, nicht authentifiziert", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true })
    const s = await Sparziel.create({ name: "Urlaub", benutzer: b.id, betrag: 0, zielbetrag: 1000 })
    const testee = supertest(app);
    const response = await testee.delete(`/api/sparziel/${s.id}`);
    expect(response.status).toBe(401);
})
test("Sparziel delete, authentifiziert", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true })
    const s = await Sparziel.create({ name: "Urlaub", benutzer: b.id, betrag: 0, zielbetrag: 1000 })
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    });
    const cookie = loginResponse.body.token
    const response = await testee.delete(`/api/sparziel/${s.id}`).set("token", cookie);
    expect(response.status).toBe(204);
})
test("Sparziel delete, param ist nicht mongoid", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true })
    const s = await Sparziel.create({ name: "Urlaub", benutzer: b.id, betrag: 0, zielbetrag: 1000 })
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    });
    const cookie = loginResponse.body.token
    const response = await testee.delete(`/api/sparziel/0000000000000000`).set("token", cookie);
    expect(response.status).toBe(400);
})
test("Sparziel delete, param ist nicht mongoid alphabetisch", async () => {
    const b = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true })
    const s = await Sparziel.create({ name: "Urlaub", benutzer: b.id, betrag: 0, zielbetrag: 1000 })
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    });
    const cookie = loginResponse.body.token
    const response = await testee.delete(`/api/sparziel/awrawgawegwfa`).set("token", cookie);
    expect(response.status).toBe(400);
})

describe('PUT /api/sparziel/:id', () => {
    let benutzerId: string;
    let sparzielId: string;
    let cookie: string;

    beforeAll(async () => {
        // Create a user and a savings goal
        const benutzer = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
        benutzerId = benutzer.id;
        const sparziel = await Sparziel.create({ name: "Urlaub", benutzer: benutzerId, betrag: 0, zielbetrag: 1000 });
        sparzielId = sparziel.id;

        // Log in to get the authentication cookie
        const testee = supertest(app);
        const loginResponse = await testee.post("/api/login").send({
            email: "dima@riffel.de", password: "passWORT_123"
        });
        cookie = loginResponse.body.token
    });

    test('should update sparziel successfully', async () => {
        const testee = supertest(app);
        const response = await testee.put(`/api/sparziel/${sparzielId}`)
            .set("token", cookie)
            .send({
                benutzer: benutzerId,
                name: "Updated Urlaub",
                betrag: 500,
                zielbetrag: 1500,
                faelligkeitsdatum: "22.10.2023"
            });

        expect(response.status).toBe(200);
        expect(response.body.name).toBe("Updated Urlaub");
        expect(response.body.betrag).toBe(500);
        expect(response.body.zielbetrag).toBe(1500);
        expect(response.body.faelligkeitsdatum).toBe("22.10.2023");
    });


    test('update sparziel different benutzer', async () => {
        const benutzer2 = await Benutzer.create({ email: "riffel@dima.com", name: "Dima", password: "passWORT_1234", active: true });
        const testee = supertest(app);
        const response = await testee.put(`/api/sparziel/${sparzielId}`)
            .set("token", cookie)
            .send({
                benutzer: benutzer2.id,
                name: "Updated Urlaub",
                betrag: 500,
                zielbetrag: 1500
            });
        expect(response.status).toBe(400);
    });

    test('should return 400 for invalid sparziel id', async () => {
        const testee = supertest(app);
        const response = await testee.put(`/api/sparziel/invalid-id`)
            .set("token", cookie)
            .send({
                benutzer: benutzerId,
                name: "Updated Urlaub",
                betrag: 500,
                zielbetrag: 1500
            });

        expect(response.status).toBe(400);
    });

    test('should return 400 for non-existent sparziel id', async () => {
        const testee = supertest(app);
        const response = await testee.put(`/api/sparziel/60c72b2f9b1d8b3a4c8e4d2f`)
            .set("token", cookie)
            .send({
                benutzer: benutzerId,
                name: "Updated Urlaub",
                betrag: 500,
                zielbetrag: 1500
            });

        expect(response.status).toBe(400);
    });

    test('should return 401 for unauthorized user', async () => {
        const testee = supertest(app);
        const response = await testee.put(`/api/sparziel/${sparzielId}`)
            .send({
                benutzer: benutzerId,
                name: "Updated Urlaub",
                betrag: 500,
                zielbetrag: 1500
            });

        expect(response.status).toBe(401);
    });
});

test('updating sparziel only datum ', async () => {
    const benutzer = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
    const sparziel = await Sparziel.create({ name: "Urlaub", benutzer: benutzer.id, betrag: 0, zielbetrag: 1000 });
    expect(sparziel.faelligkeitsdatum).toBeUndefined();
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    })
    const cookie = loginResponse.body.token
    const response = await testee.put(`/api/sparziel/${sparziel.id}`)
        .set("token", cookie)
        .send({
            benutzer: benutzer.id,
            faelligkeitsdatum: "22.10.2023"
        });

    expect(response.status).toBe(200);
    expect(response.body.faelligkeitsdatum).toBe("22.10.2023");
    expect(response.body.name).toBe("Urlaub");
    expect(response.body.betrag).toBe(0);
    expect(response.body.zielbetrag).toBe(1000);
    const sparzielMongo = await Sparziel.findOne({ _id: sparziel.id });
    expect(sparzielMongo).toBeDefined();
    expect(sparzielMongo!.faelligkeitsdatum).toEqual(stringToDate("22.10.2023"));

});

test('get faelligkeit heute ', async () => {
    const benutzer = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
    const sparziel = await createSparziel({
        name: "Sparziel1",
        benutzer: benutzer.id!,
        notiz: "Notiz",
        betrag: 100,
        zielbetrag: 1000,
        faelligkeitsdatum: dateToString(new Date())
    });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    })
    const cookie = loginResponse.body.token
    const response = await testee.get(`/api/sparziel/${sparziel.id}/faelligkeitTage`)
        .set("token", cookie)
        .send();

    expect(response.status).toBe(200);
    expect(response.body.value).toBe(0);
});

test('get faelligkeit null ', async () => {
    const benutzer = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
    const sparziel = await createSparziel({
        name: "Sparziel1",
        benutzer: benutzer.id!,
        notiz: "Notiz",
        betrag: 100,
        zielbetrag: 1000,
    });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    })
    const cookie = loginResponse.body.token
    const response = await testee.get(`/api/sparziel/${sparziel.id}/faelligkeitTage`)
        .set("token", cookie)
        .send();

    expect(response.status).toBe(200);
    expect(response.body.value).toBe(null);
});

test('get faelligkeit nicht fällig ', async () => {
    const benutzer = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
    const datum = add(new Date(), { days: 45 })

    const sparziel = await createSparziel({
        name: "Sparziel1",
        benutzer: benutzer.id!,
        notiz: "Notiz",
        betrag: 100,
        zielbetrag: 1000,
        faelligkeitsdatum: dateToString(datum)
    });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    })
    const cookie = loginResponse.body.token
    const response = await testee.get(`/api/sparziel/${sparziel.id}/faelligkeitTage`)
        .set("token", cookie)
        .send();

    expect(response.status).toBe(200);
    expect(response.body.value).toBe(45);
});

test('get faelligkeit nicht fällig ', async () => {
    const benutzer = await Benutzer.create({ email: "dima@riffel.de", name: "Dima", password: "passWORT_123", active: true });
    const datum = sub(new Date(), { days: 45 })

    const sparziel = await createSparziel({
        name: "Sparziel1",
        benutzer: benutzer.id!,
        notiz: "Notiz",
        betrag: 100,
        zielbetrag: 1000,
        faelligkeitsdatum: dateToString(datum)
    });
    const testee = supertest(app);
    const loginResponse = await testee.post("/api/login").send({
        email: "dima@riffel.de", password: "passWORT_123"
    })
    const cookie = loginResponse.body.token
    const response = await testee.get(`/api/sparziel/${sparziel.id}/faelligkeitTage`)
        .set("token", cookie)
        .send();

    expect(response.status).toBe(200);
    expect(response.body.value).toBe(-45);
});