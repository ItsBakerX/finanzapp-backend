import { Benutzer } from "../../src/models/BenutzerModel";
import { Sparziel } from "../../src/models/SparzielModel";
import { SparzielResource } from "../../src/Resources";
import { dateToString, millisToDays, stringToDate } from "./ServiceHelper";
import { compareDesc } from "date-fns";

export async function createSparziel(sparzielResource: SparzielResource): Promise<SparzielResource> {
    const foundBenutzer = await Benutzer.findById(sparzielResource.benutzer);
    if (!foundBenutzer) {
        throw new Error(`Kein Benutzer mit der ID ${sparzielResource.benutzer} gefunden.`);
    }
    const sparziel = await Sparziel.create({
        name: sparzielResource.name,
        benutzer: sparzielResource.benutzer,
        notiz: sparzielResource.notiz,
        betrag: sparzielResource.betrag,
        zielbetrag: sparzielResource.zielbetrag,
        faelligkeitsdatum: sparzielResource.faelligkeitsdatum ? stringToDate(sparzielResource.faelligkeitsdatum) : undefined
    })
    return {
        id: sparziel.id,
        name: sparziel.name,
        benutzer: sparziel.benutzer.toString(),
        notiz: sparziel.notiz,
        betrag: sparziel.betrag,
        zielbetrag: sparziel.zielbetrag,
        faelligkeitsdatum: sparziel.faelligkeitsdatum ? dateToString(sparziel.faelligkeitsdatum) : undefined
    }
}

export async function updateSparziel(sparzielId: string, update: { name?: string, betrag?: number, zielbetrag?: number, notiz?: string, faelligkeitsdatum?: string, benutzer: string }): Promise<SparzielResource> {
    const sparziel = await Sparziel.findById(sparzielId).exec();
    if (!sparziel) {
        throw new Error(`Kein Sparziel mit der ID ${sparzielId} gefunden, kann nicht aktualisiert werden.`);
    }
    if (sparziel.benutzer.toString() !== update.benutzer) {
        throw new Error(`Benutzer kann nicht geändert werden.`);
    }
    if (update.name) {
        sparziel.name = update.name;
    }
    if (update.notiz) {
        sparziel.notiz = update.notiz;
    }
    if (update.betrag) {
        sparziel.betrag = update.betrag;
    }
    if (update.zielbetrag) {
        sparziel.zielbetrag = update.zielbetrag;
    }
    if (update.faelligkeitsdatum) {
        sparziel.faelligkeitsdatum = stringToDate(update.faelligkeitsdatum);
    }
    const updatedSparziel = await sparziel.save();
    return {
        id: updatedSparziel.id,
        name: updatedSparziel.name,
        benutzer: updatedSparziel.benutzer.toString(),
        notiz: updatedSparziel.notiz,
        betrag: updatedSparziel.betrag,
        zielbetrag: updatedSparziel.zielbetrag,
        faelligkeitsdatum: updatedSparziel.faelligkeitsdatum ? dateToString(updatedSparziel.faelligkeitsdatum) : undefined
    }
}

export async function getSparziel(sparzielId: string): Promise<SparzielResource> {
    const sparziel = await Sparziel.findById(sparzielId).exec();
    if (!sparziel) {
        throw new Error(`Kein Sparziel mit der ID ${sparzielId} gefunden.`);
    }
    return {
        id: sparziel.id,
        name: sparziel.name,
        benutzer: sparziel.benutzer.toString(),
        notiz: sparziel.notiz,
        betrag: sparziel.betrag,
        zielbetrag: sparziel.zielbetrag,
        faelligkeitsdatum: sparziel.faelligkeitsdatum ? dateToString(sparziel.faelligkeitsdatum) : undefined
    }
}

export async function getAlleSparziele(benutzerId: string): Promise<SparzielResource[]> {
    const foundBenutzer = await Benutzer.findById(benutzerId).exec();
    if (!foundBenutzer) {
        throw new Error(`Kein Benutzer mit der ID ${benutzerId} gefunden.`);
    }
    const sparziele = await Sparziel.find({ benutzer: benutzerId }).exec();
    return sparziele.map(sparziel => ({
        id: sparziel.id,
        name: sparziel.name,
        benutzer: sparziel.benutzer.toString(),
        notiz: sparziel.notiz,
        betrag: sparziel.betrag,
        zielbetrag: sparziel.zielbetrag,
        faelligkeitsdatum: sparziel.faelligkeitsdatum ? dateToString(sparziel.faelligkeitsdatum) : undefined
    }));
}

export async function deleteSparziel(sparzielId: string) {
    const sparziel = await Sparziel.findOne({ _id: sparzielId });
    if (!sparziel) {
        throw new Error(`Kein Sparziel mit der ID ${sparzielId} gefunden, kann nicht gelöscht werden.`);
    }
    await Sparziel.deleteOne({ _id: sparzielId }).exec();
    return;
}

// gibt eine zahl zurück positive -> tagege bis fälligkeit, negativ -> fälligseit, 0 -> heute, null -> kein Datum angegebn
export async function getFaelligkeitTage(sparzielId: string) {
    const sparziel = await Sparziel.findOne({ _id: sparzielId });
    if (!sparziel) {
        throw new Error(`Kein Sparziel mit der ID ${sparzielId} gefunden, kann nicht gelöscht werden.`);
    }
    if (!sparziel.faelligkeitsdatum) {
        return null;
    }
    const date = new Date()
    const faelligkeitsdatum = sparziel.faelligkeitsdatum
    let faelligkeit = compareDesc(date, faelligkeitsdatum!)
    switch (faelligkeit) {
        case 0:
            return 0
        case 1:
            return millisToDays(faelligkeitsdatum.getTime() - date.getTime())
        case -1:
            return millisToDays(faelligkeitsdatum.getTime() - date.getTime())
    }
}