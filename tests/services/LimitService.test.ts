import { Pocket } from "../../src/models/PocketModel";
import { Benutzer } from "../../src/models/BenutzerModel";
import { getOutcomeTowardsLimitMonthly, getOutcomeTowardsLimitMontlyAllCategories, isLimitReached, isLimitReachedAllCategories, isLimitReachedIfBuchungAdded } from "../../src/services/LimitService";
import { Buchungskategorie } from "../../src/models/BuchungskategorieModel";
import { EinmaligeBuchung } from "../../src/models/EinmaligeBuchungModel";
import { dateToString, stringToDate } from "../../src/services/ServiceHelper";
import { add, sub } from "date-fns";

let benutzer: any;

beforeEach(async () => {
    benutzer = await Benutzer.create({
        email: "dima@riffel.de",
        password: "123456",
        name: "Dima",
        active: true
    })
})

test("getOutcomeTowardsLimitMonthly: Kategorie ohne Limit", async () => {
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    const kategorie = await Buchungskategorie.create({
        name: "Test Kategorie",
        benutzer: benutzer.id
    });
    const kategorieId = kategorie.id;
    const limit = await getOutcomeTowardsLimitMonthly(kategorieId);
    expect(limit).toBe(0);
});

test("getOutcomeTowardsLimitMonthly: Kategorie mit Limit 1 Buchung im Monat, 2 außerhalb des Zeitraums", async () => {
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    const kategorie = await Buchungskategorie.create({
        name: "Test Kategorie",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    await EinmaligeBuchung.create({
        name: "Test titel",
        pocket: pocket.id,
        kategorie: kategorie.id,
        datum: stringToDate(dateToString(new Date(Date.now()))),
        betrag: 20,
        typ: "ausgabe"
    })
    await EinmaligeBuchung.create({
        name: "Test titel",
        pocket: pocket.id,
        kategorie: kategorie.id,
        datum: stringToDate(dateToString(sub(new Date(Date.now()), { months: 1 }))),
        betrag: 20,
        typ: "ausgabe"
    })
    await EinmaligeBuchung.create({
        name: "Test titel",
        pocket: pocket.id,
        kategorie: kategorie.id,
        datum: stringToDate(dateToString(add(new Date(Date.now()), { months: 1 }))),
        betrag: 20,
        typ: "ausgabe"
    })
    const kategorieId = kategorie.id;
    const limit = await getOutcomeTowardsLimitMonthly(kategorieId);
    expect(limit).toBe(20);
});

test("getOutcomeTowardsLimitMonthly: Kategorie mit Limit 3 Buchungen im Limit", async () => {
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    const kategorie = await Buchungskategorie.create({
        name: "Test Kategorie",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    for (let i = 0; i < 3; i++) {
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 20,
            typ: "ausgabe"
        })
    }
    const kategorieId = kategorie.id;
    const limit = await getOutcomeTowardsLimitMonthly(kategorieId);
    expect(limit).toBe(60);
});

test("isLimitReached: Kategorie mit Limit 3 Buchungen im Limit", async () => {
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    const kategorie = await Buchungskategorie.create({
        name: "Test Kategorie",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    for (let i = 0; i < 3; i++) {
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 20,
            typ: "ausgabe"
        })
    }
    const kategorieId = kategorie.id;
    const reached = await isLimitReached(kategorieId);
    expect(reached).toBe(false);
})

test("isLimitReached: Kategorie mit Limit 6 Buchungen -> Limit erreicht ", async () => {
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    const kategorie = await Buchungskategorie.create({
        name: "Test Kategorie",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    for (let i = 0; i < 6; i++) {
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 20,
            typ: "ausgabe"
        })
    }
    const kategorieId = kategorie.id;
    const reached = await isLimitReached(kategorieId);
    expect(reached).toBe(true);
})

test("isLimitReached: Kategorie ohne Limit 6 Buchungen", async () => {
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    const kategorie = await Buchungskategorie.create({
        name: "Test Kategorie",
        benutzer: benutzer.id,
    });
    for (let i = 0; i < 6; i++) {
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 20,
            typ: "ausgabe"
        })
    }
    const kategorieId = kategorie.id;
    const reached = await isLimitReached(kategorieId);
    expect(reached).toBe(false);
})

