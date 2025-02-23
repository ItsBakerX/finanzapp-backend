import { EinmaligeBuchung, IEinmalig } from "../../src/models/EinmaligeBuchungModel";
import { Pocket } from "../../src/models/PocketModel";
import { IWiederkehrendeBuchung, WiederkehrendeBuchung } from "../../src/models/WiederkehrendeBuchungModel";
import { IUbertrag, Ubertrag } from "../../src/models/UbertragModel";
import { BuchungResource } from "../../src/Resources";
import { dateToString, stringToDate } from "./ServiceHelper";
import { Types } from "mongoose";
import { Benutzer } from "../../src/models/BenutzerModel";
import { Buchungskategorie } from "../../src/models/BuchungskategorieModel";
import { Sparziel } from "../../src/models/SparzielModel";


// returns alle EinmaligeBuchung und alle Uebertrag einer Pocket
export async function getAlleBuchungen(pocketId: string, includeZukunft: boolean = false): Promise<BuchungResource[]> {
    const foundPocket = await Pocket.findById(pocketId);
    if (!foundPocket) {
        throw new Error(`Pocket mit ID ${pocketId} nicht gefunden`);
    }

    let buchungen = [];
    const einmaligeBuchungen = await EinmaligeBuchung.find({ pocket: foundPocket.id }).exec();
    const uebertraege = await Ubertrag.find({ pocket: foundPocket.id }).exec();
    buchungen = [...einmaligeBuchungen, ...uebertraege];

    // Sortieren nach Datum und umkehren, damit neueste Buchungen zuerst kommen
    buchungen
        .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())
        .reverse();


    buchungen = buchungen.map(buchung => {
        let resource: BuchungResource = {
            id: buchung.id,
            name: buchung.name,
            pocket: buchung.pocket.toString(),
            kategorie: buchung.kategorie.toString(),
            datum: dateToString(buchung.datum),
            betrag: buchung.betrag,
            typ: buchung.typ,
            notiz: buchung.notiz,
            fromWiederkehrend: isEinmalig(buchung) ? buchung.fromWiederkehrend : false,
            zukunft: buchung.zukunft
        };
        if (hasZielPocket(buchung)) {
            resource.zielPocket = buchung.zielPocket.toString();
        }
        return resource;
    });

    return includeZukunft ?
        buchungen
        :
        buchungen.filter(buchung => !buchung.zukunft)

}

// // returns alle Buchungen einer kategorie
export async function getAlleBuchungenKategorie(katId: string): Promise<BuchungResource[]> {
    const foundKat = await Buchungskategorie.findById(katId);
    if (!foundKat) {
        throw new Error(`Buchungskategorie mit ID ${katId} nicht gefunden`);
    }

    let buchungen = [];
    const einmaligeBuchungen = await EinmaligeBuchung.find({ kategorie: foundKat.id }).exec();
    const uebertraege = await Ubertrag.find({ kategorie: foundKat.id }).exec();
    buchungen = [...einmaligeBuchungen, ...uebertraege];

    // Sortieren nach Datum und umkehren, damit neueste Buchungen zuerst kommen
    buchungen
        .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())
        .reverse();

    return buchungen.filter(buchung => !buchung.zukunft).map(buchung => {
        let resource: BuchungResource = {
            id: buchung.id,
            name: buchung.name,
            pocket: buchung.pocket.toString(),
            kategorie: buchung.kategorie.toString(),
            datum: dateToString(buchung.datum),
            betrag: buchung.betrag,
            typ: buchung.typ,
            notiz: buchung.notiz
        };
        if (hasZielPocket(buchung)) {
            resource.zielPocket = buchung.zielPocket.toString();
        }
        return resource;
    });
}

//returns alle EinmaligeBuchung und alle Ubertrag eines Benutzers
export async function getAlleBuchungenBenutzer(benutzerID: string, includeZukunft: boolean = false): Promise<BuchungResource[]> {
    const benutzer = await Benutzer.findById(benutzerID).exec()
    if (!benutzer) {
        throw Error("Kein Benutzer mit dieser ID gefunden")
    }
    let buchungen: any[] = [];
    const pockets = await Pocket.find({ benutzer: benutzerID }).exec()

    for (const pocket of pockets) {
        buchungen = buchungen.concat(await getAlleBuchungen(pocket.id, includeZukunft))
    }

    // Sortieren nach Datum und umkehren, damit neueste Buchungen zuerst kommen
    buchungen
        .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())
        .reverse();

    return buchungen
}


