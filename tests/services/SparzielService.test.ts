import { createSparziel, deleteSparziel, getAlleSparziele, getFaelligkeitTage, getSparziel, updateSparziel } from "../../src/services/SparzielService";
import { Benutzer } from "../../src/models/BenutzerModel";
import { BenutzerResource, SparzielResource } from "../../src/Resources";
import { NON_EXISTING_ID } from "../../tests/model/BuchungskategorieModel.test";
import { dateToString } from "../../src/services/ServiceHelper";
import { sub, add } from "date-fns"

describe("SparzielService Tests", () => {
    let benutzer: BenutzerResource;
    beforeEach(async () => {
        benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });
    })

    test('Sparziel.create', async () => {
        const sparzielResource: SparzielResource = {
            name: "Sparziel1",
            benutzer: benutzer.id!,
            notiz: "Notiz",
            betrag: 100,
            zielbetrag: 1000,
            faelligkeitsdatum: "20.10.2024"
        }
        const sparziel = await createSparziel(sparzielResource);
        expect(sparziel).toBeDefined();
        expect(sparziel.name).toBe("Sparziel1");
        expect(sparziel.benutzer).toBe(benutzer.id);
        expect(sparziel.faelligkeitsdatum).toBe("20.10.2024");
    });

    test("Sparziel.getAlleSparziele: 2 Sparziele", async () => {
        const sparzielResource1: SparzielResource = {
            name: "Sparziel1",
            benutzer: benutzer.id!,
            notiz: "Notiz",
            betrag: 100,
            zielbetrag: 1000,
            faelligkeitsdatum: "20.10.2024"
        }
        const sparziel1 = await createSparziel(sparzielResource1);
        expect(sparziel1).toBeDefined();

        const sparzielResource2: SparzielResource = {
            name: "Sparziel2",
            benutzer: benutzer.id!,
            notiz: "Notiz",
            betrag: 1000,
            zielbetrag: 2000,
            faelligkeitsdatum: "20.10.2024"
        }
        const sparziel2 = await createSparziel(sparzielResource2);
        expect(sparziel2).toBeDefined();

        expect(await getAlleSparziele(benutzer.id!)).toHaveLength(2);
    })

    test("Sparziel.getAlleSparziele: 0 Sparziele", async () => {
        expect(await getAlleSparziele(benutzer.id!)).toHaveLength(0);
    })

    test("Sparziel.getSparziel", async () => {
        const sparziel = await createSparziel({
            name: "Sparziel1",
            benutzer: benutzer.id!,
            notiz: "Notiz",
            betrag: 100,
            zielbetrag: 1000,
            faelligkeitsdatum: "20.10.2024"
        });
        expect(sparziel).toBeDefined();

        const foundSparziel = await getSparziel(sparziel.id!);
        expect(foundSparziel).toBeDefined();
        expect(foundSparziel.name).toBe(sparziel.name);
        expect(foundSparziel.benutzer).toBe(sparziel.benutzer);
    })

    test("Sparziel.getSparziel mit nicht existierender ID", async () => {
        await expect(async () => await getSparziel(NON_EXISTING_ID))
            .rejects
            .toThrow(`Kein Sparziel mit der ID ${NON_EXISTING_ID} gefunden.`);
    })

    test("Sparziel.update: Betrag und Datum", async () => {
        const sparziel = await createSparziel({
            name: "Sparziel1",
            benutzer: benutzer.id!,
            notiz: "Notiz",
            betrag: 100,
            zielbetrag: 1000,
            faelligkeitsdatum: "20.10.2024"
        });
        expect(sparziel).toBeDefined();

        const updatedSparzielResource: SparzielResource = {
            name: "Sparziel1",
            benutzer: benutzer.id!,
            notiz: "Notiz",
            betrag: 1000,
            zielbetrag: 1000,
            faelligkeitsdatum: "22.10.2024"
        }
        const updatedSparziel = await updateSparziel(sparziel.id!, updatedSparzielResource);
        expect(updatedSparziel).toBeDefined();

        expect(await getAlleSparziele(benutzer.id!)).toHaveLength(1);

        expect(updatedSparziel.betrag).toBe(1000);
        expect(updatedSparziel.faelligkeitsdatum).toBe("22.10.2024");
    })

    test("Sparziel update, benutzer verschieden", async () => {
        const sparziel = await createSparziel({
            name: "Sparziel1",
            benutzer: benutzer.id!,
            notiz: "Notiz",
            betrag: 100,
            zielbetrag: 1000,
            faelligkeitsdatum: "20.10.2024"
        });
        expect(sparziel).toBeDefined();
        const benutzer2 = await Benutzer.create({ name: "John2", email: "John@email.com", password: "PassWORT_:123", active: true });
        const updatedSparzielResource: SparzielResource = {
            name: "Sparziel1",
            benutzer: benutzer2.id!,
            notiz: "Notiz",
            betrag: 1000,
            zielbetrag: 1000,
            faelligkeitsdatum: "22.10.2024"
        }
        await expect(async () => await updateSparziel(sparziel.id!, updatedSparzielResource))
            .rejects
            .toThrow(`Benutzer kann nicht geändert werden.`);
    })

    test("Sparziel.update: ID nicht gefunden", async () => {
        expect(async () => await updateSparziel(NON_EXISTING_ID,
            {
                name: "Sparziel1",
                benutzer: benutzer.id!,
                notiz: "Notiz",
                betrag: 100,
                zielbetrag: 1000,
                faelligkeitsdatum: "20.10.2024"
            }))
            .rejects
            .toThrow(`Kein Sparziel mit der ID ${NON_EXISTING_ID} gefunden, kann nicht aktualisiert werden.`);
    })

    test("Sparziel.delete", async () => {
        const sparziel = await createSparziel({
            name: "Sparziel1",
            benutzer: benutzer.id!,
            notiz: "Notiz",
            betrag: 100,
            zielbetrag: 1000,
            faelligkeitsdatum: "20.10.2024"
        });
        expect(sparziel).toBeDefined();

        const sparziele = await getAlleSparziele(benutzer.id!);
        expect(sparziele).toHaveLength(1);

        await deleteSparziel(sparziel.id!);
        const sparzieleAfterDelete = await getAlleSparziele(benutzer.id!);
        expect(sparzieleAfterDelete).toHaveLength(0);
    })

    test("Sparziel.delete mit nicht existierender ID", async () => {
        await expect(async () => await deleteSparziel(NON_EXISTING_ID))
            .rejects
            .toThrow(`Kein Sparziel mit der ID ${NON_EXISTING_ID} gefunden, kann nicht gelöscht werden.`);
    })

    test("Sparzile getFaelligkeitTage heute", async () => {
        const sparziel = await createSparziel({
            name: "Sparziel1",
            benutzer: benutzer.id!,
            notiz: "Notiz",
            betrag: 100,
            zielbetrag: 1000,
            faelligkeitsdatum: dateToString(new Date())
        });
        expect(sparziel).toBeDefined();

        const days = await getFaelligkeitTage(sparziel.id!)
        expect(days).toBe(0)
    })

    test("Sparzile getFaelligkeitTage kein datum", async () => {
        const sparziel = await createSparziel({
            name: "Sparziel1",
            benutzer: benutzer.id!,
            notiz: "Notiz",
            betrag: 100,
            zielbetrag: 1000,
        });
        expect(sparziel).toBeDefined();

        const days = await getFaelligkeitTage(sparziel.id!)
        expect(days).toBe(null)
    })

    test("Sparzile getFaelligkeitTage fällig", async () => {

        const datum = sub(new Date(), { days: 59 })

        const sparziel = await createSparziel({
            name: "Sparziel1",
            benutzer: benutzer.id!,
            notiz: "Notiz",
            betrag: 100,
            zielbetrag: 1000,
            faelligkeitsdatum: dateToString(datum)
        });
        expect(sparziel).toBeDefined();

        const days = await getFaelligkeitTage(sparziel.id!)
        expect(days).toBe(-59)
    })

    test("Sparzile getFaelligkeitTage nicht fällig", async () => {

        const datum = add(new Date(), { days: 215 })

        const sparziel = await createSparziel({
            name: "Sparziel1",
            benutzer: benutzer.id!,
            notiz: "Notiz",
            betrag: 100,
            zielbetrag: 1000,
            faelligkeitsdatum: dateToString(datum)
        });
        expect(sparziel).toBeDefined();

        const days = await getFaelligkeitTage(sparziel.id!)
        expect(days).toBe(215)
    })
});