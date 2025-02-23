import { HydratedDocument, Types } from "mongoose";
import { IPocket, Pocket } from "../../src/models/PocketModel";
import { Benutzer, IBenutzer } from "../../src/models/BenutzerModel";
import { createBuchung, deleteBuchung, getAlleAusgaben, getAlleBuchungen, getAlleBuchungenBenutzer, getAlleBuchungenKategorie, getAlleEinnahmen, getAlleWiederkehrendeBuchungen, getAlleZukunftBuchungen, getBuchungById, updateBuchung, zukunftBuchungAusfuehren } from "../../src/services/BuchungService";
import { EinmaligeBuchung } from "../../src/models/EinmaligeBuchungModel";
import { WiederkehrendeBuchung } from "../../src/models/WiederkehrendeBuchungModel";
import { dateToString, stringToDate } from "../../src/services/ServiceHelper";
import { Buchungskategorie, IBuchungskategorie } from "../../src/models/BuchungskategorieModel";
import { Ubertrag } from "../../src/models/UbertragModel";
import { BuchungResource } from "src/Resources";
import { Sparziel } from "../../src/models/SparzielModel";
import { getPocket } from "../../src/services/PocketService";


describe("BuchungService", () => {
    let benutzer: HydratedDocument<IBenutzer>;
    let pocket: HydratedDocument<IPocket>
    let pocket2: HydratedDocument<IPocket>
    let pocket3: HydratedDocument<IPocket>
    let kategorie1: HydratedDocument<IBuchungskategorie>
    let kategorie2: HydratedDocument<IBuchungskategorie>

    beforeEach(async () => {
        benutzer = await Benutzer.create({
            email: "example@email.com",
            name: "Test",
            password: "password"
        });
        pocket = await Pocket.create({
            name: "TestPocket",
            betrag: 1000,
            benutzer: benutzer.id
        })
        pocket2 = await Pocket.create({
            name: "TestPocket2",
            betrag: 500,
            benutzer: benutzer.id
        })
        pocket3 = await Pocket.create({
            name: "TestPocket3",
            betrag: 2000,
            benutzer: benutzer.id
        })
        kategorie1 = await Buchungskategorie.create({
            name: "TestKategorie1",
            benutzer: benutzer.id
        })
        kategorie2 = await Buchungskategorie.create({
            name: "TestKategorie2",
            benutzer: benutzer.id
        })
    });

    test("Buchungservice get all 0 Buchungen", async () => {
        expect(pocket).toBeDefined();
        const buchungen = await getAlleBuchungen(pocket.id);
        expect(buchungen.length).toBe(0);
    });

    test("Buchungservice get all", async () => {
        expect(pocket).toBeDefined();
        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("20.10.2024"),
            betrag: 100,
            typ: "ausgabe"
        });
        await WiederkehrendeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("21.10.2024"),
            betrag: 100,
            typ: "ausgabe",
            intervall: "monat"
        });
        await Ubertrag.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("21.10.2024"),
            betrag: 100,
            typ: "ausgabe",
            zielPocket: pocket2.id
        });

        const buchungen = await getAlleBuchungen(pocket.id);
        expect(buchungen.length).toBe(2);
    });

    test("Buchungservice get all Kategorie", async () => {
        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate("20.10.2024"),
            betrag: 100,
            typ: "ausgabe"
        });

        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie2.id,
            datum: stringToDate("20.10.2024"),
            betrag: 100,
            typ: "ausgabe"
        });

        await WiederkehrendeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate("21.10.2024"),
            betrag: 100,
            typ: "ausgabe",
            intervall: "monat"
        });
        await Ubertrag.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate("21.10.2024"),
            betrag: 100,
            typ: "ausgabe",
            zielPocket: pocket2.id
        });

        const buchungenKat1 = await getAlleBuchungenKategorie(kategorie1.id);
        expect(buchungenKat1.length).toBe(2);
        const buchungenKat2 = await getAlleBuchungenKategorie(kategorie2.id);
        expect(buchungenKat2.length).toBe(1);
    });

    test("Buchungservice get all Kategorie", async () => {
        expect(async () => await getAlleBuchungenKategorie("000000000000000000000000")).rejects.toThrow("Buchungskategorie mit ID 000000000000000000000000 nicht gefunden")
    });

    test("Buchungservice get all Benutzer", async () => {
        expect(pocket).toBeDefined();
        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket2.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("20.10.2024"),
            betrag: 100,
            typ: "ausgabe"
        });
        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket2.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("20.10.2500"),
            betrag: 100,
            typ: "ausgabe",
            zukunft: true
        });
        await WiederkehrendeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("21.10.2024"),
            betrag: 100,
            typ: "ausgabe",
            intervall: "monat"
        });
        await Ubertrag.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("21.10.2024"),
            betrag: 100,
            typ: "ausgabe",
            zielPocket: pocket2.id
        });

        const buchungen = await getAlleBuchungenBenutzer(benutzer.id);
        expect(buchungen.length).toBe(2);
    });

    test("Buchungservice get all Zukunft", async () => {
        expect(pocket).toBeDefined();
        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket2.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("20.10.2000"),
            betrag: 100,
            typ: "ausgabe"
        });
        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("01.01.2500"),
            betrag: 100,
            typ: "ausgabe",
            zukunft: true
        });
        await Ubertrag.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("21.10.2500"),
            betrag: 100,
            typ: "ausgabe",
            zielPocket: pocket2.id,
            zukunft: true
        });

        const buchungen = await getAlleZukunftBuchungen(benutzer.id);
        expect(buchungen.length).toBe(2);
    });

    test("Buchungservice EinmaligeZukunft Ausführen", async () => {
        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("01.01.2500"),
            betrag: 100,
            typ: "ausgabe",
            zukunft: true
        });


        const buchungen = await getAlleZukunftBuchungen(benutzer.id);
        expect(buchungen.length).toBe(1);
        await zukunftBuchungAusfuehren(buchungen[0].id!)
        const updatedPocket = await getPocket(pocket.id)
        expect(updatedPocket.betrag).toBe(900)
        const updatedBuchung = await EinmaligeBuchung.findById(buchungen[0].id!).exec()
        expect(updatedBuchung!.zukunft).toBe(false)
        expect(dateToString(updatedBuchung!.datum)).toBe(dateToString(new Date()))
    });

    test("Buchungservice UbertragZukunft Ausführen", async () => {
        await Ubertrag.create({
            name: "TestBuchung",
            pocket: pocket.id,
            zielPocket: pocket2.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("01.01.2500"),
            betrag: 100,
            typ: "ausgabe",
            zukunft: true
        });


        const buchungen = await getAlleZukunftBuchungen(benutzer.id);
        expect(buchungen.length).toBe(1);
        await zukunftBuchungAusfuehren(buchungen[0].id!)
        const updatedPocket = await getPocket(pocket.id)
        const updatedZielPocket = await getPocket(pocket2.id)
        expect(updatedPocket.betrag).toBe(900)
        expect(updatedZielPocket.betrag).toBe(600)
        const updatedBuchung = await Ubertrag.findById(buchungen[0].id!).exec()
        expect(updatedBuchung!.zukunft).toBe(false)
        expect(dateToString(updatedBuchung!.datum)).toBe(dateToString(new Date()))
    });

    test("Buchungsservice get all Benutzer Error", async () => {
        expect(async () => {
            await getAlleBuchungenBenutzer("000000000000000000000000")
        }).rejects.toThrowError("Kein Benutzer mit dieser ID gefunden")
    })

    test("Buchungservice get all Wiederkehrende", async () => {
        expect(pocket).toBeDefined();
        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("20.10.2024"),
            betrag: 100,
            typ: "ausgabe"
        });
        await WiederkehrendeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("21.10.2024"),
            betrag: 100,
            typ: "ausgabe",
            intervall: "monat"
        });
        await WiederkehrendeBuchung.create({
            name: "TestBuchung",
            pocket: pocket2.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("22.10.2024"),
            betrag: 100,
            typ: "ausgabe",
            intervall: "monat"
        });
        await Ubertrag.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("21.10.2024"),
            betrag: 100,
            typ: "ausgabe",
            zielPocket: pocket2.id
        });

        const buchungen = await getAlleWiederkehrendeBuchungen(benutzer.id);
        expect(buchungen.length).toBe(2);
        expect(buchungen[0].name).toBe("TestBuchung")
        expect(buchungen[0].betrag).toBe(100)
        expect(buchungen[0].pocket).toBe(pocket2.id)
        expect(buchungen[0].datum).toBe("22.10.2024")
    });

    test("Buchungservice get all Wiederkehrende Error", async () => {
        expect(async () => {
            await getAlleWiederkehrendeBuchungen("000000000000000000000000")
        }).rejects.toThrowError("Kein Benutzer mit dieser ID gefunden")
    });


    test("BuchungsService getalleEinnahmen", async () => {
        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("20.10.2024"),
            betrag: 100,
            typ: "ausgabe"
        });
        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("20.10.2024"),
            betrag: 100,
            typ: "einzahlung"
        });
        await WiederkehrendeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("21.10.2024"),
            betrag: 100,
            typ: "einzahlung",
            intervall: "monat"
        });
        await Ubertrag.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("21.10.2024"),
            betrag: 100,
            typ: "einzahlung",
            zielPocket: pocket2.id
        });
        const buchungen = await getAlleEinnahmen(benutzer.id)
        expect(buchungen.length).toBe(2)

    })

    test("BuchungsService getalleEinnahmen", async () => {
        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("20.10.2024"),
            betrag: 100,
            typ: "ausgabe"
        });
        await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("20.10.2024"),
            betrag: 100,
            typ: "einzahlung"
        });
        await WiederkehrendeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("21.10.2024"),
            betrag: 100,
            typ: "einzahlung",
            intervall: "monat"
        });
        await Ubertrag.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: "661ea9f1d8c3a77bdc368c70",
            datum: stringToDate("21.10.2024"),
            betrag: 100,
            typ: "ausgabe",
            zielPocket: pocket2.id
        });
        const buchungen = await getAlleAusgaben(benutzer.id)
        expect(buchungen.length).toBe(2)
    })

    test("getBuchungById einmalig", async () => {
        const resource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate("20.10.2024"),
            betrag: 100,
            typ: "ausgabe",
        }
        const buchung = await EinmaligeBuchung.create(resource)
        const fetchedBuchung = await getBuchungById(buchung.id!)
        expect(fetchedBuchung).toBeDefined()
        expect(fetchedBuchung).toMatchObject({ ...resource, datum: "20.10.2024", notiz: undefined })
    })

    test("getBuchungById wiederkehrend + einmalig", async () => {
        const resource: BuchungResource = {
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: "20.10.2024",
            betrag: 100,
            typ: "ausgabe",
            intervall: "monat",
            notiz: "TestNotiz"
        }
        const buchung = await createBuchung(resource)
        const wiederkehrendeBuchung = await getBuchungById(buchung.id!)
        expect(wiederkehrendeBuchung).toBeDefined()
        expect(wiederkehrendeBuchung).toMatchObject(resource)
        const buchungen = await getAlleBuchungen(pocket.id)
        expect(buchungen.length).toBe(1)
        delete resource.intervall
        expect(buchungen[0]).toMatchObject(resource)
        // added fromWiederkehrend
        expect(buchungen[0].fromWiederkehrend).toBe(true)
    })

    test("Create EinmaligeBuchung Zukunft", async () => {
        const buchung = await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: "01.01.2500",
            betrag: 50,
            typ: "einzahlung",
            notiz: "TestNotiz"
        })
        expect(Types.ObjectId.isValid(buchung.id!)).toBeTruthy()
        expect(buchung.name).toBe("TestBuchung")
        expect(buchung.pocket).toBe(pocket.id)
        expect(buchung.kategorie).toBe(kategorie1.id)
        expect(buchung.datum).toBe("01.01.2500")
        expect(buchung.betrag).toBe(50)
        expect(buchung.typ).toBe("einzahlung")
        expect(buchung.notiz).toBe("TestNotiz")
        expect(buchung.zukunft).toBe(true)
        // added fromWiederkehrend
        expect(buchung.fromWiederkehrend).toBe(false)
        const updatedPocket = await Pocket.findById(pocket.id).exec()
        expect(updatedPocket!.betrag).toBe(1000)
    })

    test("Create EinmaligeBuchung Einzahlung", async () => {
        const buchung = await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung",
            notiz: "TestNotiz"
        })
        expect(Types.ObjectId.isValid(buchung.id!)).toBeTruthy()
        expect(buchung.name).toBe("TestBuchung")
        expect(buchung.pocket).toBe(pocket.id)
        expect(buchung.kategorie).toBe(kategorie1.id)
        expect(buchung.datum).toBe("22.10.2024")
        expect(buchung.betrag).toBe(50)
        expect(buchung.typ).toBe("einzahlung")
        expect(buchung.notiz).toBe("TestNotiz")
        // added fromWiederkehrend
        expect(buchung.fromWiederkehrend).toBe(false)
        const updatedPocket = await Pocket.findById(pocket.id).exec()
        expect(updatedPocket!.betrag).toBe(1050)
    })

    test("Create EinmaligeBuchung Ausgabe", async () => {
        const buchung = await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            notiz: "TestNotiz"
        })
        expect(Types.ObjectId.isValid(buchung.id!)).toBeTruthy()
        expect(buchung.name).toBe("TestBuchung")
        expect(buchung.pocket).toBe(pocket.id)
        expect(buchung.kategorie).toBe(kategorie1.id)
        expect(buchung.datum).toBe("22.10.2024")
        expect(buchung.betrag).toBe(50)
        expect(buchung.typ).toBe("ausgabe")
        expect(buchung.notiz).toBe("TestNotiz")
        const updatedPocket = await Pocket.findById(pocket.id).exec()
        expect(updatedPocket!.betrag).toBe(950)
    })

    test("Create WiederkehrendeBuchung Ausgabe", async () => {
        const buchung = await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            intervall: "monat",
            notiz: "TestNotiz"
        })
        expect(Types.ObjectId.isValid(buchung.id!)).toBeTruthy()
        expect(buchung.name).toBe("TestBuchung")
        expect(buchung.pocket).toBe(pocket.id)
        expect(buchung.kategorie).toBe(kategorie1.id)
        expect(buchung.datum).toBe("22.10.2024")
        expect(buchung.betrag).toBe(50)
        expect(buchung.typ).toBe("ausgabe")
        expect(buchung.intervall).toBe("monat")
        expect(buchung.notiz).toBe("TestNotiz")
        const updatedPocket = await Pocket.findById(pocket.id).exec()
        expect(updatedPocket!.betrag).toBe(950)
    })

    test("Create WiederkehrendeBuchung Einzahlung", async () => {
        const buchung = await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "einzahlung",
            intervall: "monat",
            notiz: "TestNotiz"
        })
        expect(Types.ObjectId.isValid(buchung.id!)).toBeTruthy()
        expect(buchung.name).toBe("TestBuchung")
        expect(buchung.pocket).toBe(pocket.id)
        expect(buchung.kategorie).toBe(kategorie1.id)
        expect(buchung.datum).toBe("22.10.2024")
        expect(buchung.betrag).toBe(50)
        expect(buchung.typ).toBe("einzahlung")
        expect(buchung.intervall).toBe("monat")
        expect(buchung.notiz).toBe("TestNotiz")
        const updatedPocket = await Pocket.findById(pocket.id).exec()
        expect(updatedPocket!.betrag).toBe(1050)
    })

    test("Create Uebertrag", async () => {
        const buchung = await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: "22.10.2024",
            betrag: 50,
            typ: "ausgabe",
            zielPocket: pocket2.id,
            notiz: "TestNotiz"
        })
        expect(Types.ObjectId.isValid(buchung.id!)).toBeTruthy()
        expect(buchung.name).toBe("TestBuchung")
        expect(buchung.pocket).toBe(pocket.id)
        expect(buchung.kategorie).toBe(kategorie1.id)
        expect(buchung.datum).toBe("22.10.2024")
        expect(buchung.betrag).toBe(50)
        expect(buchung.typ).toBe("ausgabe")
        expect(buchung.zielPocket).toBe(pocket2.id)
        expect(buchung.notiz).toBe("TestNotiz")
        const updatedPocket = await Pocket.findById(pocket.id).exec()
        expect(updatedPocket!.betrag).toBe(950)
        const updatedPocket2 = await Pocket.findById(pocket2.id).exec()
        expect(updatedPocket2!.betrag).toBe(550)
    })

    test("Create Uebertrag Zukunft", async () => {
        const buchung = await createBuchung({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: "01.01.2500",
            betrag: 50,
            typ: "ausgabe",
            zielPocket: pocket2.id,
            notiz: "TestNotiz"
        })
        expect(Types.ObjectId.isValid(buchung.id!)).toBeTruthy()
        expect(buchung.name).toBe("TestBuchung")
        expect(buchung.pocket).toBe(pocket.id)
        expect(buchung.kategorie).toBe(kategorie1.id)
        expect(buchung.datum).toBe("01.01.2500")
        expect(buchung.betrag).toBe(50)
        expect(buchung.typ).toBe("ausgabe")
        expect(buchung.zielPocket).toBe(pocket2.id)
        expect(buchung.notiz).toBe("TestNotiz")
        expect(buchung.zukunft).toBe(true)
        const updatedPocket = await Pocket.findById(pocket.id).exec()
        expect(updatedPocket!.betrag).toBe(1000)
        const updatedPocket2 = await Pocket.findById(pocket2.id).exec()
        expect(updatedPocket2!.betrag).toBe(500)
    })

    test("Create Uebertrag einzahung", async () => {
        await expect(async () => {
            const buchung = await createBuchung({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "einzahlung",
                zielPocket: pocket2.id
            })
        }).rejects.toThrowError("typ: einzahlung not applicable for Uebertrag")

    })

    test("Create Uebertrag ZielPocket not found", async () => {
        await expect(async () => {
            const buchung = await createBuchung({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "einzahlung",
                zielPocket: "000000000000000000000000"
            })
        }).rejects.toThrowError("ZielPocket not found")

    })

    test("Create Uebertrag Pocket not found", async () => {
        await expect(async () => {
            const buchung = await createBuchung({
                name: "TestBuchung",
                pocket: "000000000000000000000000",
                kategorie: kategorie1.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "einzahlung",
            })
        }).rejects.toThrowError("Pocket not found")

    })

    test("Create Uebertrag Attributes do not match any Subclass of Buchung", async () => {
        await expect(async () => {
            const buchung = await createBuchung({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: "22.10.2024",
                betrag: 50,
                typ: "einzahlung",
                intervall: "monat",
                zielPocket: pocket2.id
            })
        }).rejects.toThrowError("Attributes do not match any Subclass of Buchung")

    })



    test("Delete EinmaligeBuchung", async () => {
        const buchung = await EinmaligeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate("20.10.2024"),
            betrag: 100,
            typ: "ausgabe"
        });
        await deleteBuchung(buchung.id)
        expect(await EinmaligeBuchung.findById(buchung.id)).toBeNull()
        expect((await Pocket.findById(pocket.id))!.betrag).toBe(1100)
    })

    test("Delete WiederkehrendeBuchung", async () => {
        const buchung = await WiederkehrendeBuchung.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate("20.10.2024"),
            betrag: 100,
            typ: "ausgabe",
            intervall: "monat"
        });
        await deleteBuchung(buchung.id)
        expect(await WiederkehrendeBuchung.findById(buchung.id)).toBeNull()
        expect((await Pocket.findById(pocket.id))!.betrag).toBe(1000)
    })

    test("Delete Ubertrag", async () => {
        const buchung = await Ubertrag.create({
            name: "TestBuchung",
            pocket: pocket.id,
            kategorie: kategorie1.id,
            datum: stringToDate("20.10.2024"),
            betrag: 75,
            typ: "einzahlung",
            zielPocket: pocket2.id
        });
        await deleteBuchung(buchung.id)
        expect(await Ubertrag.findById(buchung.id)).toBeNull()
        expect((await Pocket.findById(pocket.id))!.betrag).toBe(925)
    })

    test("Delete Buchung invalid id", async () => {
        await expect(async () =>
            await deleteBuchung("abc")
        ).rejects.toThrowError("Invalid Id")

    })

    test("Delete Buchung invalid id", async () => {
        await expect(async () =>
            await deleteBuchung("000000000000000000000000")
        ).rejects.toThrowError("keine Buchung mit dieser Id gefunden")

    })

    describe("Update EinmaligeBuchung", () => {
        test("Update Einmaligebuchung, update betrag", async () => {
            const einmaligeBuchung = await EinmaligeBuchung.create({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: "661ea9f1d8c3a77bdc368c70",
                datum: stringToDate("20.10.2024"),
                betrag: 100,
                typ: "ausgabe"
            });
            expect(einmaligeBuchung).toBeDefined();
            expect(einmaligeBuchung.name).toBe("TestBuchung");

            const buchungResourceUpdate: BuchungResource = {
                id: einmaligeBuchung.id,
                name: "TestBuchungUpdate",
                pocket: pocket.id,
                kategorie: "661ea9f1d8c3a77bdc368c70",
                datum: "20.10.2024",
                betrag: 200,
                typ: "ausgabe"
            }

            const updatedBuchung = await updateBuchung(buchungResourceUpdate);
            expect(updatedBuchung).toBeDefined();
            expect(updatedBuchung.name).toBe("TestBuchungUpdate");
            expect(updatedBuchung.id).toBe(einmaligeBuchung.id);

            const buchungen = await getAlleBuchungen(pocket.id);
            expect(buchungen.length).toBe(1);
            expect(buchungen[0].betrag).toBe(200);
            expect(buchungen[0].id).toEqual(einmaligeBuchung.id);
        })

        test("Update Einmaligebuchung, update typ, datum", async () => {
            const einmaligeBuchung = await EinmaligeBuchung.create({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: "661ea9f1d8c3a77bdc368c70",
                datum: stringToDate("20.10.2024"),
                betrag: 100,
                typ: "ausgabe"
            });
            expect(einmaligeBuchung).toBeDefined();
            expect(einmaligeBuchung.name).toBe("TestBuchung");

            const buchungResourceUpdate: BuchungResource = {
                id: einmaligeBuchung.id,
                name: "TestBuchungUpdate",
                pocket: pocket.id,
                kategorie: "661ea9f1d8c3a77bdc368c70",
                datum: "11.09.2024",
                betrag: 100,
                typ: "einzahlung"
            }

            await updateBuchung(buchungResourceUpdate);


            const buchungen = await getAlleBuchungen(pocket.id);
            expect(buchungen.length).toBe(1);
            const updatedBuchung = buchungen[0];
            expect(updatedBuchung.datum).toBe("11.09.2024");
            expect(updatedBuchung.typ).toBe("einzahlung");
        })

        test("Update Einmaligebuchung, update pocket", async () => {
            const einmaligeBuchung = await EinmaligeBuchung.create({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: "661ea9f1d8c3a77bdc368c70",
                datum: stringToDate("20.10.2024"),
                betrag: 100,
                typ: "ausgabe"
            });
            expect(einmaligeBuchung).toBeDefined();
            expect(einmaligeBuchung.name).toBe("TestBuchung");
            const buchungenAltesPocket = await getAlleBuchungen(pocket.id);
            expect(buchungenAltesPocket.length).toBe(1);

            const buchungResourceUpdate: BuchungResource = {
                id: einmaligeBuchung.id,
                name: "TestBuchungUpdate",
                pocket: pocket2.id,
                kategorie: "661ea9f1d8c3a77bdc368c70",
                datum: "20.10.2024",
                betrag: 100,
                typ: "ausgabe"
            }

            await updateBuchung(buchungResourceUpdate);

            const buchungenAltesPocket2 = await getAlleBuchungen(pocket.id);
            expect(buchungenAltesPocket2.length).toBe(0);

            const buchungenNeuesPocket = await getAlleBuchungen(pocket2.id);
            expect(buchungenNeuesPocket.length).toBe(1);
            const updatedBuchung = buchungenNeuesPocket[0];
            expect(updatedBuchung.pocket).toBe(pocket2.id);
        })

        test("Update Einmaligebuchung, update kategorie", async () => {
            const einmaligeBuchung = await EinmaligeBuchung.create({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: stringToDate("20.10.2024"),
                betrag: 100,
                typ: "ausgabe"
            });
            expect(einmaligeBuchung).toBeDefined();
            expect(einmaligeBuchung.name).toBe("TestBuchung");

            const buchungResourceUpdate: BuchungResource = {
                id: einmaligeBuchung.id,
                name: "TestBuchungUpdate",
                pocket: pocket.id,
                kategorie: kategorie2.id,
                datum: "20.10.2024",
                betrag: 100,
                typ: "ausgabe"
            }

            await updateBuchung(buchungResourceUpdate);


            const buchungen = await getAlleBuchungen(pocket.id);
            expect(buchungen.length).toBe(1);
            const updatedBuchung = buchungen[0];
            expect(updatedBuchung.kategorie).toBe(kategorie2.id);
        })
    })



    describe("Update WiederkehrendeBuchung", () => {
        test("Update WiederkehrendeBuchung, update betrag, typ, datum", async () => {
            const wiederkehrendeBuchung = await WiederkehrendeBuchung.create({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: stringToDate("20.10.2024"),
                betrag: 100,
                typ: "ausgabe",
                intervall: "monat"
            });
            expect(wiederkehrendeBuchung).toBeDefined();
            expect(wiederkehrendeBuchung.name).toBe("TestBuchung");
            expect(wiederkehrendeBuchung.betrag).toBe(100);
            expect(wiederkehrendeBuchung.typ).toBe("ausgabe");
            const buchungResourceUpdate: BuchungResource = {
                id: wiederkehrendeBuchung.id,
                name: "TestBuchungUpdate",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: "11.09.2023",
                betrag: 200,
                typ: "einzahlung",
                intervall: "monat"
            }

            await updateBuchung(buchungResourceUpdate);
            const buchungen = await getAlleWiederkehrendeBuchungen(pocket.benutzer.toString());
            expect(buchungen.length).toBe(1);
            const updatedBuchung = buchungen[0];
            expect(updatedBuchung).toBeDefined();
            expect(updatedBuchung.name).toBe("TestBuchungUpdate");
            expect(updatedBuchung.id).toBe(wiederkehrendeBuchung.id);
            expect(updatedBuchung.datum).toBe("11.09.2023");
            expect(updatedBuchung.typ).toBe("einzahlung");
            expect(updatedBuchung.betrag).toBe(200);
        })

        test("Update WiederkehrendeBuchung, update pocket", async () => {
            const wiederkehrendeBuchung = await WiederkehrendeBuchung.create({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: stringToDate("20.10.2024"),
                betrag: 100,
                typ: "ausgabe",
                intervall: "monat"
            });
            expect(wiederkehrendeBuchung).toBeDefined();
            expect(wiederkehrendeBuchung.name).toBe("TestBuchung");
            const buchungenAltesPocket = await getAlleWiederkehrendeBuchungen(pocket.benutzer.toString());
            expect(buchungenAltesPocket.length).toBe(1);

            const buchungResourceUpdate: BuchungResource = {
                id: wiederkehrendeBuchung.id,
                name: "TestBuchungUpdate",
                pocket: pocket2.id,
                kategorie: kategorie1.id,
                datum: "20.10.2024",
                betrag: 100,
                typ: "ausgabe",
                intervall: "monat"
            }

            await updateBuchung(buchungResourceUpdate);

            const buchungenAltesPocket2 = await getAlleBuchungen(pocket.id);
            expect(buchungenAltesPocket2.length).toBe(0);

            const buchungenNeuesPocket = await getAlleWiederkehrendeBuchungen(pocket.benutzer.toString());
            expect(buchungenNeuesPocket.length).toBe(1);
            const updatedBuchung = buchungenNeuesPocket[0];
            expect(updatedBuchung).toBeDefined();
            expect(updatedBuchung.name).toBe("TestBuchungUpdate");
            expect(updatedBuchung.id).toBe(wiederkehrendeBuchung.id);
            expect(updatedBuchung.pocket).toBe(pocket2.id);
        })

        test("Update WiederkehrendeBuchung, update intervall, kategorie", async () => {
            const wiederkehrendeBuchung = await WiederkehrendeBuchung.create({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: stringToDate("20.10.2024"),
                betrag: 100,
                typ: "ausgabe",
                intervall: "monat"
            });
            expect(wiederkehrendeBuchung).toBeDefined();
            expect(wiederkehrendeBuchung.name).toBe("TestBuchung");
            expect(wiederkehrendeBuchung.intervall).toBe("monat");

            const buchungResourceUpdate: BuchungResource = {
                id: wiederkehrendeBuchung.id,
                name: "TestBuchungUpdate",
                pocket: pocket.id,
                kategorie: kategorie2.id,
                datum: "20.10.2024",
                betrag: 100,
                typ: "ausgabe",
                intervall: "quartal"
            }

            await updateBuchung(buchungResourceUpdate);
            const buchungen = await getAlleWiederkehrendeBuchungen(pocket.benutzer.toString());
            expect(buchungen.length).toBe(1);
            const updatedBuchung = buchungen[0];
            expect(updatedBuchung).toBeDefined();
            expect(updatedBuchung.name).toBe("TestBuchungUpdate");
            expect(updatedBuchung.id).toBe(wiederkehrendeBuchung.id);
            expect(updatedBuchung.intervall).toBe("quartal");
            expect(updatedBuchung.kategorie).toBe(kategorie2.id);
        })
    })

    describe("Update Uebertrag", () => {
        test("Update Uebertrag, update betrag, datum", async () => {
            const uebertrag = await Ubertrag.create({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: stringToDate("20.10.2024"),
                betrag: 100,
                typ: "ausgabe",
                zielPocket: pocket2.id
            });
            expect(uebertrag).toBeDefined();
            expect(uebertrag.name).toBe("TestBuchung");
            expect(uebertrag.betrag).toBe(100);
            expect(uebertrag.typ).toBe("ausgabe");
            const buchungResourceUpdate: BuchungResource = {
                id: uebertrag.id,
                name: "TestBuchungUpdate",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: "11.09.2023",
                betrag: 200,
                typ: "ausgabe",
                zielPocket: pocket2.id
            }

            await updateBuchung(buchungResourceUpdate);
            const buchungen = await getAlleBuchungen(pocket.id);
            expect(buchungen.length).toBe(1);
            const updatedBuchung = buchungen[0];
            expect(updatedBuchung).toBeDefined();
            expect(updatedBuchung.name).toBe("TestBuchungUpdate");
            expect(updatedBuchung.id).toBe(uebertrag.id);
            expect(updatedBuchung.datum).toBe("11.09.2023");
            expect(updatedBuchung.betrag).toBe(200);
        });

        test("Update Uebertrag, update pocket, kategorie", async () => {
            const uebertrag = await Ubertrag.create({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: stringToDate("20.10.2024"),
                betrag: 100,
                typ: "ausgabe",
                zielPocket: pocket2.id
            });
            expect(uebertrag).toBeDefined();
            expect(uebertrag.name).toBe("TestBuchung");
            expect(uebertrag.betrag).toBe(100);
            expect(uebertrag.typ).toBe("ausgabe");
            const buchungResourceUpdate: BuchungResource = {
                id: uebertrag.id,
                name: "TestBuchungUpdate",
                pocket: pocket.id,
                kategorie: kategorie2.id,
                datum: "20.10.2024",
                betrag: 100,
                typ: "ausgabe",
                zielPocket: pocket3.id
            }

            await updateBuchung(buchungResourceUpdate);
            const buchungen = await getAlleBuchungen(pocket.id);
            expect(buchungen.length).toBe(1);
            const updatedBuchung = buchungen[0];
            expect(updatedBuchung).toBeDefined();
            expect(updatedBuchung.name).toBe("TestBuchungUpdate");
            expect(updatedBuchung.id).toBe(uebertrag.id);
            expect(updatedBuchung.pocket).toBe(pocket.id);
            expect(updatedBuchung.zielPocket).toBe(pocket3.id);

        });

        test("Update Uebertrag, Fehler: update typ", async () => {
            const uebertrag = await Ubertrag.create({
                name: "TestBuchung",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: stringToDate("20.10.2024"),
                betrag: 100,
                typ: "ausgabe",
                zielPocket: pocket2.id
            });
            expect(uebertrag).toBeDefined();
            expect(uebertrag.name).toBe("TestBuchung");
            expect(uebertrag.betrag).toBe(100);
            expect(uebertrag.typ).toBe("ausgabe");
            const buchungResourceUpdate: BuchungResource = {
                id: uebertrag.id,
                name: "TestBuchungUpdate",
                pocket: pocket.id,
                kategorie: kategorie1.id,
                datum: "20.10.2024",
                betrag: 100,
                typ: "eingabe",
                zielPocket: pocket2.id
            }

            await expect(async () => {
                await updateBuchung(buchungResourceUpdate);
            }).rejects.toThrow();
        })
    });
});

