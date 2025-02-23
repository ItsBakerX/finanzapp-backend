import { getAusgaben, getAusgaben12Monate, getAusgaben4Wochen, getAusgabenAlleJahre, getAusgabenJahr, getAusgabenMonat, getAusgabenWoche, getEinahmen, getEinahmenJahr, getEinahmenMonat, getEinahmenWoche, getGesamtvermoegen, getPocketProzente, monatsAusgabenKat, jahresAusgabenKat, wochenAusgabenKat, getAnzahlBuchungen, katAusgabenLimit } from "../../src/services/StatistikService"
import { Benutzer } from "../../src/models/BenutzerModel"
import { BenutzerResource, BuchungskategorieResource, PocketResource } from "../../src/Resources"
import { createBenutzer } from "../../src/services/BenutzerService"
import { createBuchung } from "../../src/services/BuchungService"
import { createBuchungsKategorie } from "../../src/services/BuchungskategorieService"
import { createPocket } from "../../src/services/PocketService"
import { dateToString } from "../../src/services/ServiceHelper"
import { getWeek, sub } from "date-fns"

let benutzer: BenutzerResource
const passwort = "abcACB123_"
let pocket: PocketResource
let pocket2: PocketResource
let kategorie: BuchungskategorieResource
let kategorie2: BuchungskategorieResource
const datum = new Date()
const datumString = dateToString(datum)

describe("Woche TESTS", () => {
    beforeEach(async () => {

        benutzer = await createBenutzer({ name: "Bruno", email: "test@mail.de", password: passwort })
        await Benutzer.updateOne({ email: benutzer.email }, { active: true })
        pocket = await createPocket({ name: "testPocket", benutzer: benutzer.id!, betrag: 0 })
        pocket2 = await createPocket({ name: "testPocket2", benutzer: benutzer.id!, betrag: 0 })

        kategorie = await createBuchungsKategorie({ name: "testkat", benutzer: benutzer.id! })
        kategorie2 = await createBuchungsKategorie({ name: "testkat2", benutzer: benutzer.id! })

        const vergangeWoche = dateToString(sub(datum, { days: 7 }))
        const vergangeWoche2 = dateToString(sub(datum, { days: 14 }))
        const vergangeWoche3 = dateToString(sub(datum, { days: 21 }))
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeWoche", datum: datumString, betrag: 50, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket2.id!, name: "einahmeWoche2", datum: datumString, betrag: 150, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeVergangenWoche", datum: vergangeWoche, betrag: 75, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeVergangenWoche2", datum: vergangeWoche2, betrag: 75, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeAlt", datum: "01.05.2023", betrag: 50, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie2.id!, pocket: pocket.id!, name: "ausgabeWoche1", datum: datumString, betrag: 50, typ: "ausgabe" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "ausgabeWoche2", datum: datumString, betrag: 100, typ: "ausgabe" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "ausgabeVergangenWoche", datum: vergangeWoche, betrag: 75, typ: "ausgabe" })
        await createBuchung({ kategorie: kategorie2.id!, pocket: pocket.id!, name: "ausgabeVergangenWoche2", datum: vergangeWoche2, betrag: 25, typ: "ausgabe" })
        await createBuchung({ kategorie: kategorie2.id!, pocket: pocket.id!, name: "ausgabeVergangenWoche3", datum: vergangeWoche3, betrag: 25, typ: "ausgabe" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket2.id!, name: "ausgabeAlt", datum: "01.05.2023", betrag: 150, typ: "ausgabe" })

    })

    test("soll die gesamten Einnahmen der aktuellen Woche berechnen", async () => {
        const einnahmen = await getEinahmenWoche(benutzer.id!);
        expect(einnahmen).toBe(200);
    });

    test("soll die gesamten Ausgaben der aktuellen Woche berechnen", async () => {
        const ausgaben = await getAusgabenWoche(benutzer.id!);
        expect(ausgaben).toBe(150);
    });

    test("ausgaben 4 wocehn", async () => {
        const ausgaben = await getAusgaben4Wochen(benutzer.id!)
        const date = new Date()
        expect(ausgaben[0].length).toBe(4)
        expect(ausgaben[1].length).toBe(4)
        expect(ausgaben[0]).toEqual([getWeek(date), getWeek(sub(date, { days: 7 })), getWeek(sub(date, { days: 14 })), getWeek(sub(date, { days: 21 }))])
        expect(ausgaben[1]).toEqual([150, 75, 25, 25])
    })

    test("Kategorie Ausgaben woechentlich", async () => {
        const map = await wochenAusgabenKat(benutzer.id!)
        expect(map.size).toBe(2)
        expect(map.get(kategorie.id!)).toBe(100)
        expect(map.get(kategorie2.id!)).toBe(50)
    })

    test("anzahl Buchungen", async () => {
        const map = await getAnzahlBuchungen(benutzer.id!)
        expect(map.size).toBe(2)
        expect(map.get(pocket.id!)).toBe(5)
        expect(map.get(pocket2.id!)).toBe(1)
    })
})


