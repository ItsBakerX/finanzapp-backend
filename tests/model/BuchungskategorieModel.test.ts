import { Pocket } from "../../src/models/PocketModel";
import { Buchung } from "../../src/models/BuchungModel";
import { Buchungskategorie } from "../../src/models/BuchungskategorieModel";
import { Benutzer, IBenutzer } from "../../src/models/BenutzerModel";
import { HydratedDocument } from "mongoose";

export const NON_EXISTING_ID = "661ea9f1d8c3a77bdc368c70"

describe("BuchungskategorieModel CRUD positiv", () => {
    let benutzer: HydratedDocument<IBenutzer>;
    beforeEach(async () => {
        benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });
    })

    test("Buchungskategorie.create", async () => {
        let b = await Buchungskategorie.create({
            name: "Test",
            benutzer: benutzer.id,
            ausgabenlimit: 200
        });

        expect(b.name).toBe("Test");
        expect(b.ausgabenlimit).toBe(200);
    });

    test("Buchungskategorie.find", async () => {
        await Buchungskategorie.create({ name: "Test", benutzer: benutzer.id });
        let b = await Buchungskategorie.find({ name: "Test" }).exec();
        expect(b[0].name).toBe("Test");
    });

    test("Buchungskategorie.update", async () => {
        let b = await Buchungskategorie.create({ name: "Test", benutzer: benutzer.id });
        let u = await Buchungskategorie.findByIdAndUpdate(b._id, { name: "Update" }, { new: true }).exec();
        expect(u!.name).toBe("Update");
    });

    test("Buchungskategorie.delete", async () => {
        await Buchungskategorie.create({ name: "Test", benutzer: benutzer.id });
        await Buchungskategorie.deleteOne({ name: "Test" }).exec();
        let b = await Buchungskategorie.find({ name: "Test" }).exec();
        expect(b.length).toBe(0);
    });

    test("Buchungskategorie in Buchung", async () => {
        let b = await Buchungskategorie.create({ name: "Test", benutzer: benutzer.id });
        let p = await Pocket.create({
            name: "PayPal",
            benutzer: NON_EXISTING_ID,
            notiz: "Test",
            betrag: 200
        });
        expect(b.name).toBe("Test");
        let buchung = await Buchung.create({
            name: "Test titel",
            pocket: p._id,
            kategorie: b.id,
            datum: new Date(2024, 5, 1),
            betrag: 20,
            typ: "ausgabe"
        });
        expect(buchung.kategorie.toString()).toEqual(b.id.toString());
    })
});


// Testing for errors
describe("BuchungskategorieModel Error", () => {
    test("Buchungskategorie.create error missing name path", async () => {
        await expect(async () => await Buchungskategorie.create({})).rejects.toThrow();
    });

    test("Buchungskategorie.create error empty name path", async () => {
        await expect(async () => await Buchungskategorie.create({ name: "" })).rejects.toThrow();
    });

    test("Buchungskategorie.create error wrong type", async () => {
        await expect(async () => await Buchungskategorie.create({ name: ["124"] })).rejects.toThrow();
    });

    test("Buchungskategorie.create error not unique", async () => {
        let benutzer: HydratedDocument<IBenutzer> = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });
        await Buchungskategorie.create({ name: "Test", benutzer: benutzer.id });
        await expect(async () => await Buchungskategorie.create({ name: "Test" })).rejects.toThrow();
    });
});