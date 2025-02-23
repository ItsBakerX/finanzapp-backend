import { createBenutzer, deleteBenutzer, getBenutzer, updateBenutzer } from "../../src/services/BenutzerService";
import { BenutzerResource, PocketResource } from "../../src/Resources";
import { Benutzer } from "../../src/models/BenutzerModel";
import { NON_EXISTING_ID } from "../../tests/model/BuchungskategorieModel.test";
import { sendConfirmationEmail } from "../../src/services/EmailService";
import { createPocket } from "../../src/services/PocketService";
import { EinmaligeBuchung } from "../../src/models/EinmaligeBuchungModel";
import { Pocket } from "../../src/models/PocketModel";

jest.mock('../../src/services/EmailService', () => ({
    sendConfirmationEmail: jest.fn().mockResolvedValue(true),
}));

test("Benutzer.create", async () => {
    const benutzerResource: BenutzerResource = {
        name: "John",
        email: "example@gmail.com",
        password: "123456"
    }
    const benutzer = await createBenutzer(benutzerResource);
    expect(benutzer.id).toBeDefined();
    expect(benutzer).toBeDefined();
    expect(benutzer.name).toBe("John");
    expect(benutzer.email).toBe("example@gmail.com");
    expect(benutzer.password).not.toBeDefined();
})

test("Benutzer.create mit 2 gleichen emails", async () => {
    const benutzerResource: BenutzerResource = {
        name: "John",
        email: "example@gmail.com",
        password: "123456"
    }
    const benutzerResource2: BenutzerResource = {
        name: "John",
        email: "example@gmail.com",
        password: "123456"
    }
    const benutzer1 = await createBenutzer(benutzerResource);
    expect(benutzer1).toBeDefined();
    await expect(async () => await createBenutzer(benutzerResource2)).rejects.toThrow();
})

test("Benutzer.update: Name", async () => {
    const benutzerResource: BenutzerResource = {
        name: "John",
        email: "example@gmail.com",
        password: "123456"
    }
    const benutzerResourceUpdate = {
        name: "John1"
    }
    const benutzer1 = await createBenutzer(benutzerResource);
    expect(benutzer1).toBeDefined();
    const updatedBenutzer = await updateBenutzer(benutzer1.id!, benutzerResourceUpdate);
    expect(updatedBenutzer).toBeDefined();
    expect(updatedBenutzer.name).toBe("John1");
})

test("Benutzer.update: Password", async () => {
    const benutzerResource: BenutzerResource = {
        name: "John",
        email: "example@gmail.com",
        password: "123456"
    }
    // resource for updating
    const updateResource = {
        password: "12345678"
    }
    const b = await createBenutzer(benutzerResource);
    expect(b).toBeDefined();
    // received update resource
    const receivedUpdate = await updateBenutzer(b.id!, updateResource);
    expect(receivedUpdate).toBeDefined();
    expect(receivedUpdate.name).toBe("John");
    expect(b.id).toEqual(receivedUpdate.id);
    let updatedBenutzer = await Benutzer.findById(b.id).exec();
    let isCorrect = await updatedBenutzer!.isCorrectPassword(updateResource.password!);
    expect(isCorrect).toBeTruthy();
})

test("Benutzer.update: Password, name", async () => {
    const benutzerResource: BenutzerResource = {
        name: "John",
        email: "example@gmail.com",
        password: "123456"
    }
    // resource for updating
    const updateResource = {
        password: "12345678",
        name: "John23"
    }
    const b = await createBenutzer(benutzerResource);
    expect(b).toBeDefined();
    // received update resource
    const receivedUpdate = await updateBenutzer(b.id!, updateResource);
    expect(receivedUpdate).toBeDefined();
    expect(receivedUpdate.name).toBe(updateResource.name);
    expect(b.id).toEqual(receivedUpdate.id);
    let updatedBenutzer = await Benutzer.findById(b.id).exec();
    let isCorrect = await updatedBenutzer!.isCorrectPassword(updateResource.password!);
    expect(isCorrect).toBeTruthy();
})