describe("Monat tests", () => {
    beforeEach(async () => {

        benutzer = await createBenutzer({ name: "Bruno", email: "test@mail.de", password: passwort })
        await Benutzer.updateOne({ email: benutzer.email }, { active: true })
        pocket = await createPocket({ name: "testPocket", benutzer: benutzer.id!, betrag: 0 })
        pocket2 = await createPocket({ name: "testPocket2", benutzer: benutzer.id!, betrag: 0 })

        kategorie = await createBuchungsKategorie({ name: "testkat", benutzer: benutzer.id!, ausgabenlimit: 245 })
        kategorie2 = await createBuchungsKategorie({ name: "testkat2", benutzer: benutzer.id! })

        const monat = datum.getMonth() + 1
        const jahr = datum.getFullYear()

        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeWoche", datum: datumString, betrag: 50, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket2.id!, name: "einahmeWoche2", datum: datumString, betrag: 150, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeMonat", datum: `01.${monat}.${jahr}`, betrag: 75, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeAlt", datum: "10.04.2023", betrag: 50, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie2.id!, pocket: pocket.id!, name: "ausgabe1", datum: datumString, betrag: 50, typ: "ausgabe" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "ausgabe2", datum: datumString, betrag: 100, typ: "ausgabe" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "ausgabeMonat", datum: `01.${monat}.${jahr}`, betrag: 69, typ: "ausgabe" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket2.id!, name: "ausgabeAlt", datum: "01.05.2023", betrag: 150, typ: "ausgabe" })
        for (let i = 1; i <= 12; i++) {
            const monatDatum = dateToString(sub(datum, { months: i }))
            await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "ausgabeMonat" + i, datum: monatDatum, betrag: 20 * i, typ: "ausgabe" })
        }
    })

    test("soll die gesamten Einnahmen des aktuellen Monats berechnen", async () => {
        const einnahmen = await getEinahmenMonat(benutzer.id!);
        expect(einnahmen).toBe(275);
    });

    test("soll die gesamten Ausgaben des aktuellen Monats berechnen", async () => {
        const ausgaben = await getAusgabenMonat(benutzer.id!);
        expect(ausgaben).toBe(219);
    });

    test("ausgaben 12 Monat", async () => {
        const ausgaben = await getAusgaben12Monate(benutzer.id!)
        const monate = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        expect(ausgaben[0].length).toBe(12)
        expect(ausgaben[1].length).toBe(12)
        expect(monate.every((mon) => ausgaben[0].includes(mon))).toBeTruthy()
        expect(ausgaben[1]).toEqual([219, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220])
    })

    test("Kategorie Ausgaben Monatlich", async () => {
        await createBuchung({ kategorie: kategorie2.id!, pocket: pocket.id!, name: "ausgabe3", datum: datumString, betrag: 100, typ: "ausgabe" })
        const map = await monatsAusgabenKat(benutzer.id!)
        expect(map.size).toBe(2)
        expect(map.get(kategorie.id!)).toBe(169)
        expect(map.get(kategorie2.id!)).toBe(150)
    })


    test("Kategorie Ausgaben Limit", async () => {
        await createBuchung({ kategorie: kategorie2.id!, pocket: pocket.id!, name: "ausgabe3", datum: datumString, betrag: 100, typ: "ausgabe" })
        const map = await katAusgabenLimit(benutzer.id!)
        console.log(map)
        expect(map.size).toBe(9)
        expect(map.get(kategorie.id!)).toEqual([169, 245])
        expect(map.get(kategorie2.id!)).toEqual([150, null])
    })
})