// Returns alle Wiederkehrenden Buchungen eines Benutzers
export async function getAlleWiederkehrendeBuchungen(benutzerID: string): Promise<BuchungResource[]> {
    const benutzer = await Benutzer.findById(benutzerID).exec()
    if (!benutzer) {
        throw Error("Kein Benutzer mit dieser ID gefunden")
    }
    let buchungen: any[] = [];
    const pockets = await Pocket.find({ benutzer: benutzerID }).exec()

    for (const pocket of pockets) {
        const pocketBuchungen = await WiederkehrendeBuchung.find({ pocket: pocket.id }).exec()
        buchungen = buchungen.concat(pocketBuchungen)
    }

    buchungen
        .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())
        .reverse();

    return buchungen.map(buchung => ({
        id: buchung.id,
        name: buchung.name,
        pocket: buchung.pocket.toString(),
        kategorie: buchung.kategorie.toString(),
        datum: dateToString(buchung.datum),
        betrag: buchung.betrag,
        typ: buchung.typ,
        intervall: buchung.intervall,
        notiz: buchung.notiz
    }))
}

export async function getAlleEinnahmen(benutzerId: string): Promise<BuchungResource[]> {
    const benutzer = await Benutzer.findById(benutzerId).exec()
    if (!benutzer) {
        throw Error("Kein Benutzer mit dieser ID gefunden")
    }
    let buchungen: any[] = [];
    const pockets = await Pocket.find({ benutzer: benutzerId }).exec()
    for (const pocket of pockets) {
        const einmaligeBuchungen = await EinmaligeBuchung.find({ pocket: pocket.id, typ: "einzahlung" }).exec();
        const uebertraege = await Ubertrag.find({ pocket: pocket.id, typ: "einzahlung" }).exec();
        buchungen = [...buchungen, ...einmaligeBuchungen, ...uebertraege];
    }

    return buchungen.filter(buchung => !buchung.zukunft).map(buchung => {
        let resource: BuchungResource = {
            id: buchung.id,
            name: buchung.name,
            pocket: buchung.pocket.toString(),
            kategorie: buchung.kategorie.toString(),
            datum: dateToString(buchung.datum),
            betrag: buchung.betrag,
            typ: buchung.typ,
            notiz: buchung.notiz
        };
        if (hasZielPocket(buchung)) {
            resource.zielPocket = buchung.zielPocket.toString();
        }
        return resource;
    });
}

export async function getAlleAusgaben(benutzerId: string): Promise<BuchungResource[]> {
    const benutzer = await Benutzer.findById(benutzerId).exec()
    if (!benutzer) {
        throw Error("Kein Benutzer mit dieser ID gefunden")
    }
    let buchungen: any[] = [];
    const pockets = await Pocket.find({ benutzer: benutzerId }).exec()
    for (const pocket of pockets) {
        const einmaligeBuchungen = await EinmaligeBuchung.find({ pocket: pocket.id, typ: "ausgabe" }).exec();
        const uebertraege = await Ubertrag.find({ pocket: pocket.id, typ: "ausgabe" }).exec();
        buchungen = [...buchungen, ...einmaligeBuchungen, ...uebertraege];
    }

    return buchungen.filter(buchung => !buchung.zukunft).map(buchung => {
        let resource: BuchungResource = {
            id: buchung.id,
            name: buchung.name,
            pocket: buchung.pocket.toString(),
            kategorie: buchung.kategorie.toString(),
            datum: dateToString(buchung.datum),
            betrag: buchung.betrag,
            typ: buchung.typ,
            notiz: buchung.notiz
        };
        if (hasZielPocket(buchung)) {
            resource.zielPocket = buchung.zielPocket.toString();
        }
        return resource;
    });
}

export async function createBuchung(buchung: BuchungResource): Promise<BuchungResource> {
    let pocket = await Pocket.findById(buchung.pocket).exec()
    if (!pocket) {
        pocket = await Sparziel.findById(buchung.pocket).exec()
    }
    if (!pocket) {
        throw Error("Pocket not found")
    }

    if (buchung.typ !== "einzahlung" && buchung.typ !== "ausgabe") {
        throw Error("Typ must be 'einzahlung' or 'ausgabe'");
    }

    if (hasIntervall(buchung) && !hasZielPocket(buchung)) {
        await createEinmaligeBuchung({ ...buchung, fromWiederkehrend: true })
        return await createWiederkehrendeBuchung(buchung)

    }
    if (!hasIntervall(buchung) && hasZielPocket(buchung)) {
        return await createUbertrag(buchung)
    }
    if (!hasIntervall(buchung) && !hasZielPocket(buchung)) {
        return await createEinmaligeBuchung(buchung)
    }
    throw new Error("Attributes do not match any Subclass of Buchung")
}

