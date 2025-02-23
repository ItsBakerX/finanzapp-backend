import { Ubertrag } from "../../src/models/UbertragModel";

describe("UebertragModel CRUD positiv", () => {
    test("Uebertrag.create", async () => {
        const ub = await Ubertrag.create({
            name: "Test titel",
            pocket: "661ea9f1d8c3a77bdc368c70",
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: new Date(2024, 5, 1),
            betrag: 20,
            typ: "ausgabe",
            zielPocket: "661ea9f1d8c3a77bdc368c70"
        });
        expect(ub).toBeDefined();
        expect(ub.zielPocket.toString()).toBe("661ea9f1d8c3a77bdc368c70");
        const ubFound = await Ubertrag.find({ name: "Test titel" }).exec();
        expect(ubFound[0].name).toBe("Test titel");
    });
});