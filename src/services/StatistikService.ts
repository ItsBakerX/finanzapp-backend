
import { getAlleAusgaben, getAlleBuchungen, getAlleBuchungenBenutzer, getAlleEinnahmen } from "./BuchungService"
import { stringToDate } from "./ServiceHelper"
import { getAllePockets } from "./PocketService"
import { add, compareAsc, getWeek, sub, subMonths } from "date-fns"
import { getAlleKategorien } from "./BuchungskategorieService"



//gibt die einnahmen der Aktuellen Woche von Montag bis Heute zurück
export async function getEinahmenWoche(benutzerId: string): Promise<number> {
    let einnahmen = 0
    const buchungen = await getAlleEinnahmen(benutzerId)
    const datum = new Date()
    const jahr = datum.getFullYear()
    const monat = datum.getMonth()
    const tag = datum.getDate()
    const wochenTag = datum.getDay()

    for (let i = 0; i < buchungen.length; i++) {
        const buchung = buchungen[i]
        const buchungsDatum = stringToDate(buchung.datum)
        const buchungsMonat = buchungsDatum.getMonth()
        const buchungsJahr = buchungsDatum.getFullYear()
        const buchungsTag = buchungsDatum.getDate()

        // Helper-Funktion, um zu prüfen, ob ein Jahr ein Schaltjahr ist
        const istSchaltjahr = (jahr: number): boolean => {
            return (jahr % 4 === 0 && jahr % 100 !== 0) || (jahr % 400 === 0);
        };

        // Anzahl der Tage in jedem Monat
        const tageProMonat = [31, istSchaltjahr(jahr) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        const tageZurueck = wochenTag; // Wie viele Tage zurückgehen
        const startTag = tag - tageZurueck;

        if (startTag > 0) {
            // Gleicher Monat
            if (buchungsTag <= tag && buchungsTag >= startTag && buchungsMonat == monat && buchungsJahr == jahr) {
                einnahmen += buchung.betrag;
            }
        } else {
            // Vorheriger Monat
            const vorherigerMonat = monat === 0 ? 11 : monat - 1;
            const vorherigesJahr = monat === 0 ? jahr - 1 : jahr;
            const tageImVorherigenMonat = tageProMonat[vorherigerMonat];

            if (
                (buchungsTag > tageImVorherigenMonat + startTag && buchungsMonat == vorherigerMonat && buchungsJahr == vorherigesJahr) ||
                (buchungsTag <= tag && buchungsMonat == monat && buchungsJahr == jahr)
            ) {
                einnahmen += buchung.betrag;
            }
        }
    }
    return einnahmen
}


export async function getAusgabenWoche(benutzerId: string): Promise<number> {
    let ausgaben = 0
    const buchungen = await getAlleAusgaben(benutzerId)
    const datum = new Date()
    const jahr = datum.getFullYear()
    const monat = datum.getMonth()
    const tag = datum.getDate()
    const wochenTag = datum.getDay()

    for (let i = 0; i < buchungen.length; i++) {
        const buchung = buchungen[i]
        const buchungsDatum = stringToDate(buchung.datum)
        const buchungsMonat = buchungsDatum.getMonth()
        const buchungsJahr = buchungsDatum.getFullYear()
        const buchungsTag = buchungsDatum.getDate()

        // Helper-Funktion, um zu prüfen, ob ein Jahr ein Schaltjahr ist
        const istSchaltjahr = (jahr: number): boolean => {
            return (jahr % 4 === 0 && jahr % 100 !== 0) || (jahr % 400 === 0);
        };

        // Anzahl der Tage in jedem Monat
        const tageProMonat = [31, istSchaltjahr(jahr) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        const tageZurueck = wochenTag; // Wie viele Tage zurückgehen
        const startTag = tag - tageZurueck;

        if (startTag > 0) {
            // Gleicher Monat
            if (buchungsTag <= tag && buchungsTag >= startTag && buchungsMonat == monat && buchungsJahr == jahr) {
                ausgaben += buchung.betrag;
            }
        } else {
            // Vorheriger Monat
            const vorherigerMonat = monat === 0 ? 11 : monat - 1;
            const vorherigesJahr = monat === 0 ? jahr - 1 : jahr;
            const tageImVorherigenMonat = tageProMonat[vorherigerMonat];

            if (
                (buchungsTag > tageImVorherigenMonat + startTag && buchungsMonat == vorherigerMonat && buchungsJahr == vorherigesJahr) ||
                (buchungsTag <= tag && buchungsMonat == monat && buchungsJahr == jahr)
            ) {
                ausgaben += buchung.betrag;
            }
        }
    }
    return ausgaben
}

export async function getAusgaben4Wochen(bennuzterId: string): Promise<number[][]> {
    let wochen: number[] = []
    let ausgaben: number[] = []
    let datum = sub(new Date(), { days: 1 })
    datum.setHours(23, 59, 59, 999);
    let wochenTag = datum.getDay()
    const buchungen = await getAlleAusgaben(bennuzterId)
    for (let i = 0; i < 4; i++) {
        let startDatum = sub(datum, { days: wochenTag, weeks: i })
        wochen[i] = getWeek(startDatum, { weekStartsOn: 0 })
        ausgaben[i] = 0
        for (const buchung of buchungen) {
            const buchungDatum = stringToDate(buchung.datum)

            if (buchungDatum > startDatum && buchungDatum < add(startDatum, { weeks: 1 })) {
                ausgaben[i] += buchung.betrag
            }
        }
    }
    return [wochen, ausgaben]
}

export async function getEinahmenMonat(benutzerId: string): Promise<number> {
    let einnahmen = 0
    const buchungen = await getAlleEinnahmen(benutzerId)
    const datum = new Date()
    const jahr = datum.getFullYear()
    const monat = datum.getMonth()

    for (let i = 0; i < buchungen.length; i++) {
        const buchung = buchungen[i]
        const buchungsDatum = stringToDate(buchung.datum)
        const buchungsMonat = buchungsDatum.getMonth()
        const buchungsJahr = buchungsDatum.getFullYear()
        if (buchungsMonat == monat && buchungsJahr == jahr) {
            einnahmen += buchung.betrag
        }
    }
    return einnahmen
}


export async function getAusgabenMonat(userId: string): Promise<number> {
    let ausgaben = 0
    const buchungen = await getAlleAusgaben(userId)
    const datum = new Date()
    const jahr = datum.getFullYear()
    const monat = datum.getMonth()
    for (let i = 0; i < buchungen.length; i++) {
        const buchung = buchungen[i]
        const buchungsDatum = stringToDate(buchung.datum)
        const buchungsMonat = buchungsDatum.getMonth()
        const buchungsJahr = buchungsDatum.getFullYear()
        if (buchungsMonat == monat && buchungsJahr == jahr) {
            ausgaben += buchung.betrag
        }
    }
    return ausgaben
}

export async function getAusgaben12Monate(bennuzterId: string): Promise<number[][]> {
    let monat: number[] = []
    let ausgaben: number[] = []
    let datum = new Date()
    const buchungen = await getAlleAusgaben(bennuzterId)
    monat[0] = datum.getMonth() + 1
    ausgaben[0] = await getAusgabenMonat(bennuzterId)
    for (let i = 1; i < 12; i++) {
        monat[i] = monat[0] - i < 1 ? monat[0] - i + 12 : monat[0] - i
        let jahr = monat[i] > monat[0] ? datum.getFullYear() - 1 : datum.getFullYear()
        ausgaben[i] = 0
        for (const buchung of buchungen) {
            const buchungDatum = stringToDate(buchung.datum)
            if (buchungDatum.getMonth() == monat[i] - 1 && buchungDatum.getFullYear() == jahr) {
                ausgaben[i] += buchung.betrag
            }
        }
    }
    return [monat, ausgaben]
}

export async function getEinahmenJahr(benutzerId: string): Promise<number> {
    let einnahmen = 0
    const buchungen = await getAlleEinnahmen(benutzerId)
    const datum = new Date()
    const jahr = datum.getFullYear()
    for (let i = 0; i < buchungen.length; i++) {
        const buchung = buchungen[i]
        const buchungsDatum = stringToDate(buchung.datum)
        const buchungsJahr = buchungsDatum.getFullYear()
        if (buchungsJahr == jahr) {
            einnahmen += buchung.betrag
        }
    }
    return einnahmen
}


export async function getAusgabenJahr(userId: string): Promise<number> {
    let ausgaben = 0
    const buchungen = await getAlleAusgaben(userId)
    const datum = new Date()
    const jahr = datum.getFullYear()
    for (let i = 0; i < buchungen.length; i++) {
        const buchung = buchungen[i]
        const buchungsDatum = stringToDate(buchung.datum)
        const buchungsJahr = buchungsDatum.getFullYear()
        if (buchungsJahr == jahr) {
            ausgaben += buchung.betrag
        }
    }
    return ausgaben
}

export async function getAusgabenAlleJahre(bennuzterId: string): Promise<number[][]> {
    let jahr: number[] = []
    let ausgaben: number[] = []
    const map = new Map<number, number>()
    const buchungen = await getAlleAusgaben(bennuzterId)
    for (const buchung of buchungen) {
        const thisjahr = stringToDate(buchung.datum).getFullYear()
        map.set(thisjahr, map.get(thisjahr) ? map.get(thisjahr)! + buchung.betrag : buchung.betrag)
    }
    for (let elem of map) {
        jahr.push(elem[0])
        ausgaben.push(elem[1])
    }
    return [jahr, ausgaben]
}

export async function getEinahmen(benutzerId: string): Promise<number> {
    let einnahmen = 0
    const buchungen = await getAlleEinnahmen(benutzerId)
    for (let i = 0; i < buchungen.length; i++) {
        const buchung = buchungen[i]
        einnahmen += buchung.betrag
    }
    return einnahmen
}


export async function getAusgaben(userId: string): Promise<number> {
    let ausgaben = 0
    const buchungen = await getAlleAusgaben(userId)
    for (let i = 0; i < buchungen.length; i++) {
        const buchung = buchungen[i]
        ausgaben += buchung.betrag
    }
    return ausgaben
}


export async function getPocketProzente(benutzerId: string): Promise<Map<string, number>> {
    let mapProzente = new Map<string, number>()
    const pockets = await getAllePockets(benutzerId)
    let sum = 0
    pockets.forEach((pocket) => {
        sum += pocket.betrag
    })
    pockets.forEach((pocket) => {
        mapProzente.set(pocket.id!, pocket.betrag * 100 / sum)
    })
    return mapProzente
}

export async function getAnzahlBuchungen(benutzerID: string): Promise<Map<string, number>> {
    let map = new Map<string, number>()
    const buchungen = await getAlleBuchungenBenutzer(benutzerID)
    const startDatum = sub(new Date(), { days: 13 })
    for (const buchung of buchungen) {
        if (startDatum < stringToDate(buchung.datum)) {
            const kat = buchung.pocket
            map.set(kat, map.has(kat) ? map.get(kat)! + 1 : 1)
        }
    }
    return map
}

export async function getGesamtvermoegen(benutzerID: string): Promise<Number> {
    let vermoegen = 0
    const pockets = await getAllePockets(benutzerID)
    for (const pocket of pockets) {
        vermoegen += pocket.betrag
    }
    return vermoegen
}

export async function monatsAusgabenKat(benutzerID: string): Promise<Map<string, number>> {
    let map = new Map<string, number>
    const datum = new Date()
    const monat = datum.getMonth()
    const jahr = datum.getFullYear()
    const buchungen = await getAlleAusgaben(benutzerID)
    for (const buchung of buchungen) {
        const buchungsDatum = stringToDate(buchung.datum)
        const buchungsMonat = buchungsDatum.getMonth()
        const buchungsJahr = buchungsDatum.getFullYear()
        if (buchungsMonat == monat && buchungsJahr == jahr) {
            const kat = buchung.kategorie
            map.set(kat, map.has(kat) ? map.get(kat)! + buchung.betrag : buchung.betrag)
        }
    }
    return map
}

export async function jahresAusgabenKat(benutzerID: string): Promise<Map<string, number>> {
    let map = new Map<string, number>
    const datum = new Date()
    const jahr = datum.getFullYear()
    const buchungen = await getAlleAusgaben(benutzerID)
    for (const buchung of buchungen) {
        const buchungsDatum = stringToDate(buchung.datum)
        const buchungsJahr = buchungsDatum.getFullYear()
        if (buchungsJahr == jahr) {
            const kat = buchung.kategorie
            map.set(kat, map.has(kat) ? map.get(kat)! + buchung.betrag : buchung.betrag)
        }
    }
    return map
}

export async function wochenAusgabenKat(benutzerID: string): Promise<Map<string, number>> {
    let map = new Map<string, number>
    const datum = new Date()
    const jahr = datum.getFullYear()
    const monat = datum.getMonth()
    const tag = datum.getDate()
    const wochenTag = datum.getDay()
    const buchungen = await getAlleAusgaben(benutzerID)
    for (const buchung of buchungen) {
        const kat = buchung.kategorie
        const buchungsDatum = stringToDate(buchung.datum)
        const buchungsMonat = buchungsDatum.getMonth()
        const buchungsJahr = buchungsDatum.getFullYear()
        const buchungsTag = buchungsDatum.getDate()

        // Helper-Funktion, um zu prüfen, ob ein Jahr ein Schaltjahr ist
        const istSchaltjahr = (jahr: number): boolean => {
            return (jahr % 4 === 0 && jahr % 100 !== 0) || (jahr % 400 === 0);
        };

        // Anzahl der Tage in jedem Monat
        const tageProMonat = [31, istSchaltjahr(jahr) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        const tageZurueck = wochenTag; // Wie viele Tage zurückgehen
        const startTag = tag - tageZurueck;

        if (startTag > 0) {
            // Gleicher Monat
            if (buchungsTag <= tag && buchungsTag >= startTag && buchungsMonat == monat && buchungsJahr == jahr) {
                map.set(kat, map.has(kat) ? map.get(kat)! + buchung.betrag : buchung.betrag)
            }
        } else {
            // Vorheriger Monat
            const vorherigerMonat = monat === 0 ? 11 : monat - 1;
            const vorherigesJahr = monat === 0 ? jahr - 1 : jahr;
            const tageImVorherigenMonat = tageProMonat[vorherigerMonat];

            if (
                (buchungsTag > tageImVorherigenMonat + startTag && buchungsMonat == vorherigerMonat && buchungsJahr == vorherigesJahr) ||
                (buchungsTag <= tag && buchungsMonat == monat && buchungsJahr == jahr)
            ) {
                map.set(kat, map.has(kat) ? map.get(kat)! + buchung.betrag : buchung.betrag)
            }
        }
    }
    return map
}

type NumNulArray = [number, number | null]

export async function katAusgabenLimit(benutzerID: string): Promise<Map<string, NumNulArray>> {
    let map = new Map<string, NumNulArray>
    const datum = new Date()
    const monat = datum.getMonth()
    const jahr = datum.getFullYear()
    const buchungen = await getAlleAusgaben(benutzerID)
    const kategorien = await getAlleKategorien(benutzerID)
    for (const kat of kategorien) {
        const limit = kat.ausgabenlimit
        map.set(kat.id!, [0, limit ? limit : null])
    }
    for (const buchung of buchungen) {
        const buchungsDatum = stringToDate(buchung.datum)
        const buchungsMonat = buchungsDatum.getMonth()
        const buchungsJahr = buchungsDatum.getFullYear()
        if (buchungsMonat == monat && buchungsJahr == jahr) {
            const kat = buchung.kategorie
            const current = map.get(kat)!
            map.set(kat, [current[0] + buchung.betrag, current[1]])
        }
    }
    return map
}