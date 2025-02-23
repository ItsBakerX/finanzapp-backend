import { WiederkehrendeBuchung } from "../../src/models/WiederkehrendeBuchungModel";

describe("WiederkehrendeBuchung CRUD positiv", () => {
    test("WiederkehrendeBuchung.create", async () => {
        const w = await WiederkehrendeBuchung.create({
            name: "Test titel",
            pocket: "661ea9f1d8c3a77bdc368c70",
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: new Date(2024, 5, 1),
            betrag: 20,
            typ: "ausgabe",
        });
        expect(w).toBeDefined();
        expect(w.intervall).toBe("monat");
        const wFound = await WiederkehrendeBuchung.find({ name: "Test titel" }).exec();
        expect(wFound[0].name).toBe("Test titel");
    });
});