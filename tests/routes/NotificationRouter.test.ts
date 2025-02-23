import app from "../../src/jestApp";
import { Benutzer } from "../../src/models/BenutzerModel";
import { Notification } from "../../src/models/NotificationModel";
import supertest from "supertest";

import { createNotification, getAllNotifications } from "../../src/services/NotificationService";

describe("NotificationRouter", () => {
	let benutzerId: string;
	beforeEach(async () => {
		const benutzer = await Benutzer.create({
			name: "Max Mustermann",
			email: "max@mustermann.de",
			password: "passWORT_123$",
			active: true,
		});
		benutzerId = benutzer.id;
	});

	it("should have defined user", async () => {
		expect(benutzerId).toBeDefined();
		expect(benutzerId.length).toBeGreaterThan(0);
	});

	it("should get alle notifications", async () => {
		const testee = supertest(app);
		await createNotification(benutzerId, "Hello World");
		await createNotification(benutzerId, "Hello Universe");
		const loginResponse = await testee
			.post("/api/login/")
			.send({ email: "max@mustermann.de", password: "passWORT_123$" });
		const token = loginResponse.body.token;
		const response = await testee.get("/api/notification/allNotifs").set("token", `${token}`);
		expect(response.status).toBe(200);
		expect(response.body).toHaveLength(2);
	});

	it("should not get alle notifications, error", async () => {
		const testee = supertest(app);
		const response = await testee
			.get("/api/notification/allNotifs")
			.set("token", `invalidToken`);
		expect(response.status).toBe(401);
	});

	it("should get unread notifications", async () => {
		const testee = supertest(app);
		await createNotification(benutzerId, "Hello World");
		await createNotification(benutzerId, "Hello Universe");
		await Notification.create({
			benutzer: benutzerId,
			message: "Hello Universe",
			read: true,
		});
		const loginResponse = await testee
			.post("/api/login/")
			.send({ email: "max@mustermann.de", password: "passWORT_123$" });
		const token = loginResponse.body.token;
		const response = await testee
			.get("/api/notification/unreadNotifs")
			.set("token", `${token}`);
		expect(response.status).toBe(200);
		expect(response.body).toHaveLength(2);
	});

	it("should mark notif as read", async () => {
		const testee = supertest(app);
		const n = await createNotification(benutzerId, "Hello World");
		const loginResponse = await testee
			.post("/api/login/")
			.send({ email: "max@mustermann.de", password: "passWORT_123$" });
		const token = loginResponse.body.token;
		const response = await testee
			.put(`/api/notification/readNotif/${n.id}`)
			.set("token", `${token}`);
		expect(response.status).toBe(200);
		expect(response.body.read).toBe(true);
	});

	it("should mark all notifs as read", async () => {
		const testee = supertest(app);
		await createNotification(benutzerId, "Hello World1");
		await createNotification(benutzerId, "Hello World2");
		await createNotification(benutzerId, "Hello World3");
		const loginResponse = await testee
			.post("/api/login/")
			.send({ email: "max@mustermann.de", password: "passWORT_123$" });
		const token = loginResponse.body.token;
		const response = await testee
			.get("/api/notification/readAllNotifs")
			.set("token", `${token}`);
		expect(response.status).toBe(200);
		const notifs = await getAllNotifications(benutzerId);
		expect(notifs.length).toBe(3);
		expect(notifs[0].read).toBe(true);
		expect(notifs[1].read).toBe(true);
		expect(notifs[2].read).toBe(true);
	});
});