test("Benutzer.update: email", async () => {
    const benutzerResource: BenutzerResource = {
        name: "John",
        email: "example@gmail.com",
        password: "123456"
    }
    // resource for updating
    const updateResource = {
        email: "update@email.com"
    }
    const b = await createBenutzer(benutzerResource);
    expect(b).toBeDefined();
    // received update resource
    const receivedUpdate = await updateBenutzer(b.id!, updateResource);
    expect(receivedUpdate).toBeDefined();
    expect(receivedUpdate.name).toBe(b.name);
    expect(b.id).toEqual(receivedUpdate.id);
    expect(sendConfirmationEmail).toHaveBeenCalled();
    expect(sendConfirmationEmail).toHaveBeenCalledWith(
        "update@email.com",
        expect.any(String)
    );

})

test("Benutzer.update mit nicht existierender ID", async () => {
    await expect(async () => await updateBenutzer(NON_EXISTING_ID,
        { name: "John", email: "expamle@gmail.com" })).rejects
        .toThrow(`Kein Benutzer mit der ID ${NON_EXISTING_ID} gefunden, kann nicht aktualisiert werden.`);
})


test("Benutzer.delete", async () => {
    const benutzerResource: BenutzerResource = {
        name: "John",
        email: "ex@gmail.com",
        password: "123"
    }
    const benutzer = await createBenutzer(benutzerResource);
    expect(benutzer).toBeDefined();
    await deleteBenutzer(benutzer.id!);
    const deletedBenutzer = await Benutzer.findById(benutzer.id);
    expect(deletedBenutzer).toBeNull();
})

test("Benutzer delete löscht alle anhängenden Dinge", async () => {
    const benutzerResource: BenutzerResource = {
		name: "John",
		email: "ex@gmail.com",
		password: "123",
	};
	const benutzer = await createBenutzer(benutzerResource);
    const pocketResource: PocketResource = {
        name: "TestPocket",
        benutzer: benutzer.id!,
        betrag: 100
    }
    const pocket = await createPocket(pocketResource);
    expect(pocket).toBeDefined();
	expect(benutzer).toBeDefined();
    await EinmaligeBuchung.create({
		name: "TestBuchung",
		pocket: pocket.id,
		kategorie: "661ea9f1d8c3a77bdc368c70",
		datum: "2021-12-12",
		betrag: 100,
		typ: "einzahlung",
	});
	await deleteBenutzer(benutzer.id!);
	const deletedBenutzer = await Benutzer.findById(benutzer.id);
	expect(deletedBenutzer).toBeNull();
    const deletedPockets = await Pocket.find({benutzer: benutzer.id}).exec();
    expect(deletedPockets).toHaveLength(0);
    const deletedBuchungen = await EinmaligeBuchung.find({pocket: pocket.id}).exec();
    expect(deletedBuchungen).toHaveLength(0);
})

test("Benutzer.delete mit nicht existierender ID", async () => {
    await expect(async () => await deleteBenutzer(NON_EXISTING_ID)).rejects
        .toThrow(`Kein Benutzer mit der ID ${NON_EXISTING_ID} gefunden, kann nicht gelöscht werden.`);
})

test("getBenutzer mit nicht existierender ID", async () => {
    await expect(async () => await getBenutzer(NON_EXISTING_ID)).rejects
        .toThrow(`Kein Benutzer mit der ID ${NON_EXISTING_ID} gefunden.`);
})

test("getBenutzer", async () => {
    const benutzer = await Benutzer.create({ name: "herbert", email: "herbert@mail.de", password: "sicheres789" })
    const load = await getBenutzer(benutzer.id)
    expect(load.name).toBe(benutzer.name)
    expect(load.email).toBe(benutzer.email)
    expect(load.id).toBe(benutzer.id)
    expect(load.password).not.toBeDefined()
})


