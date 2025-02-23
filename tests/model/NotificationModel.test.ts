import { Benutzer } from "../../src/models/BenutzerModel";
import { Notification } from "../../src/models/NotificationModel";

describe("NotificationModel", () => {
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
		const notification = await Notification.create({
			benutzer: benutzerId,
			message: "Hello World",
		});
		expect(notification.benutzer.toString()).toEqual(benutzerId);
		expect(notification.message).toBe("Hello World");
	});

	it("should find notification", async () => {
		const notification = await Notification.create({
			benutzer: benutzerId,
			message: "Hello World",
		});
		const foundNotification = await Notification.findById(notification.id);
		expect(foundNotification).not.toBeNull();
		expect(notification.benutzer.toString()).toEqual(benutzerId);
		expect(foundNotification?.message).toBe("Hello World");
	});

	it("should update notification", async () => {
		const notification = await Notification.create({
			benutzer: benutzerId,
			message: "Hello World",
		});
		const updatedNotification = await Notification.findByIdAndUpdate(
			notification.id,
			{
				message: "Hello Universe",
			},
			{ new: true }
		);
		expect(updatedNotification).not.toBeNull();
		expect(notification.benutzer.toString()).toEqual(benutzerId);
		expect(updatedNotification?.message).toBe("Hello Universe");
	});

	it("should delete notification", async () => {
		const notification = await Notification.create({
			benutzer: benutzerId,
			message: "Hello World",
		});
		const deletedNotification = await Notification.findByIdAndDelete(
			notification.id
		);
		expect(deletedNotification).not.toBeNull();
		expect(notification.benutzer.toString()).toEqual(benutzerId);
		expect(deletedNotification?.message).toBe("Hello World");
	});

	it("should find all notifications", async () => {
		await Notification.create({
			benutzer: benutzerId,
			message: "Hello World",
		});
		await Notification.create({
			benutzer: benutzerId,
			message: "Hello Universe",
		});
		const notifications = await Notification.find({ benutzer: benutzerId });
		expect(notifications.length).toBe(2);
	});

	it("should not create notification without user", async () => {
		try {
			await Notification.create({
				message: "Hello World",
			});
		} catch (error) {
			expect(error).not.toBeNull();
		}
	});

	it("should not create notification without message", async () => {
		try {
			await Notification.create({
				benutzer: benutzerId,
			});
		} catch (error) {
			expect(error).not.toBeNull();
		}
	});
});
