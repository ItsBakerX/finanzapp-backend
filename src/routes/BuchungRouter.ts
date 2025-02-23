import express from "express";
import { createBuchung, deleteBuchung, getAlleAusgaben, getAlleBuchungen, getAlleBuchungenBenutzer, getAlleBuchungenKategorie, getAlleEinnahmen, getAlleWiederkehrendeBuchungen, getAlleZukunftBuchungen, getBuchungById, updateBuchung, zukunftBuchungAusfuehren } from "../../src/services/BuchungService";
import { authenticate } from "./Authentication";
import { body, matchedData, param, validationResult } from "express-validator";
import { wiederkehrendeBuchungen } from "./WiederkehrendeBuchung";
import { handleZukunftBuchung } from "./handleZukunftBuchung";
import { BuchungResource } from "src/Resources";

export const buchungRouter = express.Router();

buchungRouter.get("/alle",
    authenticate,
    wiederkehrendeBuchungen,
    handleZukunftBuchung,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
            return;
        }
        try {
            const buchungen = await getAlleBuchungenBenutzer(req.userId!);
            res.send(buchungen);
            return;
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === `Kein Benutzer mit dieser ID gefunden`) {
                    res.status(404).send({
                        errors: [
                            { type: "field", location: "body", path: "benutzer", msg: e.message }
                        ]
                    })
                    return;
                }
            }
            res.sendStatus(400);
            return;
        }
    })

buchungRouter.get("/:pocketId/buchungen",
    authenticate,
    param("pocketId").isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
            return;
        }
        const pocketId = req.params.pocketId;
        try {
            const buchungen = await getAlleBuchungen(pocketId);
            res.send(buchungen);
            return;
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === `Pocket mit ID ${pocketId} nicht gefunden`) {
                    res.status(404).send({
                        errors: [
                            { type: "field", location: "params", path: "pocketId", msg: e.message }
                        ]
                    })
                    return;
                }
            }
            res.sendStatus(400);
            return;
        }
    })

buchungRouter.get("/wiederkehrend",
    authenticate,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
            return;
        }
        try {
            const buchungen = await getAlleWiederkehrendeBuchungen(req.userId!);
            res.send(buchungen);
            return;
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === `Kein Benutzer mit dieser ID gefunden`) {
                    res.status(404).send({
                        errors: [
                            { type: "field", location: "body", path: "benutzer", msg: e.message }
                        ]
                    })
                    return;
                }
            }
            res.sendStatus(400);
            return;
        }
    })

buchungRouter.get("/single/:buchungId",
    authenticate,
    param("buchungId").isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
            return;
        }
        const buchungId = req.params.buchungId;
        try {
            const buchung = await getBuchungById(buchungId);
            res.send(buchung);
            return;
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === `Buchung mit ID ${buchungId} nicht gefunden`) {
                    res.status(404).send({
                        errors: [
                            { type: "field", location: "params", path: "buchungId", msg: e.message }
                        ]
                    })
                    return;
                }
            }
            res.sendStatus(400);
            return;
        }
    })

buchungRouter.post("",
    authenticate,
    body("name").isString().isLength({ min: 1, max: 40 }),
    body("pocket").isMongoId(),
    body("kategorie").isMongoId(),
    body("datum").isDate({ format: "DD.MM.YYYY", delimiters: [".", "-"] }),
    body("betrag").isNumeric()
        .custom(betrag => betrag > 0),
    body("typ"),
    body("zielPocket").optional().isMongoId(),
    body("notiz").optional().isString().isLength({ max: 1000 }),
    body('intervall').optional().isString().isIn(["tag", "woche", "vierzehnTage", "monat", "quartal", "halbesJahr", "jahr"]),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
            return;
        }
        try {
            const buchung = await createBuchung(req.body);
            res.status(201).send(buchung);
            return;
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === `typ: einzahlung not applicable for Uebertrag`) {
                    res.status(400).send({
                        errors: [
                            { type: "field", location: "body", path: "typ", msg: e.message },
                            { type: "field", location: "body", path: "zielPocket", msg: e.message }
                        ]
                    })
                    return;
                }
                if (e.message === `ZielPocket not found`) {
                    res.status(404).send({
                        errors: [
                            { type: "field", location: "body", path: "zielPocket", msg: e.message }
                        ]
                    })
                    return;
                }
                if (e.message === `Pocket not found`) {
                    res.status(404).send({
                        errors: [
                            { type: "field", location: "body", path: "pocket", msg: e.message }
                        ]
                    })
                    return;
                }
                if (e.message === `Typ must be 'einzahlung' or 'ausgabe'`) {
                    res.status(400).send({
                        errors: [
                            { type: "field", location: "body", path: "typ", msg: e.message }
                        ]
                    })
                    return;
                }
            }
            res.sendStatus(400);
            return;
            next(e);
        }
    })