describe("Jahres und Daumsunabhängige Tests", () => {
    beforeEach(async () => {

        benutzer = await createBenutzer({ name: "Bruno", email: "test@mail.de", password: passwort })
        await Benutzer.updateOne({ email: benutzer.email }, { active: true })
        pocket = await createPocket({ name: "testPocket", benutzer: benutzer.id!, betrag: 0 })
        pocket2 = await createPocket({ name: "testPocket2", benutzer: benutzer.id!, betrag: 0 })

        kategorie = await createBuchungsKategorie({ name: "testkat", benutzer: benutzer.id! })
        kategorie2 = await createBuchungsKategorie({ name: "testkat2", benutzer: benutzer.id! })

        const monat = datum.getMonth() + 1
        const jahr = datum.getFullYear()
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeWoche", datum: datumString, betrag: 50, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket2.id!, name: "einahmeWoche2", datum: datumString, betrag: 150, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeWoche", datum: `01.${monat}.${jahr}`, betrag: 75, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeJahr", datum: `01.01.${jahr}`, betrag: 75, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "einahmeAlt", datum: "10.04.2023", betrag: 50, typ: "einzahlung" })
        await createBuchung({ kategorie: kategorie2.id!, pocket: pocket.id!, name: "ausgabe1", datum: datumString, betrag: 50, typ: "ausgabe" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "ausgabe2", datum: datumString, betrag: 100, typ: "ausgabe" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket.id!, name: "ausgabeMonat", datum: `01.${monat}.${jahr}`, betrag: 75, typ: "ausgabe" })
        await createBuchung({ kategorie: kategorie2.id!, pocket: pocket.id!, name: "ausgabeJahr", datum: `01.01.${jahr}`, betrag: 25, typ: "ausgabe" })
        await createBuchung({ kategorie: kategorie.id!, pocket: pocket2.id!, name: "ausgabeAlt", datum: "01.05.2023", betrag: 150, typ: "ausgabe" })

    })

    test("soll die gesamten Einnahmen des aktuellen Jahres berechnen", async () => {
        const einnahmen = await getEinahmenJahr(benutzer.id!);
        expect(einnahmen).toBe(350);
    });

    test("soll die gesamten Ausgaben des aktuellen Jahres berechnen", async () => {
        const ausgaben = await getAusgabenJahr(benutzer.id!);
        expect(ausgaben).toBe(250);
    });

    test("soll die gesamten Einnahmen berechnen", async () => {
        const einnahmen = await getEinahmen(benutzer.id!);
        expect(einnahmen).toBe(400);
    });

    test("soll die gesamten Ausgaben  berechnen", async () => {
        const ausgaben = await getAusgaben(benutzer.id!);
        expect(ausgaben).toBe(400);
    });


    test("prozente pocket", async () => {
        const pocket5 = await createPocket({ name: "testPocket5", benutzer: benutzer.id!, betrag: 100 })
        const pocket3 = await createPocket({ name: "testPocket3", benutzer: benutzer.id!, betrag: 50 })
        const pocket4 = await createPocket({ name: "testPocket4", benutzer: benutzer.id!, betrag: 350 })

        const prozente = await getPocketProzente(benutzer.id!)
        expect(prozente.get(pocket.id!)).toBe(0)
        expect(prozente.get(pocket2.id!)).toBe(0)
        expect(prozente.get(pocket5.id!)).toBe(20)
        expect(prozente.get(pocket3.id!)).toBe(10)
        expect(prozente.get(pocket4.id!)).toBe(70)
    })

    test("ausgaben alleJahre", async () => {
        const ausgaben = await getAusgabenAlleJahre(benutzer.id!)
        expect(ausgaben[0].length).toBeGreaterThanOrEqual(2)
        expect(ausgaben[1].length).toBeGreaterThanOrEqual(2)
        expect(ausgaben[1][0]).toBe(250)
        console.log(ausgaben)
        const sum = ausgaben[1].reduce((acc, val) => acc + val, 0);
        expect(sum).toBe(400)

    })

    test("gesamtvermoegen", async () => {
        let vermoegen = await getGesamtvermoegen(benutzer.id!)
        expect(vermoegen).toBe(0)
        const pocket2 = await createPocket({ name: "testPocket3", benutzer: benutzer.id!, betrag: 100 })
        const pocket3 = await createPocket({ name: "testPocket4", benutzer: benutzer.id!, betrag: 50 })
        vermoegen = await getGesamtvermoegen(benutzer.id!)
        expect(vermoegen).toBe(150)
    })

    test("Kategorie Ausgaben Jaehrlich", async () => {
        const map = await jahresAusgabenKat(benutzer.id!)
        expect(map.size).toBe(2)
        expect(map.get(kategorie.id!)).toBe(175)
        expect(map.get(kategorie2.id!)).toBe(75)
    })
})















