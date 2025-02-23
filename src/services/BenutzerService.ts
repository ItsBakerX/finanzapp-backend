import { Benutzer } from "../models/BenutzerModel";
import { BenutzerResource } from "src/Resources";
import { createStandardKategorien } from "../../src/services/BuchungskategorieService";
import { sendConfirmationEmail } from "./EmailService";
import { createVerification } from "./VerificationService";
import { v4 as uuidv4 } from 'uuid';
import { Pocket } from "../../src/models/PocketModel";
import { deletePocket } from "./PocketService";
import { Sparziel } from "../../src/models/SparzielModel";
import { Buchungskategorie } from "../../src/models/BuchungskategorieModel";

export async function createBenutzer(
	benutzerResource: BenutzerResource
): Promise<BenutzerResource> {
	const benutzer = await Benutzer.create({
		name: benutzerResource.name,
		email: benutzerResource.email,
		password: benutzerResource.password,
	});
	// Create standart categories for the new user
	await createStandardKategorien(benutzer.id);
	return {
		id: benutzer.id,
		name: benutzer.name,
		email: benutzer.email,
		active: benutzer.active,
	};
}

export async function updateBenutzer(
	id: string,
	update: { name?: string; email?: string; password?: string }
): Promise<BenutzerResource> {
	const benutzer = await Benutzer.findById(id).exec();
	if (!benutzer) {
		throw new Error(`Kein Benutzer mit der ID ${id} gefunden, kann nicht aktualisiert werden.`);
	}
	if (update.name) {
		benutzer.name = update.name;
	}
	if (update.email) {
		// Generate code
		const confirmationCode = uuidv4().slice(0, 6);
		// Save code
		await createVerification(update.email, confirmationCode);
		// Send email
		await sendConfirmationEmail(update.email, confirmationCode);
		benutzer.email = update.email;
		benutzer.active = false;
	}
	if (update.password) {
		benutzer.password = update.password;
	}
	const updatedBenutzer = await benutzer.save();
	return {
		id: updatedBenutzer.id,
		name: updatedBenutzer.name,
		email: updatedBenutzer.email,
	};
}

export async function deleteBenutzer(id: string): Promise<void> {
	const benutzer = await Benutzer.findOneAndDelete({ _id: id });
	if (!benutzer) {
		throw new Error(`Kein Benutzer mit der ID ${id} gefunden, kann nicht gelöscht werden.`);
	}
	const pockets = await Pocket.find({ benutzer: id }).exec();
	for (const pocket of pockets) {
		await deletePocket(pocket.id, true);
	}
	await Sparziel.deleteMany({ benutzer: id }).exec();
	await Buchungskategorie.deleteMany({ benutzer: id }).exec();
}

export async function getBenutzer(id: string): Promise<BenutzerResource> {
    const benutzer = await Benutzer.findById(id).exec()
    if (!benutzer) {
        throw new Error(`Kein Benutzer mit der ID ${id} gefunden.`);
    }
    return ({
        id: benutzer.id.toString(),
        name: benutzer.name,
        email: benutzer.email,
        active: benutzer.active
    })
}