buchungRouter.put("/:id",
    authenticate,
    param('id').isMongoId(),
    body("name").isString().isLength({ min: 1, max: 40 }),
    body("pocket").isMongoId(),
    body("kategorie").isMongoId(),
    body("datum").isDate({ format: "DD.MM.YYYY", delimiters: [".", "-"] }),
    body("betrag").isNumeric()
        .custom(betrag => betrag > 0),
    body("typ"),
    body("zielPocket").optional().isMongoId(),
    body("notiz").optional().isString().isLength({ max: 1000 }),
    body('intervall').optional().isString().isIn(["tag", "woche", "vierzehnTage", "monat", "quartal", "halbesJahr", "jahr"]),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        try {
            const data = matchedData(req) as BuchungResource;
            const buchung = await updateBuchung(data);
            res.status(200).send(buchung);
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === `Buchung mit ID ${req.params.id} nicht gefunden`) {
                    res.status(404).send({
                        errors: [
                            { type: "field", location: "params", path: "id", msg: e.message }
                        ]
                    })
                }
            }
            res.sendStatus(400);
            return;
        }
    }
)

buchungRouter.delete("/:id",
    authenticate,
    param("id").isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        try {
            await deleteBuchung(req.params.id);
            res.status(204).send();
            return;
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === "keine Buchung mit dieser Id gefunden") {
                    res.status(404).send({
                        errors: [
                            { type: "field", location: "params", path: "id", msg: e.message }
                        ]
                    })
                }
                return;
            }
            res.sendStatus(400);
            return;
            next(e);
        }
    })

buchungRouter.get("/:kategorieId/kategorie/buchungen",
    authenticate,
    param("kategorieId").isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() })
            return;
        }
        const kategorieId = req.params!.kategorieId;
        try {
            const buchungen = await getAlleBuchungenKategorie(kategorieId);
            res.send(buchungen);
            return;
        } catch (e) {
            res.sendStatus(400);
            return;
            next(e);
        }
    })

buchungRouter.get("/ausgaben", authenticate, async (req, res, next) => {
    try {
        const buchungen = await getAlleAusgaben(req.userId!);
        res.send(buchungen);
        return;
    } catch (e) {
        res.sendStatus(400);
        return;
    }
})

buchungRouter.get("/einnahmen", authenticate, async (req, res, next) => {
    try {
        const buchungen = await getAlleEinnahmen(req.userId!);
        res.send(buchungen);
        return;
    } catch (e) {
        res.sendStatus(400);
        return;
    }
})

buchungRouter.get("/alleZukunft", authenticate, async (req, res, next) => {
    try {
        const buchungen = await getAlleZukunftBuchungen(req.userId!);
        res.send(buchungen);
        return;
    } catch (e) {
        res.sendStatus(400);
        return;
    }
})

buchungRouter.patch("/zukunftAusfuehren/:id", authenticate,
    param("id").isMongoId(),
    async (req, res, next) => {
        try {
            await zukunftBuchungAusfuehren(req.params.id);
            res.sendStatus(200);
            return;
        } catch (e) {
            res.sendStatus(400);
            return;
        }
    }
)