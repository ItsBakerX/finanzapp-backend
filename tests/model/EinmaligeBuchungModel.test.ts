import { EinmaligeBuchung } from '../../src/models/EinmaligeBuchungModel';

describe("EinmaligeBuchungModel CRUD positiv", () => {
    test("EinmaligeBuchung.create", async () => {
        const eb = await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: "661ea9f1d8c3a77bdc368c70",
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: new Date(2024, 5, 1),
            betrag: 20,
            typ: "ausgabe"
        });
        expect(eb).toBeDefined();
        expect(eb.name).toBe("Test titel");
        expect(eb.fromWiederkehrend).toBe(false);
    });

    test("EinmaligeBuchung.create mit Notiz", async () => {
        const eb = await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: "661ea9f1d8c3a77bdc368c70",
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: new Date(2024, 5, 1),
            betrag: 20,
            typ: "ausgabe",
            notiz: "Test"
        });
        expect(eb).toBeDefined();
        expect(eb.notiz).toBe("Test");
    })

    test("EinmaligeBuchung.find", async () => {
        const eb = await EinmaligeBuchung.create({
            name: "Test titel",
            pocket: "661ea9f1d8c3a77bdc368c70",
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: new Date(2024, 5, 1),
            betrag: 20,
            typ: "ausgabe"
        });
        expect(eb).toBeDefined();
        const ebFound = await EinmaligeBuchung.find({ name: "Test titel" }).exec();
        expect(ebFound[0].name).toBe("Test titel");
    });
});