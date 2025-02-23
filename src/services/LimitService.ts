import { Buchungskategorie } from "../../src/models/BuchungskategorieModel";
import { getAlleBuchungenKategorie } from "./BuchungService";
import { isAfter, isBefore } from "date-fns";
import { stringToDate } from "./ServiceHelper";

export async function getOutcomeTowardsLimitMonthly(kategoryId: string): Promise<number> {
    const kategory = await Buchungskategorie.findById(kategoryId).exec();
    if (!kategory) {
        throw new Error(`Kategorie mit ID ${kategoryId} nicht gefunden`);
    }
    const kategoryLimit = kategory.ausgabenlimit;
    if (kategoryLimit === undefined) {
        return 0;
    }
    const buchungen = await getAlleBuchungenKategorie(kategory.id);
    if (buchungen.length === 0) {
        return 0;
    }
    const today = new Date(Date.now())
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const buchungenThisMonth = buchungen.filter(buchung => {
        const buchungDate = stringToDate(buchung.datum);
        return isAfter(buchungDate, monthStart) && isBefore(buchungDate, today);
    })
    const ausgabenThisMonth = buchungenThisMonth.filter(buchung => buchung.typ === "ausgabe").reduce((acc, buchung) => acc + buchung.betrag, 0);
    return ausgabenThisMonth;
}

export async function isLimitReached(kategoryId: string): Promise<boolean> {
    const kategory = await Buchungskategorie.findById(kategoryId).exec();
    if (!kategory) {
        throw new Error(`Kategorie mit ID ${kategoryId} nicht gefunden`);
    }
    const progress = await getOutcomeTowardsLimitMonthly(kategoryId);
    const kategoryLimit = kategory.ausgabenlimit ? kategory.ausgabenlimit : 0;
    return kategoryLimit === 0 ? false : progress >= kategoryLimit;
}

export async function isLimitReachedIfBuchungAdded(kategoryId: string, betrag: number): Promise<boolean> {
    const kategory = await Buchungskategorie.findById(kategoryId).exec();
    if (!kategory) {
        throw new Error(`Kategorie mit ID ${kategoryId} nicht gefunden`);
    }
    const progress = await getOutcomeTowardsLimitMonthly(kategoryId);
    const kategoryLimit = kategory.ausgabenlimit ? kategory.ausgabenlimit : 0;
    return kategoryLimit === 0 ? false : progress + betrag > kategoryLimit;
}

export async function getOutcomeTowardsLimitMontlyAllCategories(userId: string): Promise<{kategorie: string, progress: number}[]> {
    const kategories = await Buchungskategorie.find({benutzer: userId}).exec();
    const result = await Promise.all(kategories.map(async kategorie => {
        const progress = await getOutcomeTowardsLimitMonthly(kategorie.id);
        return {
            kategorie: kategorie.name,
            progress: progress
        }
    }))
    return result;
}

export async function isLimitReachedAllCategories(userId: string): Promise<{ kategorie: string, reached: boolean }[]> {
    const kategories = await Buchungskategorie.find({ benutzer: userId }).exec();
    const result = await Promise.all(kategories.map(async kategorie => {
        const reached = await isLimitReached(kategorie.id);
        return {
            kategorie: kategorie.name,
            reached: reached
        }
    }))
    return result;
}