test("isLimitReachedIfBuchungAdded: Kategorie ohne Limit 2 Buchungen", async () => {
    const kategorie = await Buchungskategorie.create({
        name: "Test Kategorie",
        benutzer: benutzer.id,
    });
    const boolArray = [];
    for (let i = 0; i < 2; i++) {
        boolArray.push(await isLimitReachedIfBuchungAdded(kategorie.id, 20));
    }
    expect(boolArray).toEqual([false, false]);
})

test("isLimitReachedIfBuchungAdded: Kategorie mit Limit 2 Buchungen -> limit nicht erreicht", async () => {
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    const kategorie = await Buchungskategorie.create({
        name: "Test Kategorie",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    const boolArray = [];
    for (let i = 0; i < 2; i++) {
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 20,
            typ: "ausgabe"
        })
        boolArray.push(await isLimitReachedIfBuchungAdded(kategorie.id, 20));
    }
    expect(boolArray).toEqual([false, false]);
})
test("isLimitReachedIfBuchungAdded: Kategorie mit Limit 2 Buchungen -> limit erreicht", async () => {
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    const kategorie = await Buchungskategorie.create({
        name: "Test Kategorie",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    const boolArray = [];
    for (let i = 0; i < 2; i++) {
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 70,
            typ: "ausgabe"
        })
        boolArray.push(await isLimitReachedIfBuchungAdded(kategorie.id, 20));
    }
    expect(boolArray).toEqual([false, true]);
})

test("getOutcomeTowardsLimitMontlyAllCategories: 2 Kategorien ohne Limit", async () => {
    const kategorie1 = await Buchungskategorie.create({
        name: "Test Kategorie 1",
        benutzer: benutzer.id,
    });
    const kategorie2 = await Buchungskategorie.create({
        name: "Test Kategorie 2",
        benutzer: benutzer.id,
    });
    const result = await getOutcomeTowardsLimitMontlyAllCategories(benutzer.id);
    expect(result).toEqual([
        { kategorie: "Test Kategorie 1", progress: 0 },
        { kategorie: "Test Kategorie 2", progress: 0 }
    ])
})

test("getOutcomeTowardsLimitMontlyAllCategories: 2 Kategorien, eine mit Limit, keine Buchungen", async () => {
    const kategorie1 = await Buchungskategorie.create({
        name: "Test Kategorie 1",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    const kategorie2 = await Buchungskategorie.create({
        name: "Test Kategorie 2",
        benutzer: benutzer.id,
    });
    const result = await getOutcomeTowardsLimitMontlyAllCategories(benutzer.id);
    expect(result).toEqual([
        { kategorie: "Test Kategorie 1", progress: 0 },
        { kategorie: "Test Kategorie 2", progress: 0 }
    ])
})

test("getOutcomeTowardsLimitMontlyAllCategories: 2 Kategorien, eine mit Limit, mit Buchungen", async () => {
    const kategorie1 = await Buchungskategorie.create({
        name: "Test Kategorie 1",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    const kategorie2 = await Buchungskategorie.create({
        name: "Test Kategorie 2",
        benutzer: benutzer.id,
    });
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    for (let i = 0; i < 3; i++) {
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 20,
            typ: "ausgabe"
        })
    }
    const result = await getOutcomeTowardsLimitMontlyAllCategories(benutzer.id);
    expect(result).toEqual([
        { kategorie: "Test Kategorie 1", progress: 60 },
        { kategorie: "Test Kategorie 2", progress: 0 }
    ])
})
test("getOutcomeTowardsLimitMontlyAllCategories: 2 Kategorien, eine mit Limit, mit Buchungen über Limit", async () => {
    const kategorie1 = await Buchungskategorie.create({
        name: "Test Kategorie 1",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    const kategorie2 = await Buchungskategorie.create({
        name: "Test Kategorie 2",
        benutzer: benutzer.id,
    });
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    for (let i = 0; i < 3; i++) {
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 50,
            typ: "ausgabe"
        })
    }
    const result = await getOutcomeTowardsLimitMontlyAllCategories(benutzer.id);
    expect(result).toEqual([
        { kategorie: "Test Kategorie 1", progress: 150 },
        { kategorie: "Test Kategorie 2", progress: 0 }
    ])
})
test("getOutcomeTowardsLimitMontlyAllCategories: 2 Kategorien mit Limit, mit Buchungen über Limit", async () => {
    const kategorie1 = await Buchungskategorie.create({
        name: "Test Kategorie 1",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    const kategorie2 = await Buchungskategorie.create({
        name: "Test Kategorie 2",
        benutzer: benutzer.id,
        ausgabenlimit: 200
    });
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    for (let i = 0; i < 3; i++) {
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 50,
            typ: "ausgabe"
        })
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie2.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 20,
            typ: "ausgabe"
        })
    }
    const result = await getOutcomeTowardsLimitMontlyAllCategories(benutzer.id);
    expect(result).toEqual([
        { kategorie: "Test Kategorie 1", progress: 150 },
        { kategorie: "Test Kategorie 2", progress: 60 }
    ])
})

