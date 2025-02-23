import { HydratedDocument } from "mongoose"
import { Benutzer, IBenutzer } from "../../src/models/BenutzerModel"
import { Buchungskategorie, IBuchungskategorie } from "../../src/models/BuchungskategorieModel"
import { createBuchungsKategorie, deleteBuchungsKategorie, getAlleEigeneKategorien, getAlleStandardKategorien, getBuchungskategorie, updateBuchungskategorie } from "../../src/services/BuchungskategorieService"
import { createBuchung, getBuchungById } from "../../src/services/BuchungService"
import { createPocket } from "../../src/services/PocketService"

let benutzer: HydratedDocument<IBenutzer>
let eigeneKat1: HydratedDocument<IBuchungskategorie>
let eigeneKat2: HydratedDocument<IBuchungskategorie>
let StandardKat1: HydratedDocument<IBuchungskategorie>
let StandardKat6: HydratedDocument<IBuchungskategorie>

beforeEach(async () => {
    const StandardKategorien = ["Wohnen", "Einkauf", "Freizeit", "Transport", "Versicherung", "Sonstiges"]

    benutzer = await Benutzer.create({ name: "henry", email: "mail@mail.de", password: "abc123???A" })

    StandardKat1 = await Buchungskategorie.create({ benutzer: benutzer.id, name: StandardKategorien[0] })
    const StandardKat2 = await Buchungskategorie.create({ benutzer: benutzer.id, name: StandardKategorien[1] })
    const StandardKat3 = await Buchungskategorie.create({ benutzer: benutzer.id, name: StandardKategorien[2] })
    const StandardKat4 = await Buchungskategorie.create({ benutzer: benutzer.id, name: StandardKategorien[3] })
    const StandardKat5 = await Buchungskategorie.create({ benutzer: benutzer.id, name: StandardKategorien[4] })
    StandardKat6 = await Buchungskategorie.create({ benutzer: benutzer.id, name: StandardKategorien[5] })

    eigeneKat1 = await Buchungskategorie.create({ benutzer: benutzer.id, name: "Drogen", ausgabenlimit: 675 });
    eigeneKat2 = await Buchungskategorie.create({ benutzer: benutzer.id, name: "Sport", ausgabenlimit: 55 });
})

test("getAlleEigeneKategorien", async () => {
    const alleKategorien = await getAlleEigeneKategorien(benutzer.id)
    expect(alleKategorien.length).toBe(2)
    expect(alleKategorien[0].name).toBe("Drogen")
    expect(alleKategorien[0].id).toBe(eigeneKat1.id)
    expect(alleKategorien[0].ausgabenlimit).toBe(675)
})

test("getAlleEigeneKategorien negativ", async () => {
    expect(async () => { await getAlleEigeneKategorien("000000000000000000000000") })
        .rejects
        .toThrowError("Benutzer nicht gefunden")

})

test("getAlleStandardKategorien", async () => {
    const alleKategorien = await getAlleStandardKategorien(benutzer.id)
    expect(alleKategorien.length).toBe(6)
    expect(alleKategorien[0].name).toBe("Einkauf")
    expect(alleKategorien[0].ausgabenlimit).not.toBeDefined()
})

test("getAlleStandardKategorien negativ", async () => {
    expect(async () => { await getAlleStandardKategorien("000000000000000000000000") })
        .rejects
        .toThrowError("Benutzer nicht gefunden")

})

test("createBuchungskategorie", async () => {
    const kat = await createBuchungsKategorie({ benutzer: benutzer.id, name: "Pflanzen", ausgabenlimit: 42.54 })
    expect(kat.name).toBe("Pflanzen")
    expect(kat.id).toBeDefined()
    expect(kat.ausgabenlimit).toBe(42.54)
    expect(kat.benutzer).toBe(benutzer.id)
})

test("getBuchungskategorie", async () => {
    const kat = await getBuchungskategorie(eigeneKat1.id)
    expect(kat.id).toBe(eigeneKat1.id)
    expect(kat.name).toBe(eigeneKat1.name)
    expect(kat.ausgabenlimit).toBe(eigeneKat1.ausgabenlimit)
    expect(kat.benutzer).toBe(eigeneKat1.benutzer.toString())
})

test("getBuchungskategorie negativ", async () => {
    expect(async () => { await getBuchungskategorie("000000000000000000000000") })
        .rejects
        .toThrowError("Buchungskategorie nicht gefunden")

})


test("createBuchunggsKategorie Negativ falsche BenutzerId", async () => {
    expect(async () => { await createBuchungsKategorie({ benutzer: "000000000000000000000000", name: "Pflanzen", ausgabenlimit: 42.54 }) })
        .rejects
        .toThrowError("Benutzer nicht gefunden")
})

test("createBuchunggsKategorie Negativ name nicht uniqe", async () => {
    await expect(async () => { await createBuchungsKategorie({ benutzer: benutzer.id, name: "Drogen", ausgabenlimit: 42.54 }) })
        .rejects
        .toThrow("Kategorie existiert bereits")
})

test("update Buchungskategorie (eigene)", async () => {
    const kat = await updateBuchungskategorie({ id: eigeneKat1.id, name: "Drogen und Alkohol", ausgabenlimit: 700 })
    expect(kat.name).toBe("Drogen und Alkohol")
    expect(kat.ausgabenlimit).toBe(700)
})

test("update Buchungskategorie (eigene)", async () => {
    const kat = await updateBuchungskategorie({ id: StandardKat1.id, name: "Drogen und Alkohol", ausgabenlimit: 700 })
    expect(kat.name).toBe("Wohnen")
    expect(kat.ausgabenlimit).toBe(700)
})

test("update negativ Kategorie existiert nicht", async () => {
    expect(async () => { await updateBuchungskategorie({ id: "000000000000000000000000", name: "Drogen", ausgabenlimit: 42.54 }) })
        .rejects
        .toThrow()
})

// test("update negativ Kategorie existiert nicht", async () => {
//     expect(async () => { await updateBuchungskategorie({ id: eigeneKat1.id, name: "Versicherung", ausgabenlimit: 42.54 }) })
//         .rejects
//         .toThrow()
// })

test("deleteBuchungskategorie negativ falsche id", async () => {
    expect(async () => { await deleteBuchungsKategorie("000000000000000000000000") })
        .rejects
        .toThrowError("Buchungskategorie nicht gefunden")
})

test("deleteBuchungskategorie negativ Standardkategorie löschen", async () => {
    expect(async () => { await deleteBuchungsKategorie(StandardKat1.id) })
        .rejects
        .toThrowError("Standardkategorie kann nicht gelöscht werden")
})

test("deleteBuchungskategorie positiv", async () => {
    const pocket = await createPocket({ name: "testPocket", benutzer: benutzer.id, betrag: 200 })
    const buchung = await createBuchung({ name: "test", kategorie: eigeneKat1.id, pocket: pocket.id!, datum: "12.12.2023", betrag: 50, typ: "ausgabe" })
    await deleteBuchungsKategorie(eigeneKat1.id)

    expect(await Buchungskategorie.findById(eigeneKat1.id)).not.toBeDefined

    const updatedBuchung = await getBuchungById(buchung.id!)
    expect(updatedBuchung.kategorie).toEqual(StandardKat6.id)
})
