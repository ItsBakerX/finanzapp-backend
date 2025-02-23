import express from "express";
import { authenticate } from "./Authentication";
import { createSparziel, deleteSparziel, getAlleSparziele, getFaelligkeitTage, getSparziel, updateSparziel } from "../../src/services/SparzielService";
import { body, matchedData, param, validationResult } from "express-validator";
import { SparzielResource } from "../../src/Resources";

export const sparzielRouter = express.Router();

sparzielRouter.get("/alle", authenticate, async (req, res) => {
    try {
        const sparziele = await getAlleSparziele(req.userId!);
        res.status(200).send(sparziele);
        return;
    } catch (e) {
        res.sendStatus(400);
        return;
    }
});

sparzielRouter.get("/:id", authenticate, param("id").isMongoId(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).send(errors.array());
        return;
    }
    try {
        const sparziel = await getSparziel(req.params.id);
        res.status(200).send(sparziel);
        return;
    } catch (e) {
        res.sendStatus(400);
        return;
    }
});

sparzielRouter.post("/", authenticate,
    body("name").isString().isLength({ min: 1, max: 100 }),
    body("benutzer").isMongoId(),
    body("betrag").isNumeric(),
    body("zielbetrag").isNumeric(),
    body("faelligkeitsdatum").optional().isDate({ format: "DD.MM.YYYY", delimiters: [".", "-"] }),
    body("notiz").optional().isString().isLength({ max: 100 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send(errors.array());
            return;
        }
        try {
            const data = matchedData(req) as SparzielResource;
            const sparziel = await createSparziel(data);
            res.status(201).send(sparziel);
            return;
        } catch (e) {
            res.sendStatus(400);
            return;
        }
    });

sparzielRouter.delete("/:id", authenticate, param("id").isMongoId(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).send(errors.array());
        return;
    }
    try {
        await deleteSparziel(req.params.id);
        res.sendStatus(204);
        return;
    } catch (e) {
        res.sendStatus(400);
        return;
    }
});

sparzielRouter.put("/:id", authenticate,
    param("id").isMongoId(),
    body("benutzer").isMongoId(),
    body("name").optional().isString().isLength({ min: 1, max: 100 }).trim(),
    body("betrag").optional().isNumeric().trim(),
    body("zielbetrag").optional().isNumeric().trim(),
    body("faelligkeitsdatum").optional().isDate({ format: "DD.MM.YYYY", delimiters: [".", "-"] }),
    body("notiz").optional().isString().isLength({ max: 100 }).trim(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send(errors.array());
            return;
        }
        try {
            const data = req.body;
            const sparziel = await updateSparziel(req.params.id, data);
            res.status(200).send(sparziel);
            return;
        } catch (e) {
            res.sendStatus(400);
            return;
        }
    })

// gibt eine zahl zurück positive -> tagege bis fälligkeit, negativ -> fälligseit, 0 -> heute, null -> kein Datum angegebn
sparzielRouter.get("/:id/faelligkeitTage", authenticate,
    param("id").isMongoId(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send(errors.array());
            return;
        }
        try {
            const days = await getFaelligkeitTage(req.params.id)
            res.status(200).send({ value: days })
            return
        } catch (e) {
            res.sendStatus(404)
        }
    })