test("isLimitReachedAllCategories: 2 Kategorien ohne Limit", async () => {
    const kategorie1 = await Buchungskategorie.create({
        name: "Test Kategorie 1",
        benutzer: benutzer.id,
    });
    const kategorie2 = await Buchungskategorie.create({
        name: "Test Kategorie 2",
        benutzer: benutzer.id,
    });
    const result = await isLimitReachedAllCategories(benutzer.id);
    expect(result).toEqual([
        { kategorie: "Test Kategorie 1", reached: false },
        { kategorie: "Test Kategorie 2", reached: false }
    ])
})

test("isLimitReachedAllCategories: 2 Kategorien, eine mit Limit, keine Buchungen", async () => {
    const kategorie1 = await Buchungskategorie.create({
        name: "Test Kategorie 1",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    const kategorie2 = await Buchungskategorie.create({
        name: "Test Kategorie 2",
        benutzer: benutzer.id,
    });
    const result = await isLimitReachedAllCategories(benutzer.id);
    expect(result).toEqual([
        { kategorie: "Test Kategorie 1", reached: false },
        { kategorie: "Test Kategorie 2", reached: false }
    ])
})

test("isLimitReachedAllCategories: 2 Kategorien, eine mit Limit, mit Buchungen", async () => {
    const kategorie1 = await Buchungskategorie.create({
        name: "Test Kategorie 1",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    const kategorie2 = await Buchungskategorie.create({
        name: "Test Kategorie 2",
        benutzer: benutzer.id,
    });
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    for (let i = 0; i < 3; i++) {
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 20,
            typ: "ausgabe"
        })
    }
    const result = await isLimitReachedAllCategories(benutzer.id);
    expect(result).toEqual([
        { kategorie: "Test Kategorie 1", reached: false },
        { kategorie: "Test Kategorie 2", reached: false }
    ])
})
test("isLimitReachedAllCategories: 2 Kategorien, eine mit Limit, mit Buchungen über Limit", async () => {
    const kategorie1 = await Buchungskategorie.create({
        name: "Test Kategorie 1",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    const kategorie2 = await Buchungskategorie.create({
        name: "Test Kategorie 2",
        benutzer: benutzer.id,
    });
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    for (let i = 0; i < 3; i++) {
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 50,
            typ: "ausgabe"
        })
    }
    const result = await isLimitReachedAllCategories(benutzer.id);
    expect(result).toEqual([
        { kategorie: "Test Kategorie 1", reached: true },
        { kategorie: "Test Kategorie 2", reached: false }
    ])
})
test("isLimitReachedAllCategories: 2 Kategorien mit Limit, mit Buchungen über Limit", async () => {
    const kategorie1 = await Buchungskategorie.create({
        name: "Test Kategorie 1",
        benutzer: benutzer.id,
        ausgabenlimit: 100
    });
    const kategorie2 = await Buchungskategorie.create({
        name: "Test Kategorie 2",
        benutzer: benutzer.id,
        ausgabenlimit: 200
    });
    const pocket = await Pocket.create({
        name: "Test Pocket",
        benutzer: benutzer.id,
        betrag: 1000
    });
    for (let i = 0; i < 3; i++) {
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 50,
            typ: "ausgabe"
        })
        await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: pocket.id,
            kategorie: kategorie2.id,
            datum: stringToDate(dateToString(new Date(Date.now()))),
            betrag: 20,
            typ: "ausgabe"
        })
    }
    const result = await isLimitReachedAllCategories(benutzer.id);
    expect(result).toEqual([
        { kategorie: "Test Kategorie 1", reached: true },
        { kategorie: "Test Kategorie 2", reached: false }
    ])
})