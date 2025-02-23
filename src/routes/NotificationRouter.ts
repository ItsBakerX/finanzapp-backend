import express from "express";
import { authenticate } from "./Authentication";
import {
	checkAllNotifs,
	getAllNotifications,
	getAllUnreadNotifications,
	readAllNotifications,
	readSingleNotification,
} from "../../src/services/NotificationService";

export const notificationRouter = express.Router();

notificationRouter.get("/allNotifs", authenticate, async (req, res) => {
	try {
		await checkAllNotifs(req.userId!)
		const notifications = await getAllNotifications(req.userId!);
		res.status(200).send(notifications);
		return;
	} catch (error: any) {
		res.status(400).send({ message: error.message });
		return;
	}
});

notificationRouter.get("/unreadNotifs", authenticate, async (req, res) => {
	try {
		await checkAllNotifs(req.userId!)
		const notifications = await getAllUnreadNotifications(req.userId!);
		res.status(200).send(notifications);
		return;
	} catch (error: any) {
		res.status(400).send({ message: error.message });
		return;
	}
});

notificationRouter.get("/readAllNotifs", authenticate, async (req, res) => {
	try {
		await readAllNotifications(req.userId!);
		res.status(200).send({ message: "All notifications read" });
		return;
	} catch (error: any) {
		res.status(400).send({ message: error.message });
		return;
	}
})

notificationRouter.put("/readNotif/:id", authenticate, async (req, res) => {
	try {
		const notificationId = req.params.id;
		const n = await readSingleNotification(notificationId);
		res.status(200).send(n);
		return;
	} catch (error: any) {
		res.status(400).send({ message: error.message });
		return;
	}
});