async function createEinmaligeBuchung(buchung: BuchungResource): Promise<BuchungResource> {
    const pocket = await Pocket.findById(buchung.pocket).exec()
    const isZukunft = stringToDate(buchung.datum) > new Date(Date.now());
    const newBuchung = await EinmaligeBuchung.create({
        name: buchung.name,
        pocket: buchung.pocket.toString(),
        kategorie: buchung.kategorie.toString(),
        datum: stringToDate(buchung.datum),
        betrag: buchung.betrag,
        typ: buchung.typ,
        notiz: buchung.notiz,
        fromWiederkehrend: buchung.fromWiederkehrend,
        zukunft: isZukunft
    })
    if (!isZukunft) {
        switch (buchung.typ) {
            case ("einzahlung"):
                pocket!.betrag += buchung.betrag
                break
            case ("ausgabe"):
                pocket!.betrag -= buchung.betrag
                break
        }
    }
    await pocket!.save()
    return {
        id: newBuchung.id!,
        name: newBuchung.name,
        pocket: newBuchung.pocket.toString(),
        kategorie: newBuchung.kategorie.toString(),
        datum: dateToString(newBuchung.datum),
        betrag: newBuchung.betrag,
        typ: newBuchung.typ,
        notiz: newBuchung.notiz,
        fromWiederkehrend: newBuchung.fromWiederkehrend,
        zukunft: newBuchung.zukunft
    }
}

async function createWiederkehrendeBuchung(buchung: BuchungResource): Promise<BuchungResource> {
    const pocket = await Pocket.findById(buchung.pocket).exec()
    const newBuchung = await WiederkehrendeBuchung.create({
        name: buchung.name,
        pocket: buchung.pocket.toString(),
        kategorie: buchung.kategorie.toString(),
        datum: stringToDate(buchung.datum),
        betrag: buchung.betrag,
        typ: buchung.typ,
        intervall: buchung.intervall,
        notiz: buchung.notiz
    })
    return {
        id: newBuchung.id!,
        name: newBuchung.name,
        pocket: newBuchung.pocket.toString(),
        kategorie: newBuchung.kategorie.toString(),
        datum: dateToString(newBuchung.datum),
        betrag: newBuchung.betrag,
        typ: newBuchung.typ,
        intervall: newBuchung.intervall,
        notiz: newBuchung.notiz
    }
}

async function createUbertrag(buchung: BuchungResource): Promise<BuchungResource> {
    let pocket = await Pocket.findById(buchung.pocket).exec()
    if (!pocket) {
        pocket = await Sparziel.findById(buchung.pocket).exec()
    }
    if (!pocket) {
        throw Error("Pocket not found")
    }
    const isZukunft = stringToDate(buchung.datum) > new Date(Date.now());
    const newBuchung = await Ubertrag.create({
        name: buchung.name,
        pocket: buchung.pocket.toString(),
        kategorie: buchung.kategorie.toString(),
        datum: stringToDate(buchung.datum),
        betrag: buchung.betrag,
        typ: buchung.typ,
        zielPocket: buchung.zielPocket,
        notiz: buchung.notiz,
        zukunft: isZukunft
    })
    let zielPocket = await Pocket.findById(buchung.zielPocket).exec()
    if (!zielPocket) {
        zielPocket = await Sparziel.findById(buchung.zielPocket).exec()
    }
    if (!zielPocket) {
        throw Error("ZielPocket not found")
    }
    if (!isZukunft) {
        switch (buchung.typ) {
            case ("einzahlung"):
                throw Error("typ: einzahlung not applicable for Uebertrag")
            case ("ausgabe"):
                pocket!.betrag -= buchung.betrag
                zielPocket.betrag += buchung.betrag
                break
        }
    }
    await pocket!.save()
    await zielPocket.save()
    return {
        id: newBuchung.id!,
        name: newBuchung.name,
        pocket: newBuchung.pocket.toString(),
        kategorie: newBuchung.kategorie.toString(),
        datum: dateToString(newBuchung.datum),
        betrag: newBuchung.betrag,
        typ: newBuchung.typ,
        zielPocket: newBuchung.zielPocket.toString(),
        notiz: newBuchung.notiz,
        zukunft: isZukunft
    }
}

export async function deleteBuchung(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
        throw Error("Invalid Id)");
    }
    let buchung: any = null
    buchung = await EinmaligeBuchung.findByIdAndDelete(id).exec()
    if (!buchung) {
        buchung = await Ubertrag.findByIdAndDelete(id).exec()
    }
    if (buchung) {
        const pocket = await Pocket.findById(buchung.pocket).exec()
        switch (buchung.typ) {
            case "ausgabe":
                pocket!.betrag += buchung.betrag
                break
            case "einzahlung":
                pocket!.betrag -= buchung.betrag
                break
        }
        await pocket!.save()
    }

    if (!buchung) {
        buchung = await WiederkehrendeBuchung.findByIdAndDelete(id).exec()
    }
    if (!buchung) {
        throw Error("keine Buchung mit dieser Id gefunden")
    }
}

