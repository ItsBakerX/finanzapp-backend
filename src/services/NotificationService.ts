import { Buchungskategorie } from "../../src/models/BuchungskategorieModel";
import { NotificationResource } from "../../src/Resources";
import { Benutzer } from "../../src/models/BenutzerModel";
import { Notification } from "../../src/models/NotificationModel";
import { getOutcomeTowardsLimitMonthly, isLimitReached } from "./LimitService";
import { getAlleWiederkehrendeBuchungen, getAlleZukunftBuchungen } from "./BuchungService";
import { addDays, sub, subDays } from "date-fns";
import { dateToString } from "./ServiceHelper";
/**
 * Erstellt eine Benachrichtigung für einen Benutzer
 *
 * @export
 * @param {string} benutzer id des benutzers
 * @param {string} message nachricht
 * @return {*}  {Promise<NotificationResource>}
 */
export async function createNotification(
	benutzer: string,
	message: string
): Promise<NotificationResource> {
	const b = await Benutzer.findById(benutzer).exec();
	if (!b) {
		throw new Error("Benutzer not found");
	}
	const notification = await Notification.create({
		benutzer: b.id,
		message: message,
	});
	return {
		id: notification.id,
		benutzer: notification.benutzer.toString(),
		message: notification.message,
		read: notification.read,
	};
}
/**
 * Gibt alle Benachrichtigungen eines Benutzers zurück
 *
 * @export
 * @param {string} benutzer
 * @return {*}  {Promise<NotificationResource[]>}
 */
export async function getAllNotifications(benutzer: string): Promise<NotificationResource[]> {
	const b = await Benutzer.findById(benutzer).exec();
	if (!b) {
		throw new Error("Benutzer not found");
	}
	const notifications = await Notification.find({ benutzer: b.id }).exec();
	return notifications.map((n) => ({
		id: n.id,
		benutzer: n.benutzer.toString(),
		message: n.message,
		read: n.read,
	}));
}
/**
 * Gibt alle ungelesenen Benachrichtigungen eines Benutzers zurück
 *
 * @export
 * @param {string} benutzer
 * @return {*}  {Promise<NotificationResource[]>}
 */
export async function getAllUnreadNotifications(benutzer: string): Promise<NotificationResource[]> {
	const b = await Benutzer.findById(benutzer).exec();
	if (!b) {
		throw new Error("Benutzer not found");
	}
	const notifications = await Notification.find({
		$and: [{ benutzer: b.id }, { read: false }],
	}).exec();
	return notifications.map((n) => ({
		id: n.id,
		benutzer: n.benutzer.toString(),
		message: n.message,
		read: n.read,
	}));
}
/**
 * Wird aufgerufen, wenn eine Benachrichtigung als gelesen markiert werden soll
 *
 * @export
 * @param {string} notifcationId
 * @return {*}  {Promise<void>}
 */
export async function readSingleNotification(notifcationId: string): Promise<NotificationResource> {
	const notification = await Notification.findById(notifcationId).exec();
	if (!notification) {
		throw new Error("Notification not found");
	}
	notification.read = true;
	await notification.save();
	return {
		id: notification.id,
		benutzer: notification.benutzer.toString(),
		message: notification.message,
		read: notification.read,
	};
}

/**
 * Wird aufgerufen, wenn alle Benachrichtigungen als gelesen markiert werden sollen
 *
 * @export
 * @param {string} benutzer id des benutzers
 * @return {*}  {Promise<void>}
 */
export async function readAllNotifications(benutzer: string): Promise<void> {
	const b = await Benutzer.findById(benutzer).exec();
	if (!b) {
		throw new Error("Benutzer not found");
	}
	await Notification.updateMany(
		{ $and: [{ benutzer: b.id }, { read: false }] },
		{ read: true }
	).exec();
	return;
}
/**
 * Erstellt Benachrichtigungen, wenn das Ausgabenlimit erreicht ist
 *
 * @export
 * @param {string} benutzer
 * @return {*}  {Promise<void>}
 */
