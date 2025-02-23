import { IBenutzer, Benutzer, IBenutzerMethods } from "../../src/models/BenutzerModel";
import { Sparziel } from '../../src/models/SparzielModel';


describe("SpazielModel CRUD", () => {
    test("SpazielModel.create", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });
        expect(benutzer).toBeDefined();
        expect(benutzer.name).toBe("John");
        expect(benutzer.email).toBe("john@gmail.com");
        const correctPassword = await benutzer.isCorrectPassword("123456");
        expect(correctPassword).toBe(true);
        let sparziel = await Sparziel.create({
            name: "Test Sparziel",
            benutzer: benutzer._id,
            notiz: "Testnotiz von einem Sparziel",
            betrag: 1000,
            zielbetrag: 2000,
            faelligkeitsdatum: new Date(2025, 4, 14)
        });

        expect(sparziel).toBeDefined();
        expect(sparziel.name).toBe("Test Sparziel");
        expect(sparziel.benutzer).toBe(benutzer._id);
        expect(sparziel.notiz).toBe("Testnotiz von einem Sparziel");
        expect(sparziel.faelligkeitsdatum).toStrictEqual(new Date(2025, 4, 14));
    });

    test("Sparziel.findOne", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });

        let sparziel = await Sparziel.create({
            name: "Test Sparziel",
            benutzer: benutzer._id,
            notiz: "Testnotiz von einem Sparziel",
            betrag: 1000,
            zielbetrag: 2000,
            faelligkeitsdatum: new Date(2025, 4, 14)
        });

        let foundSparziel = await Sparziel.findById(sparziel._id).exec();
        expect(foundSparziel).toBeDefined();
        if (foundSparziel) {
            expect(foundSparziel.name).toBe(sparziel.name);
        };
    });

    test("Sparziel.update", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });

        let sparziel = await Sparziel.create({
            name: "Test Sparziel",
            benutzer: benutzer._id,
            notiz: "Testnotiz von einem Sparziel",
            betrag: 1000,
            zielbetrag: 2000,
            faelligkeitsdatum: new Date(2025, 4, 14)
        });

        let updatedSparziel = await Sparziel.findByIdAndUpdate(sparziel._id, {
            name: "Test Sparziel Updated"
        }, { new: true }).exec();

        expect(updatedSparziel).toBeDefined();
        if (updatedSparziel) {
            expect(updatedSparziel.name).toBe("Test Sparziel Updated");
            expect(updatedSparziel.betrag).toBe(sparziel.betrag);
            expect(updatedSparziel.notiz).toBe(sparziel.notiz);
        };
    });

    test("Sparziel.delete", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });

        let sparziel = await Sparziel.create({
            name: "Test Sparziel",
            benutzer: benutzer._id,
            notiz: "Testnotiz von einem Sparziel",
            betrag: 1000,
            zielbetrag: 2000,
            faelligkeitsdatum: new Date(2025, 4, 14)
        });

        await Sparziel.deleteOne({ _id: sparziel._id });
        expect(await Sparziel.findById(sparziel._id)).toBeNull();
    });
});