export async function updateBuchung(buchungResource: BuchungResource): Promise<BuchungResource> {
    const id = buchungResource.id!;

    if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid Id");
    }

    const buchungTypes = [EinmaligeBuchung, Ubertrag, WiederkehrendeBuchung];
    let buchung: any = null;
    let buchungType: string = '';

    for (const type of buchungTypes) {
        buchung = await (type as any).findById(id).exec();
        if (buchung) {
            buchungType = type.modelName;
            break;
        }
    }

    if (!buchung) {
        throw new Error(`Buchung mit ID ${id} nicht gefunden`);
    }

    const fieldsToUpdate = ['name', 'kategorie', 'betrag', 'typ', 'pocket', 'intervall', 'zielPocket', 'notiz'];
    fieldsToUpdate.forEach(field => {
        if (buchungResource[field as keyof BuchungResource]) {
            buchung[field] = buchungResource[field as keyof BuchungResource];
        }
    });

    if (buchungResource.datum) {
        buchung.datum = stringToDate(buchungResource.datum);
    }

    const updatedBuchung = await buchung.save();


    const commonResponse = {
        id: updatedBuchung.id,
        name: updatedBuchung.name,
        pocket: updatedBuchung.pocket?.toString(),
        kategorie: updatedBuchung.kategorie?.toString(),
        datum: dateToString(updatedBuchung.datum),
        betrag: updatedBuchung.betrag,
        typ: updatedBuchung.typ,
        notiz: updatedBuchung.notiz,
    };

    if (buchungType === 'Ubertrag') {
        return {
            ...commonResponse,
            zielPocket: updatedBuchung.zielPocket?.toString(),
        };
    } else if (buchungType === 'WiederkehrendeBuchung') {
        return {
            ...commonResponse,
            intervall: updatedBuchung.intervall,
        };
    }

    return commonResponse;
}


export async function getBuchungById(id: string): Promise<BuchungResource> {
    if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid Id");
    }

    const buchungTypes = [EinmaligeBuchung, Ubertrag, WiederkehrendeBuchung];
    let buchung: any = null;
    let buchungType: string = '';

    for (const type of buchungTypes) {
        buchung = await (type as any).findById(id).exec();
        if (buchung) {
            buchungType = type.modelName;
            break;
        }
    }

    if (!buchung) {
        throw new Error(`Buchung mit ID ${id} nicht gefunden`);
    }

    const commonResponse = {
        id: buchung.id,
        name: buchung.name,
        pocket: buchung.pocket?.toString(),
        kategorie: buchung.kategorie?.toString(),
        datum: dateToString(buchung.datum),
        betrag: buchung.betrag,
        typ: buchung.typ,
        notiz: buchung.notiz,
    };

    if (buchungType === 'Ubertrag') {
        return {
            ...commonResponse,
            zielPocket: buchung.zielPocket?.toString(),
        };
    } else if (buchungType === 'WiederkehrendeBuchung') {
        return {
            ...commonResponse,
            intervall: buchung.intervall,
        };
    }

    return commonResponse;
}

export async function getAlleZukunftBuchungen(benutzerId: string): Promise<BuchungResource[]> {
    return (await getAlleBuchungenBenutzer(benutzerId, true)).filter(buchung => buchung.zukunft)
}

export async function zukunftBuchungAusfuehren(id: string): Promise<void> {
    let buchung: any = await EinmaligeBuchung.findById(id).exec();
    if (!buchung) {
        buchung = await Ubertrag.findById(id).exec();
    }
    if (!buchung) {
        throw Error("Keine Buchung mit dieser Id gefunden")
    }
    if (!buchung.zukunft) {
        throw Error("Buchung wurde bereits ausgeführt")
    }
    const pocket = await Pocket.findById(buchung.pocket).exec()
    const zielPocket = buchung.zielPocket ? await Pocket.findById(buchung.zielPocket).exec() : null
    switch (buchung.typ) {
        case ("einzahlung"):
            pocket!.betrag += buchung.betrag
            break
        case ("ausgabe"):
            pocket!.betrag -= buchung.betrag
            zielPocket ? zielPocket.betrag += buchung.betrag : () => { }
            break
    }
    await pocket!.save()
    zielPocket?.save()
    buchung.datum = new Date().setHours(0, 0, 0, 0);
    buchung.zukunft = false;
    await buchung.save()
}

// Falls Intervall vorhanden, wird Buchung als wiederkehrende Buchung behandelt
// is ist die Zusicherung für den Compiler, falls Vergleich positiv ausfällt,
// dass Buchung vom Typ IWiederkehrendeBuchung ist
function hasIntervall(buchung: any): buchung is IWiederkehrendeBuchung {
    return 'intervall' in buchung;
}

// Analog zu hasIntervall
function hasZielPocket(buchung: any): buchung is IUbertrag {
    return 'zielPocket' in buchung;
}

function isEinmalig(buchung: any): buchung is IEinmalig {
    return 'fromWiederkehrend' in buchung;
}