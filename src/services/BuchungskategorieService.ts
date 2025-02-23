import { Benutzer } from "../../src/models/BenutzerModel"
import { BuchungskategorieResource } from "../Resources"
import { Buchungskategorie } from "../../src/models/BuchungskategorieModel"
import { getAlleBuchungenKategorie, getAlleWiederkehrendeBuchungen } from "./BuchungService"
import { EinmaligeBuchung } from "../../src/models/EinmaligeBuchungModel"
import { Ubertrag } from "../../src/models/UbertragModel"
import { WiederkehrendeBuchung } from "../../src/models/WiederkehrendeBuchungModel"

export const standardKategorien = ["Wohnen", "Einkauf", "Freizeit", "Transport", "Versicherung", "Sonstiges", "Übertrag"]

export async function getAlleEigeneKategorien(benutzerId: string): Promise<BuchungskategorieResource[]> {
    const benutzer = await Benutzer.findById(benutzerId).exec()
    if (!benutzer) {
        throw Error("Benutzer nicht gefunden")
    }
    const alleKategorien = await Buchungskategorie.find({ benutzer: benutzerId }).exec()
    let eigeneKategorien: BuchungskategorieResource[] = []
    alleKategorien.forEach((kat) => {
        if (!standardKategorien.includes(kat.name)) {
            eigeneKategorien.push({
                id: kat.id,
                name: kat.name,
                ausgabenlimit: kat.ausgabenlimit,
                benutzer: kat.benutzer.toString()
            })
        }
    })
    eigeneKategorien.sort((a, b) => a.name.localeCompare(b.name))
    return eigeneKategorien
}

export async function getAlleStandardKategorien(benutzerId: string): Promise<BuchungskategorieResource[]> {
    const benutzer = await Benutzer.findById(benutzerId).exec()
    if (!benutzer) {
        throw Error("Benutzer nicht gefunden")
    }
    const alleKategorien = await Buchungskategorie.find({ benutzer: benutzerId }).exec()
    let kategorien: BuchungskategorieResource[] = []
    alleKategorien.forEach((kat) => {
        if (standardKategorien.includes(kat.name)) {
            kategorien.push({
                id: kat.id,
                name: kat.name,
                ausgabenlimit: kat.ausgabenlimit,
                benutzer: kat.benutzer.toString()
            })
        }
    })
    kategorien.sort((a, b) => a.name.localeCompare(b.name))
    return kategorien
}

export async function getAlleKategorien(benutzerId: string) {
    const benutzer = await Benutzer.findById(benutzerId).exec()
    if (!benutzer) {
        throw Error("Benutzer nicht gefunden")
    }
    const alleKategorien = await Buchungskategorie.find({ benutzer: benutzerId }).exec()
    let kategorien: BuchungskategorieResource[] = []
    alleKategorien.forEach((kat) => {
        kategorien.push({
            id: kat.id,
            name: kat.name,
            ausgabenlimit: kat.ausgabenlimit,
            benutzer: kat.benutzer.toString()
        })
    })
    kategorien.sort((a, b) => a.name.localeCompare(b.name))
    return kategorien
}

export async function getBuchungskategorie(id: string): Promise<BuchungskategorieResource> {
    const kat = await Buchungskategorie.findById(id).exec();
    if (!kat) {
        throw Error("Buchungskategorie nicht gefunden")
    }
    return ({
        id: kat.id,
        name: kat.name,
        benutzer: kat.benutzer.toString(),
        ausgabenlimit: kat.ausgabenlimit
    })
}

export async function createBuchungsKategorie(buchung: BuchungskategorieResource): Promise<BuchungskategorieResource> {
    const benutzer = await Benutzer.findById(buchung.benutzer).exec()
    if (!benutzer) {
        throw Error("Benutzer nicht gefunden")
    }
    // unique name check
    const alreadyExists = await Buchungskategorie.findOne({ name: buchung.name, benutzer: benutzer.id }).exec();
    if (alreadyExists) {
        throw Error("Kategorie existiert bereits")
    }
    const kat = await Buchungskategorie.create({ name: buchung.name, ausgabenlimit: buchung.ausgabenlimit, benutzer: benutzer.id })
    return ({
        id: kat.id!,
        name: kat.name,
        ausgabenlimit: kat.ausgabenlimit,
        benutzer: kat.benutzer.toString()
    })
}


export async function updateBuchungskategorie(update: { name?: string, ausgabenlimit?: number, id: string }): Promise<BuchungskategorieResource> {
    const kat = await Buchungskategorie.findById(update.id).exec();
    if (!kat) {
        throw new Error("Buchungskategorie nicht gefunden")
    }
    kat.ausgabenlimit = update.ausgabenlimit !== undefined ? update.ausgabenlimit : kat.ausgabenlimit;

    //Ignoriert namensaenderung bei Standartkategorie
    if (!standardKategorien.includes(kat.name)) {
        kat.name = update.name || kat.name
    }
    const save = await kat.save()
    return ({
        id: save.id,
        name: save.name,
        benutzer: save.benutzer.toString(),
        ausgabenlimit: save.ausgabenlimit
    })
}

export async function deleteBuchungsKategorie(id: string): Promise<void> {
    const kat = await Buchungskategorie.findById(id).exec();
    if (!kat) {
        throw new Error("Buchungskategorie nicht gefunden")
    }
    if (standardKategorien.includes(kat.name)) {
        throw Error("Standardkategorie kann nicht gelöscht werden")
    }
    const sonstigeKat = await Buchungskategorie.findOne({ name: "Sonstiges", benutzer: kat.benutzer }).exec()
    if (!sonstigeKat) {
        throw new Error("Buchungskategorie Sonstiges nicht gefunden")
    }
    let buchungen = await getAlleBuchungenKategorie(id)
    buchungen = [...(await getAlleWiederkehrendeBuchungen(kat.benutzer.toString())).filter(w => { w.kategorie == id }), ...buchungen]
    const buchungTypes = [EinmaligeBuchung, Ubertrag, WiederkehrendeBuchung];
    for (let i = 0; i < buchungen.length; i++) {
        try {
            let buchung: any = null;
            let buchungType: string = '';
            for (const type of buchungTypes) {
                buchung = await (type as any).findById(buchungen[i].id!).exec();
                if (buchung) {
                    buchungType = type.modelName;
                    break;
                }
            }
            console.log(`Updating Buchung ${buchung} moving to ${sonstigeKat}`);
            if (!buchung) {
                throw Error("Buchung nicht gefunden")
            }
            buchung.kategorie = sonstigeKat.id!
            const updatedBuchung = await buchung!.save()
            console.log(`Updated Buchung ${updatedBuchung}`);
        } catch (e) {
            console.log(e)
            throw e
        }
    }
    await Buchungskategorie.findByIdAndDelete(id)
}

export async function createStandardKategorien(benutzerId: string): Promise<void> {
    standardKategorien.forEach(async (kat) => {
        await Buchungskategorie.create({ name: kat, benutzer: benutzerId })
    })
    return;
}
