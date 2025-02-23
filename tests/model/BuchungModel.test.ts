/* istanbul ignore file */
import { Buchung } from "../../src/models/BuchungModel";
import { IBenutzer, Benutzer } from "../../src/models/BenutzerModel";
import { Pocket } from "../../src/models/PocketModel";
import { ISparziel, Sparziel } from "../../src/models/SparzielModel";
import { Buchungskategorie } from "../../src/models/BuchungskategorieModel";

describe('BuchungModel CRUD Positiv', () => {
    test("BuchungModel.create mit Sparziel", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });

        let pocket = await Pocket.create({
            name: "PayPal",
            benutzer: benutzer._id,
            notiz: "Test",
            betrag: 200
        });

        let sparziel = await Sparziel.create({
            name: "Urlaub",
            benutzer: benutzer._id,
            notiz: "Urlaub in Italien",
            betrag: 20,
            zielbetrag: 2000,
            faelligkeitsdatum: new Date(2022, 5, 1)
        });
        let b = await Buchungskategorie.create({ name: "Test", benutzer: benutzer._id });
        let buchung = await Buchung.create({
            name: "Test titel",
            pocket: pocket._id,
            kategorie: b._id,
            datum: new Date(2024, 5, 1),
            betrag: 20,
            sparziel: sparziel._id,
            typ: "ausgabe"
        });

        expect(buchung).toBeDefined();
        expect(buchung.name).toBe("Test titel");
        expect(buchung.pocket).toBe(pocket._id);
        expect(buchung.kategorie).toBe(b._id);
        expect(buchung.datum).toStrictEqual(new Date(2024, 5, 1));
        expect(buchung.betrag).toBe(20);
        expect(buchung.typ).toBe("ausgabe");
    });

    test("BuchungModel.create ohne Sparziel", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });

        let pocket = await Pocket.create({
            name: "PayPal",
            benutzer: benutzer._id,
            notiz: "Test",
            betrag: 200
        });
        let b = await Buchungskategorie.create({ name: "Test", benutzer: benutzer._id });
        let buchung = await Buchung.create({
            name: "Test titel",
            pocket: pocket._id,
            kategorie: b._id,
            datum: new Date(2024, 5, 1),
            betrag: 20,
            typ: "ausgabe"
        });

        expect(buchung).toBeDefined();
        expect(buchung.name).toBe("Test titel");
        expect(buchung.pocket).toBe(pocket._id);
        expect(buchung.kategorie).toEqual(b._id);
        expect(buchung.datum).toStrictEqual(new Date(2024, 5, 1));
        expect(buchung.betrag).toBe(20);
        expect(buchung.typ).toBe("ausgabe");
    });

    test("BuchungModel.findOne", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });

        let pocket = await Pocket.create({
            name: "PayPal",
            benutzer: benutzer._id,
            notiz: "Test",
            betrag: 200
        });
        expect(pocket).toBeDefined();
        let b = await Buchungskategorie.create({ name: "Test", benutzer: benutzer._id });
        let buchung = await Buchung.create({
            name: "Test titel",
            pocket: pocket._id,
            kategorie: b._id,
            datum: new Date(2024, 5, 1),
            betrag: 20,
            typ: "ausgabe"
        });

        let foundBuchung = await Buchung.findById(buchung._id).exec();
        if (foundBuchung) {
            expect(foundBuchung).toBeDefined();
            expect(foundBuchung.name).toBe(buchung.name);
        }
    })

    test("BuchungModel.update", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });

        let pocket = await Pocket.create({
            name: "PayPal",
            benutzer: benutzer._id,
            notiz: "Test",
            betrag: 200
        });
        let b = await Buchungskategorie.create({ name: "Test", benutzer: benutzer._id });
        let buchung = await Buchung.create({
            name: "Test titel",
            pocket: pocket._id,
            kategorie: b.id,
            datum: new Date(2024, 5, 1),
            betrag: 20,
            typ: "ausgabe"
        });

        let foundBuchung = await Buchung.findByIdAndUpdate(buchung._id, {
            name: "Test titel updated"
        }, { new: true }).exec();
        if (foundBuchung) {
            expect(foundBuchung).toBeDefined();
            expect(foundBuchung.name).toBe("Test titel updated");
            expect(foundBuchung.kategorie).toEqual(buchung.kategorie);
            expect(foundBuchung.betrag).toBe(buchung.betrag);
        }
    })

    test("BuchungModel.delete", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });

        let pocket = await Pocket.create({
            name: "PayPal",
            benutzer: benutzer._id,
            notiz: "Test",
            betrag: 200
        });
        expect(pocket).toBeDefined();
        let b = await Buchungskategorie.create({ name: "Test", benutzer: benutzer._id });
        let buchung = await Buchung.create({
            name: "Test titel",
            pocket: pocket._id,
            kategorie: b._id,
            datum: new Date(2024, 5, 1),
            betrag: 20,
            typ: "ausgabe"
        });

        let d = await Buchung.deleteOne({ _id: buchung._id }).exec();
        expect(d.deletedCount).toBe(1);
        let deletedBuchung = await Buchung.findById(buchung._id).exec();
        expect(deletedBuchung).toBeNull();
    })

    test("BuchungModel.create mit Notiz", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@mail.com",
            password: "123456"
        });
        let p = await Pocket.create({ name: "PayPal", benutzer: benutzer._id, notiz: "Test", betrag: 200 });
        let b = await Buchungskategorie.create({ name: "Test", benutzer: benutzer._id });
        let buchung = await Buchung.create({
            name: "Test titel",
            pocket: p._id,
            kategorie: b._id,
            datum: new Date(2024, 5, 1),
            betrag: 20,
            typ: "ausgabe",
            notiz: "Test"
        });
        expect(buchung).toBeDefined();
        expect(buchung.notiz).toBe("Test");
    })
});

describe('BuchungModel CRUD Negativ', () => {
    test("BuchungModel.create Typ ist falsch", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });

        let pocket = await Pocket.create({
            name: "PayPal",
            benutzer: benutzer._id,
            notiz: "Test",
            betrag: 200
        });
        expect(pocket).toBeDefined();
        let b = await Buchungskategorie.create({ name: "Test", benutzer: benutzer._id });
        await expect(async () => await Buchung.create({
            name: "Test titel",
            pocket: pocket._id,
            kategorie: b._id,
            datum: new Date(2024, 5, 1),
            betrag: 20,
            typ: "falsch"
        })).rejects.toThrow();
    })
});

