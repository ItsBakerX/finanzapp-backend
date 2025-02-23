import dotenv from 'dotenv';
import OpenAI from 'openai';
import { Benutzer } from "../../src/models/BenutzerModel";
import { Buchungskategorie } from "../../src/models/BuchungskategorieModel";
import { BuchungResource } from "../../src/Resources";
import { Pocket } from "../../src/models/PocketModel";
dotenv.config();

export async function createBuchungFromImg(benutzerID: string, imageFile: Express.Multer.File): Promise<BuchungResource> {
    if (!process.env.REACT_APP_API_OPENAI_KEY) {
        throw new Error('OpenAI API Key fehlt.');
    }
    const openai = new OpenAI({
        apiKey: process.env.REACT_APP_API_OPENAI_KEY
    });

    // Überprüfen, ob der Benutzer existiert
    const benutzer = await Benutzer.findById(benutzerID).exec();
    if (!benutzer) {
        throw new Error('Benutzer nicht gefunden.');
    }

    // Kategorien des Benutzers abrufen
    const kategorien = await Buchungskategorie.find({ benutzer: benutzerID }).exec();
    if (!kategorien) {
        throw new Error('Keine Kategorien gefunden.');
    }
    const kategorienNamen = kategorien.map((kategorie: any) => kategorie.name);

    // Pockets des Benutzers abrufen
    const pockets = await Pocket.find({ benutzer: benutzerID }).exec();
    if (!pockets) {
        throw new Error('Pocket nicht gefunden.');
    }
    const pocketNamen = pockets.map((pocket: any) => pocket.name);

    let result: any;
    try {
        // Das Bild wird als base64-codierte Zeichenkette umgewandelt
        const base64Image = imageFile.buffer.toString('base64');

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text:
                                `Extrahiere alle Artikel aus der Datei als JSON und gebe anschließend eine Zusammenfassung des Einkaufs zurück.
                                \nFormat: { 'Einkauf': { 
                                'name': 'Name des Geschäfts', 
                                'datum': 'Kaufdatum im Format DD.MM.YYYY', 
                                'pocket': Bestpassendes Pocket aus: '${pocketNamen.join('/')}',
                                'betrag': 'Gesamtbetrag als Number (kein Minussymbol verwenden, immer 2 Nachkommastellen (1499.00; 5.30), Punkt vermeiden bei Tausendertrennzeichen)', 
                                'kategorie': Bestpassende Kategorie aus: '${kategorienNamen.join('/')}', 
                                'typ': 'einzahlung/ausgabe' }, 
                                'notiz': [ { 'name': 'Artikelname', 'betrag': 'Preis des Artikels als Number (kein Minussymbol verwenden)' } ] }
                                \nErforderliche Anforderungen:
                                \nAlle Artikel extrahieren, keine Auslassungen, jedes Detail aufnehmen.
                                \nDie Notiz soll die Artikel (Name und Preis) mit dem jeweiligen Betrag enthalten.
                                \nKeine zusätzlichen Informationen, nur JSON.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
        });

        let structuredData = response.choices[0]?.message?.content || '{}';
        structuredData = structuredData
            .replace(/^```json/, "")
            .replace(/```$/, "");
        result = JSON.parse(structuredData);
        console.log('Strukturierte Daten:', result);
    } catch (err) {
        console.error('Fehler mit OpenAI:', err);
        throw new Error('Fehler beim Verarbeiten des Bildes.');
    }

    const einkauf = result.Einkauf;
    const einkaufNotiz = result.notiz;
    console.log("Einkaufnotiz: ", einkaufNotiz);
    let notiz = '';
    if (einkaufNotiz.length > 0) {
        notiz = einkaufNotiz.map((item: any) => {
            return `${item.name}: ${item.betrag} € \n`;
        }).join('\n');
    } else {
        console.error('Notizdaten fehlen: ', einkaufNotiz);
    }

    const buchung: BuchungResource = {
        name: einkauf.name,
        datum: einkauf.datum,
        pocket: einkauf.pocket,
        betrag: einkauf.betrag,
        kategorie: einkauf.kategorie,
        typ: einkauf.typ,
        notiz: notiz,
    };

    console.log('Buchung:', buchung);
    return {
        name: einkauf.name,
        datum: einkauf.datum,
        pocket: einkauf.pocket,
        betrag: einkauf.betrag,
        kategorie: einkauf.kategorie,
        typ: einkauf.typ,
        notiz: notiz
    };
}
