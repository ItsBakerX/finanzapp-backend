import { createPocket, deletePocket, getAllePockets, getPocket, updatePocket } from "../../src/services/PocketService";
import { Benutzer } from "../../src/models/BenutzerModel";
import { BenutzerResource, PocketResource, } from "../../src/Resources";
import { NON_EXISTING_ID } from "../../tests/model/BuchungskategorieModel.test";
import { createBuchung, getAlleBuchungen, getAlleBuchungenBenutzer, getBuchungById } from "../../src/services/BuchungService";
import { createBuchungsKategorie } from "../../src/services/BuchungskategorieService";
import { dateToString } from "../../src/services/ServiceHelper";

describe("PocketService Tests", () => {
    let benutzer: BenutzerResource;
    let benutzer2: BenutzerResource;
    beforeEach(async () => {
        benutzer = await Benutzer.create({
            name: "John",
            email: "john@gmail.com",
            password: "123456"
        });

        benutzer2 = await Benutzer.create({
            name: "Dima",
            email: "john2@gmail.com",
            password: "123456"
        });
    })
    test("Pocket.create", async () => {
        const pocketResource: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }

        const pocket = await createPocket(pocketResource);
        expect(pocket).toBeDefined();
    })

    test("Pocket.create: 2 Pockets", async () => {
        const pocketResource1: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocketResource2: PocketResource = {
            name: "Pocket2",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocket1 = await createPocket(pocketResource1);
        const pocket2 = await createPocket(pocketResource2);
        expect(pocket1).toBeDefined();
        expect(pocket2).toBeDefined();
        expect(pocket1.name).toBe("Pocket1");
        expect(pocket2.name).toBe("Pocket2");
        expect(pocket1.benutzer).toBe(benutzer.id);
        expect(pocket2.benutzer).toBe(benutzer.id);
        expect(pocket1.notiz).toBe("TestNotiz");
        expect(pocket2.notiz).toBe("TestNotiz");
    })

    test("Pocket.create: 2 Pockets mit gleichem Namen", async () => {
        const pocketResource1: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocketResource2: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocket1 = await createPocket(pocketResource1);
        await expect(async () => await createPocket(pocketResource2)).rejects.toThrow("Pocket mit dem Namen Pocket1 existiert bereits");
        expect(pocket1).toBeDefined();
        expect(pocket1.name).toBe("Pocket1");
        expect(pocket1.benutzer).toBe(benutzer.id);
        expect(pocket1.notiz).toBe("TestNotiz");
    })

    test("Pocket.create: 2 Pockets mit gleichem Namen, untersch. Benutzer", async () => {
        const pocketResource1: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocketResource2: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer2.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocket1 = await createPocket(pocketResource1);
        const pocket2 = await createPocket(pocketResource2);
        expect(pocket1).toBeDefined();
        expect(pocket2).toBeDefined();
        expect(pocket1.name).toBe("Pocket1");
        expect(pocket2.name).toBe("Pocket1");
        expect(pocket1.benutzer).toBe(benutzer.id);
        expect(pocket2.benutzer).toBe(benutzer2.id);
    })

    test('Pocket.create: benutzer existiert nicht', async () => {
        expect(async () => await createPocket({
            name: "Pocket1",
            benutzer: NON_EXISTING_ID,
            notiz: "TestNotiz",
            betrag: 1000
        })).rejects.toThrow("Benutzer existiert nicht");
    })

    test("Pocket.getAllePockets: es gibt die Pockets nur von einem Benutzer", async () => {
        const pocketResource1: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocketResource2: PocketResource = {
            name: "Pocket2",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocket1 = await createPocket(pocketResource1);
        const pocket2 = await createPocket(pocketResource2);
        expect(pocket1).toBeDefined();
        expect(pocket2).toBeDefined();

        const pockets = await getAllePockets(benutzer.id!);
        expect(pockets).toBeDefined();
        expect(pockets).toHaveLength(2);
        expect(pockets[0].name).toBe("Pocket1");
        expect(pockets[1].name).toBe("Pocket2");

        await deletePocket(pocket1.id!)
        const pocketsAfterDelete = await getAllePockets(benutzer.id!)
        expect(pocketsAfterDelete).toHaveLength(1)
    })

    test("Pocket.getAllePockets: es gibt die Pockets von mehreren Benutzer", async () => {
        const pocketResource1: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocketResource2: PocketResource = {
            name: "Pocket2",
            benutzer: benutzer2.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocketResource3: PocketResource = {
            name: "Pocket3",
            benutzer: benutzer2.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocket1 = await createPocket(pocketResource1);
        const pocket2 = await createPocket(pocketResource2);
        const pocket3 = await createPocket(pocketResource3);
        expect(pocket1).toBeDefined();
        expect(pocket2).toBeDefined();
        expect(pocket3).toBeDefined();
        const pockets = await getAllePockets(benutzer.id!);
        expect(pockets).toBeDefined();
        expect(pockets).toHaveLength(1);
        expect(pockets[0].name).toBe("Pocket1");
    })

    test("Pocket.getAllePockets: es gibt keine Pockets", async () => {
        const pockets = await getAllePockets(benutzer.id!);
        expect(pockets).toBeDefined();
        expect(pockets).toHaveLength(0);
    })

    test("Pocket.getAllePockets: benutzer existiert nicht", async () => {
        expect(async () => await getAllePockets(NON_EXISTING_ID))
            .rejects.toThrow(`Benutzer mit ID ${NON_EXISTING_ID} existiert nicht`);
    })

    test("Pocket.getPocket", async () => {
        const pocketResource: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocket = await createPocket(pocketResource);
        expect(pocket).toBeDefined();
        const foundPocket = await getPocket(pocket.id!);
        expect(foundPocket).toBeDefined();
        expect(foundPocket.name).toBe(pocket.name);
        expect(foundPocket.notiz).toBe(pocket.notiz);
        expect(foundPocket.id).toBe(pocket.id);
    })

    test("Pocket.getPocket, id existiert nicht", async () => {
        expect(async () => await getPocket(NON_EXISTING_ID)).rejects.toThrowError();
    })

    test("Pocket.deletePocket", async () => {
        const pocketResource: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocket = await createPocket(pocketResource);
        expect(pocket).toBeDefined();
        const foundPocket = await getAllePockets(benutzer.id!);
        expect(foundPocket).toBeDefined();
        expect(foundPocket).toHaveLength(1);
        await deletePocket(pocket.id!);
        const foundPocketAfterDelete = await getAllePockets(benutzer.id!);
        expect(foundPocketAfterDelete).toBeDefined();
        expect(foundPocketAfterDelete).toHaveLength(0);
    })

    test("Pocket.deletePocket korrektes verschieben von buchungen", async () => {
        const pocketResource: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        };
        const kategorie = await createBuchungsKategorie({ name: "kat", benutzer: benutzer.id! });
        const pocket = await createPocket(pocketResource);
        expect(pocket).toBeDefined();

        const buchung = await createBuchung({ betrag: 50, pocket: pocket.id!, name: "buchung", kategorie: kategorie.id!, typ: "ausgabe", datum: dateToString(new Date()) });

        const foundPocket = await getAllePockets(benutzer.id!);
        expect(foundPocket).toBeDefined();
        expect(foundPocket).toHaveLength(1);

        await deletePocket(pocket.id!);

        const foundPocketAfterDelete = await getAllePockets(benutzer.id!);
        expect(foundPocketAfterDelete).toBeDefined();
        expect(foundPocketAfterDelete).toHaveLength(0);

        const delBuchung = await getBuchungById(buchung.id!);
        console.log(delBuchung);

        // Verify if the Buchung is associated with the deleted pocket
        expect(delBuchung.pocket).toBeDefined();
        const delPocket = await getPocket(delBuchung.pocket!);
        expect(delPocket.name).toBe("deletedPocket");

        const buchungenAfterDelete = await getAlleBuchungenBenutzer(benutzer.id!);
        expect(buchungenAfterDelete.length).toBe(1); // Ensure the Buchung is still present

        const pocket2 = await createPocket({
            name: "Pocket2",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        });

        const buchung2 = await createBuchung({ betrag: 50, pocket: pocket2.id!, name: "buchung", kategorie: kategorie.id!, typ: "ausgabe", datum: dateToString(new Date()) });

        await deletePocket(pocket2.id!);

        const delBuchungen2 = await getAlleBuchungen(delPocket.id!);
        expect(delBuchungen2.length).toBe(2);
    });

    test("Pocket.deletePocket Buchungen löschen", async () => {
        const pocketResource: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        };
        const kategorie = await createBuchungsKategorie({ name: "kat", benutzer: benutzer.id! });
        const pocket = await createPocket(pocketResource);
        expect(pocket).toBeDefined();

        const buchung = await createBuchung({ betrag: 50, pocket: pocket.id!, name: "buchung", kategorie: kategorie.id!, typ: "ausgabe", datum: dateToString(new Date()) });

        const foundPocket = await getAllePockets(benutzer.id!);
        expect(foundPocket).toBeDefined();
        expect(foundPocket).toHaveLength(1);

        await deletePocket(pocket.id!, true);

        const foundPocketAfterDelete = await getAllePockets(benutzer.id!);
        expect(foundPocketAfterDelete).toBeDefined();
        expect(foundPocketAfterDelete).toHaveLength(0);


        const alleBuchungen = await getAlleBuchungenBenutzer(benutzer.id!)
        expect(alleBuchungen).toHaveLength(0)

    });

    test("Pocket.deletePocket, id existiert nicht", async () => {
        expect(async () => await deletePocket(NON_EXISTING_ID))
            .rejects.toThrow(`Kein Pocket mit der ID ${NON_EXISTING_ID} gefunden`);
    })

    test('Pocket.updatePocket', async () => {
        const pocketResource: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocketResourceUpdate: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotizUpdated",
            betrag: 500
        }
        const pocket = await createPocket(pocketResource);
        expect(pocket).toBeDefined();

        const updatedPocket = await updatePocket(pocket.id!, pocketResourceUpdate);
        expect(updatedPocket).toBeDefined();
        expect(updatedPocket.name).toBe("Pocket1");
        expect(updatedPocket.notiz).toBe("TestNotizUpdated");
        expect(updatedPocket.betrag).toBe(500);
        expect(updatedPocket.id).toBe(pocket.id);

        const foundPockets = await getAllePockets(benutzer.id!);
        expect(foundPockets).toBeDefined();
        expect(foundPockets).toHaveLength(1);
    })

    test('Pocket.updatePocket, id existiert nicht', async () => {
        const pocketResource: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        expect(async () => await updatePocket(NON_EXISTING_ID, pocketResource))
            .rejects.toThrow(`Kein Pocket mit der ID ${NON_EXISTING_ID} gefunden`);
    })

    test('Pocket.updatePocket: benutzer bleibt unverändert', async () => {
        const pocketResource: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer.id!,
            notiz: "TestNotiz",
            betrag: 1000
        }
        const pocketResourceUpdate: PocketResource = {
            name: "Pocket1",
            benutzer: benutzer2.id!,
            notiz: "TestNotizUpdated",
            betrag: 500
        }
        const pocket = await createPocket(pocketResource);
        expect(pocket).toBeDefined();

        const updatedPocket = await updatePocket(pocket.id!, pocketResourceUpdate);
        expect(updatedPocket).toBeDefined();
        expect(updatedPocket.name).toBe("Pocket1");
        expect(updatedPocket.notiz).toBe("TestNotizUpdated");
        expect(updatedPocket.betrag).toBe(500);
        expect(updatedPocket.id).toBe(pocket.id);
        expect(updatedPocket.benutzer).toBe(benutzer.id);

        const foundPockets = await getAllePockets(benutzer.id!);
        expect(foundPockets).toBeDefined();
        expect(foundPockets).toHaveLength(1);
    })
})