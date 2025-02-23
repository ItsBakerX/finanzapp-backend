import { HydratedDocument } from "mongoose";
import { Pocket } from "../../src/models/PocketModel";
import { IBenutzer, Benutzer } from "../../src/models/BenutzerModel";

describe('PocketModel CRUD', () => {
    let benutzer: HydratedDocument<IBenutzer>

    beforeEach(async () => {
        benutzer = await Benutzer.create({
            name: "John",
            email: "john@email.com",
            password: "1245"
        });
        expect(benutzer).toBeDefined();
    });

    test("Pocket.create", async () => {
        let p = await Pocket.create({
            name: "Test",
            benutzer: benutzer._id,
            notiz: "Test",
            betrag: 100
        });
        expect(p).toBeDefined();
        expect(p.name).toBe("Test");
        expect(p.benutzer).toBe(benutzer._id);
        expect(p.notiz).toBe("Test");
        expect(p.betrag).toBe(100);
    });

    test("Pocket.find", async () => {
        let p = await Pocket.create({
            name: "Test",
            benutzer: benutzer._id,
            notiz: "Test",
            betrag: 100
        });
        let p2 = await Pocket.findById(p._id).exec();
        expect(p2).toBeDefined();
        expect(p2!.name).toBe("Test");
        expect(p2!.benutzer).toStrictEqual(benutzer._id);
        expect(p2!.notiz).toBe("Test");
        expect(p2!.betrag).toBe(100);
    });

    test("Pocket.update", async () => {
        let p = await Pocket.create({
            name: "Test",
            benutzer: benutzer._id,
            notiz: "Test",
            betrag: 100
        });
        let p2 = await Pocket.findByIdAndUpdate(p._id, { name: "Update" }, { new: true }).exec();
        expect(p2).toBeDefined();
        expect(p2!.name).toBe("Update");
        expect(p2!.benutzer).toStrictEqual(benutzer._id);
        expect(p2!.notiz).toBe("Test");
        expect(p2!.betrag).toBe(100);
    });

    test("Pocket.delete", async () => {
        let p = await Pocket.create({
            name: "Test",
            benutzer: benutzer._id,
            notiz: "Test",
            betrag: 100
        });
        let d = await Pocket.deleteOne({ name: "Test" }).exec();
        expect(d.deletedCount).toBe(1);
    });

    test("Pocket.create not unique name", async () => {
        await Pocket.create({
            name: "Test",
            benutzer: benutzer._id,
            notiz: "Test",
            betrag: 100
        });
        try {
            await Pocket.create({ name: "Test", benutzer: benutzer._id, notiz: "Test", betrag: 100 });
        } catch (error) {
            expect(error).not.toBeDefined();
        }
    })
});

describe('PocketModel Error', () => {
    test("Pocket.create error missing name path", async () => {
        await expect(async () => await Pocket.create({})).rejects.toThrow();
    });

    test("Pocket.create error empty name path", async () => {
        await expect(async () => await Pocket.create({ name: "" })).rejects.toThrow();
    });

    test("Pocket.create error wrong type", async () => {
        await expect(async () => await Pocket.create({ name: ["124"] })).rejects.toThrow();
    });
});