import {
	checkAllNotifs,
	createNotification,
	getAllNotifications,
	readAllNotifications,
} from "../../src/services/NotificationService";
import { Benutzer } from "../../src/models/BenutzerModel";
import { Notification } from "../../src/models/NotificationModel";
import { createPocket } from "../../src/services/PocketService";
import { createBuchungsKategorie } from "../../src/services/BuchungskategorieService";
import { createBuchung } from "../../src/services/BuchungService";
import { dateToString } from "../../src/services/ServiceHelper";
import { addDays } from "date-fns";
const NON_EXISTING_ID = "661ea9f1d8c3a77bdc368c70";

describe("NotificationService", () => {
	let benutzerId: string;
	beforeEach(async () => {
		const benutzer = await Benutzer.create({
			name: "Max Mustermann",
			email: "max@mustermann.de",
			password: "123456",
			active: true,
		});
		benutzerId = benutzer.id;
	});

	it("should have defined user", async () => {
		expect(benutzerId).toBeDefined();
		expect(benutzerId.length).toBeGreaterThan(0);
	});

	it("should create notification", async () => {
		const notification = await createNotification(benutzerId, "Hello World");
		expect(notification.benutzer).toEqual(benutzerId);
		expect(notification.message).toBe("Hello World");
	});

	it("should find notification", async () => {
		const notification = await createNotification(benutzerId, "Hello World");
		const foundNotification = await Notification.findById(notification.id);
		expect(foundNotification).not.toBeNull();
		expect(notification.benutzer).toEqual(benutzerId);
		expect(foundNotification?.message).toBe("Hello World");
	});

	it("should return all notifications", async () => {
		await createNotification(benutzerId, "Hello World");
		await createNotification(benutzerId, "Hello Universe");
		const notifications = await getAllNotifications(benutzerId);
		expect(notifications).toHaveLength(2);
		expect(notifications[0].benutzer).toEqual(benutzerId);
		expect(notifications[0].message).toBe("Hello World");
		expect(notifications[0].read).toBe(false);
		expect(notifications[1].benutzer).toEqual(benutzerId);
		expect(notifications[1].message).toBe("Hello Universe");
	});

	it("should return all notifications, 0 created", async () => {
		const notifications = await getAllNotifications(benutzerId);
		expect(notifications).toHaveLength(0);
	});

	it("should not return all notifications, error", async () => {
		try {
			await getAllNotifications(NON_EXISTING_ID);
		} catch (error: any) {
			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe("Benutzer not found");
		}
	});

	it("should set shown to true on all", async () => {
		await createNotification(benutzerId, "Hello World");
		await createNotification(benutzerId, "Hello Universe");
		await createNotification(benutzerId, "Hello Galaxy");
		await createNotification(benutzerId, "Hello Multiverse");
		await readAllNotifications(benutzerId);
		const notifications = await getAllNotifications(benutzerId);
		expect(notifications).toHaveLength(4);
		expect(notifications[0].read).toBe(true);
		expect(notifications[1].read).toBe(true);
		expect(notifications[2].read).toBe(true);
		expect(notifications[3].read).toBe(true);
	});

	it("should not set shown to true on all, error", async () => {
		try {
			await readAllNotifications(NON_EXISTING_ID);
		} catch (error: any) {
			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe("Benutzer not found");
		}
	});

	it("automatically created Notifs", async () => {
		await checkAllNotifs(benutzerId);
		expect((await getAllNotifications(benutzerId)).length).toBe(0)
		const pocket = await createPocket({ name: "test", betrag: 0, benutzer: benutzerId })
		const kat = await createBuchungsKategorie({ name: "test", benutzer: benutzerId, ausgabenlimit: 100 })
		await createBuchung({ name: "limit80", pocket: pocket.id!, kategorie: kat.id!, typ: "ausgabe", betrag: 80, datum: dateToString(new Date()) })
		await checkAllNotifs(benutzerId);
		let notifs = await getAllNotifications(benutzerId)
		expect(notifs.length).toBe(1)
		expect(notifs[0].message).toEqual(`Sie haben noch 20% Ihres Ausgabenlimits für die Kategorie ${kat.name} übrig.`)
		await createBuchung({ name: "limit100", pocket: pocket.id!, kategorie: kat.id!, typ: "ausgabe", betrag: 20, datum: dateToString(new Date()) })
		const buchung = await createBuchung({ name: "limit100", pocket: pocket.id!, kategorie: kat.id!, typ: "ausgabe", betrag: 20, datum: dateToString(addDays(new Date(), 3)) })
		await checkAllNotifs(benutzerId);
		notifs = await getAllNotifications(benutzerId)
		const messages = notifs.map(notif => notif.message)
		expect(notifs.length).toBe(3)
		expect(messages.includes(`Sie haben Ihr Ausgabenlimit für die Kategorie ${kat.name} erreicht.`)).toBeTruthy()
		expect(messages.includes(`In 3 Tagen (${buchung.datum} wird die ${buchung.typ} "${buchung.name} mit dem Betrag ${buchung.betrag} ausgeführt")`)).toBeTruthy()
	})
});
