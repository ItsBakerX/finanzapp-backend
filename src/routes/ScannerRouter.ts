import express from "express";
import multer from 'multer';
import { authenticate } from "./Authentication";
import { validationResult } from "express-validator";
import { createBuchungFromImg } from "../../src/services/ScannerService";

export const scannerRouter = express.Router();

// Initialisieren Sie Multer für den Datei-Upload
const upload = multer({ storage: multer.memoryStorage() });

scannerRouter.post(
    '',
    authenticate,
    upload.single('image'), // Die Datei wird von Multer verarbeitet
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
            return;
        }

        try {
            // Die Datei aus dem Request extrahieren (verfügbar durch multer)
            const imageFile = req.file;

            if (!imageFile) {
                res.status(400).send({ errors: [{ msg: "Bilddatei fehlt." }] });
                return;
            }

            const buchung = await createBuchungFromImg(req.userId!, imageFile);
            res.status(201).send(buchung);
            return;
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === 'Benutzer nicht gefunden.') {
                    res.status(404).send({
                        errors: [
                            { type: "field", location: "body", path: "benutzer", msg: e.message }
                        ]
                    });
                    return;
                }
                if (e.message === 'Keine Kategorien gefunden.') {
                    res.status(404).send({
                        errors: [
                            { type: "field", location: "body", path: "kategorien", msg: e.message }
                        ]
                    });
                    return;
                }
                if (e.message === 'Pocket nicht gefunden.') {
                    res.status(404).send({
                        errors: [
                            { type: "field", location: "body", path: "pocket", msg: e.message }
                        ]
                    });
                    return;
                }

                if (e.message === 'OpenAI API Key fehlt.') {
                    res.status(401).send({
                        errors: [
                            { type: "field", location: "body", path: "openai", msg: e.message }
                        ]
                    });
                    return;
                }
            }
            res.sendStatus(400);
            return;
        }
    }
);
