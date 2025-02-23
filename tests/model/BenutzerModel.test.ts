import { IBenutzer, Benutzer } from "../../src/models/BenutzerModel";

describe('BenutzerModel CRUD', () => {
    let b: IBenutzer = {
        name: "John",
        email: "john@gmail.com",
        password: "123456"
    }

    test("BenutzerModel.create", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });
        expect(benutzer).toBeDefined();
        expect(benutzer.id).toBeDefined();
        expect(benutzer.name).toBe("John");
        expect(benutzer.email).toBe("john@gmail.com");
        const correctPassword = await benutzer.isCorrectPassword("123456");
        const wrongPassword = await benutzer.isCorrectPassword("1234567");
        expect(correctPassword).toBe(true);
        expect(wrongPassword).toBe(false);
    });

    test("Benutzer.findOne", async () => {
        let benutzer = await Benutzer.create(b)
        let foundBenutzer = await Benutzer.findById(benutzer._id);
        expect(foundBenutzer).toBeDefined();
        if (foundBenutzer) {
            expect(foundBenutzer.name).toBe(b.name);
        }
    })

    test("Benutzer.update", async () => {
        let benutzer = await Benutzer.create(b);
        let updatedBenutzer = await Benutzer.findByIdAndUpdate(benutzer._id, {
            name: "Jane",
        }, { new: true });
        expect(updatedBenutzer).toBeDefined();
        if (updatedBenutzer) {
            expect(updatedBenutzer.name).toBe("Jane");
        }
    });

    test("Benutzer.delete", async () => {
        let benutzer = await Benutzer.create(b);
        await Benutzer.deleteOne({ _id: benutzer._id });
        let deletedBenutzer = await Benutzer.findById(benutzer._id);
        expect(deletedBenutzer).toBeNull();
    });

    test("Benutzer.create without required field", async () => {
        await expect(async () => await Benutzer.create({
            name: "John",
            password: "Doe"
        })).rejects.toThrow();
    });


    test("Benutzer.update passwort wird geändert", async () => {
        let benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });
        const correctPassword = await benutzer.isCorrectPassword("123456");
        expect(correctPassword).toBe(true);

        const u1 = await Benutzer.updateOne({ _id: benutzer._id }, { password: "12345678" }).exec();
        expect(u1.matchedCount).toBe(1);
        expect(u1.modifiedCount).toBe(1);
        const u2 = await Benutzer.findOne({ _id: benutzer._id }).exec();
        expect(u2).toBeDefined();
        const correctPassword2 = await u2!.isCorrectPassword("12345678");
        expect(correctPassword2).toBe(true);
    })

    test("Benutzer.create 2 mal mit dem gleichen emails", async () => {
        let benutzer1 = await Benutzer.create({
            name: "John",
            email: "john1@gmail.com",
            password: "123456"
        });
        expect(benutzer1).toBeDefined();
        await expect(async () => await Benutzer.create({
            name: "John",
            email: "john1@gmail.com",
            password: "123456"
        })).rejects.toThrow();
    })
});
