import { logger } from "./logger";
import { Benutzer } from "./models/BenutzerModel";
import { Buchungskategorie } from "./models/BuchungskategorieModel";
import { BenutzerResource } from "./Resources";
import { createBenutzer } from "./services/BenutzerService";
import { createBuchung } from "./services/BuchungService";
import { createNotification } from "./services/NotificationService";
import { createPocket } from "./services/PocketService";

export async function prefillDB(): Promise<BenutzerResource> {
	// Benutzer erstellen
	const benutzer = await createBenutzer({
		name: "Muhammad Maher Bero",
		password: "passWORT_123",
		email: "sample@user.com",
	});
	await Benutzer.updateOne({ email: "sample@user.com" }, { active: true }).exec();

	logger.info("Prefill DB mit Benutzer email: sample@user.com, passwort: passWORT_123");

	const pockets = ["Bargeld", "Girokonto", "Tagesgeld Trade Republik"];
	let pocketIds = [];

	const datumPostfix = [".01.2025", ".12.2024"];

	const typ = ["einzahlung", "ausgabe"];
	const betrage = [100, 50, 75, 204, 20.55];
	const pocketBetraege = [500, 2000, 700];

	const intervall = ["monat", "jahr", "tag"];

	const namen = ["Solana", "Bitcoin", "Ethereum", "Cardano", "Polkadot"];
	const wiederkehrendeNamen = ["Netflix", "Spotify", "Crunchyroll", "Amazon Prime", "Disney+"];

	//TODO kategorien mehrere
	//temporär
	const kategorie = await Buchungskategorie.create({
		name: "Crypto",
		benutzer: benutzer.id!,
		ausgabenlimit: 500,
	});

	const kat = await Buchungskategorie.create({
		name: "Streaming",
		benutzer: benutzer.id!,
	});

	// Pockets erstellen
	for (let i = 0; i < pockets.length; i++) {
		const pocket = await createPocket({
			name: pockets[i],
			benutzer: benutzer.id!,
			betrag: pocketBetraege[i],
		});
		logger.info(`Pocket ${pocket.name} erstellt mit ID ${pocket.id}`);
		pocketIds.push(pocket.id);
	}
	// Einmalige Buchungen
	for (let i = 0; i < betrage.length; i++) {
		const datum = "0" + (i + 1) + datumPostfix[i % 2];
		await createBuchung({
			name: namen[i],
			pocket: pocketIds[0]!,
			kategorie: kategorie.id!,
			datum: datum,
			betrag: betrage[i],
			typ: typ[i % 2],
		});
	}
	// Wiederkehrende Buchungen
	for (let i = 0; i < wiederkehrendeNamen.length; i++) {
		await createBuchung({
			name: wiederkehrendeNamen[i],
			pocket: pocketIds[1]!,
			kategorie: kat.id!,
			datum: "10.10.2024",
			betrag: 10,
			typ: typ[1],
			intervall: intervall[0],
		});
	}
	await createBuchung({
		name: "Baumarkt",
		pocket: pocketIds[1]!,
		kategorie: kategorie.id!,
		datum: "01.12.2024",
		betrag: 10,
		typ: typ[1],
		notiz: "Gartenzaun reparieren",
	});

	await createNotification(
		benutzer.id!,
		`Willkommen bei BudgetBuddy! Hier findest du alle deine Finanzen auf einen Blick.`
	);

	logger.info("Prefill DB abgeschlossen");
	return benutzer;
}