test("Übertrag Pocket zu Sparziel", async () => {
    const user = await Benutzer.create({ email: "dima@riffel.de", password: "passWORT_123", name: "Dima", active: true });
    expect(user).toBeDefined();
    const kat = await Buchungskategorie.create({ benutzer: user.id, name: "TestKategorie" });
    expect(kat).toBeDefined();

    const pocket = await Pocket.create({ benutzer: user.id, name: "TestPocket", betrag: 1000 });
    expect(pocket).toBeDefined();
    const sparziel = await Sparziel.create({ benutzer: user.id, name: "TestSparziel", betrag: 500, zielbetrag: 2000 });
    expect(sparziel).toBeDefined();

    const uebertrag = await createBuchung({ name: "TestUebertrag", pocket: pocket.id, zielPocket: sparziel.id, betrag: 100, datum: "20.10.2024", typ: "ausgabe", kategorie: kat.id });
    expect(uebertrag).toBeDefined();
    const updatedPocket = await Pocket.findById(pocket.id).exec();
    expect(updatedPocket!.betrag).toBe(900);
    const updatedSparziel = await Sparziel.findById(sparziel.id).exec();
    expect(updatedSparziel!.betrag).toBe(600);
})
test("Übertrag Sparziel zu Pocket", async () => {
    const user = await Benutzer.create({ email: "dima@riffel.de", password: "passWORT_123", name: "Dima", active: true });
    expect(user).toBeDefined();
    const kat = await Buchungskategorie.create({ benutzer: user.id, name: "TestKategorie" });
    expect(kat).toBeDefined();

    const pocket = await Pocket.create({ benutzer: user.id, name: "TestPocket", betrag: 1000 });
    expect(pocket).toBeDefined();
    const sparziel = await Sparziel.create({ benutzer: user.id, name: "TestSparziel", betrag: 500, zielbetrag: 2000 });
    expect(sparziel).toBeDefined();

    const uebertrag = await createBuchung({ name: "TestUebertrag", pocket: sparziel.id, zielPocket: pocket.id, betrag: 100, datum: "20.10.2024", typ: "ausgabe", kategorie: kat.id });
    expect(uebertrag).toBeDefined();
    const updatedPocket = await Pocket.findById(pocket.id).exec();
    expect(updatedPocket!.betrag).toBe(1100);
    const updatedSparziel = await Sparziel.findById(sparziel.id).exec();
    expect(updatedSparziel!.betrag).toBe(400);
})
test("Übertrag Sparziel zu Sparziel", async () => {
    const user = await Benutzer.create({ email: "dima@riffel.de", password: "passWORT_123", name: "Dima", active: true });
    expect(user).toBeDefined();
    const kat = await Buchungskategorie.create({ benutzer: user.id, name: "TestKategorie" });
    expect(kat).toBeDefined();

    const sparziel = await Sparziel.create({ benutzer: user.id, name: "Sparziel1", betrag: 500, zielbetrag: 2000 });
    expect(sparziel).toBeDefined();
    const sparziel2 = await Sparziel.create({ benutzer: user.id, name: "Sparziel2", betrag: 1000, zielbetrag: 2000 });
    expect(sparziel2).toBeDefined();

    const uebertrag = await createBuchung({ name: "TestUebertrag", pocket: sparziel.id, zielPocket: sparziel2.id, betrag: 100, datum: "20.10.2024", typ: "ausgabe", kategorie: kat.id });
    expect(uebertrag).toBeDefined();
    const updatedSparziel1 = await Sparziel.findById(sparziel.id).exec();
    expect(updatedSparziel1!.betrag).toBe(400);
    const updatedSparziel2 = await Sparziel.findById(sparziel2.id).exec();
    expect(updatedSparziel2!.betrag).toBe(1100);
})