export async function createLimitReachedNotifications(benutzer: string, alleMessages: string[]): Promise<void> {
	const kats = await Buchungskategorie.find({ benutzer: benutzer }).exec();
	for (const kat of kats) {
		if (await isLimitReached(kat.id!)) {
			const message = `Sie haben Ihr Ausgabenlimit für die Kategorie ${kat.name} erreicht.`;
			if (alleMessages.includes(message)) {
				break;
			}
			await createNotification(benutzer, message);
		}
	}
	return;
}
/**
 * Erstellt Benachrichtigungen, wenn 20% des Ausgabenlimits erreicht sind
 *
 * @export
 * @param {string} benutzer
 * @return {*}  {Promise<void>}
 */
export async function createLimit20PercentLeftNotifications(benutzer: string, alleMessages: string[]): Promise<void> {
	const kats = await Buchungskategorie.find({ benutzer: benutzer }).exec();
	for (const kat of kats) {
		const progress = await getOutcomeTowardsLimitMonthly(kat.id!);
		const kategoryLimit = kat.ausgabenlimit ? kat.ausgabenlimit : 0;
		if (kategoryLimit !== 0 && progress >= kategoryLimit * 0.8 && progress < kategoryLimit) {
			const message = `Sie haben noch 20% Ihres Ausgabenlimits für die Kategorie ${kat.name} übrig.`;
			if (alleMessages.includes(message)) {
				break;
			}
			await createNotification(benutzer, message);
		}
	}
	return;
}

/**
 * Erstellt Benachrichtigungen, wenn 20% des Ausgabenlimits erreicht sind
 *
 * @export
 * @param {string} benutzer
 * @return {*}  {Promise<void>}
 */
export async function createZukunftBuchungNotif(benutzer: string, alleMessages: string[]): Promise<void> {
	const buchungen = await getAlleZukunftBuchungen(benutzer)
	for (const buchung of buchungen) {
		if (buchung.datum === dateToString(addDays(new Date(Date.now()), 3))) {
			const message = `In 3 Tagen (${buchung.datum} wird die ${buchung.typ} "${buchung.name} mit dem Betrag ${buchung.betrag} ausgeführt")`;
			if (alleMessages.includes(message)) {
				break;
			}
			await createNotification(benutzer, message);
		}
	}
	return;
}

/**
 * Erstellt Benachrichtigungen, wenn 20% des Ausgabenlimits erreicht sind
 *
 * @export
 * @param {string} benutzer
 * @return {*}  {Promise<void>}
 */
export async function createWiederkehrendeBuchungNotif(benutzer: string, alleMessages: string[]): Promise<void> {
	const buchungen = await getAlleWiederkehrendeBuchungen(benutzer)
	for (const buchung of buchungen) {
		if (buchung.datum === dateToString(addDays(new Date(Date.now()), 3))) {
			const message = `In 3 Tagen (${buchung.datum} wird die ${buchung.typ} "${buchung.name} mit dem Betrag ${buchung.betrag} ausgeführt")`;
			if (alleMessages.includes(message)) {
				break;
			}
			await createNotification(benutzer, message);
		}
	}
	return;
}

//Alle Create Notification Services hier anmelden

export async function checkAllNotifs(benutzerId: string): Promise<void> {
	const b = await Benutzer.findById(benutzerId).exec();
	if (!b) {
		throw new Error("Benutzer not found");
	}
	const alleMessages = (await getAllNotifications(benutzerId)).map(notif => notif.message);
	await createLimitReachedNotifications(benutzerId, alleMessages);
	await createLimit20PercentLeftNotifications(benutzerId, alleMessages);
	await createWiederkehrendeBuchungNotif(benutzerId, alleMessages);
	await createZukunftBuchungNotif(benutzerId, alleMessages);
	return
}
