import express from "express";
import { createBuchungsKategorie, deleteBuchungsKategorie, getAlleEigeneKategorien, getAlleKategorien, getAlleStandardKategorien, getBuchungskategorie, updateBuchungskategorie } from "../../src/services/BuchungskategorieService";
import { authenticate } from "./Authentication";
import { body, matchedData, param, validationResult } from "express-validator";
import { BuchungskategorieResource } from "src/Resources";

export const buchungskategorieRouter = express.Router();

buchungskategorieRouter.get("/alleKategorien", authenticate, async (req, res) => {
    try {
        const kategorien = await getAlleKategorien(req.userId!);
        res.status(200).send(kategorien);
    } catch (e) {
        res.sendStatus(400);
    }
})

buchungskategorieRouter.get("/alleStandardKategorien", authenticate, async (req, res) => {
    try {
        const kategorien = await getAlleStandardKategorien(req.userId!);
        res.status(200).send(kategorien);
    } catch (e) {
        res.sendStatus(400);
    }
})

buchungskategorieRouter.get("/alleEigeneKategorien", authenticate, async (req, res) => {
    try {
        const kategorien = await getAlleEigeneKategorien(req.userId!);
        res.status(200).send(kategorien);
    } catch (e) {
        res.sendStatus(400);
    }
})

buchungskategorieRouter.get("/:id",
    authenticate,
    param("id").isMongoId(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
        }
        try {
            const kat = await getBuchungskategorie(req.params.id);
            res.status(200).send(kat);

        } catch (e) {
            res.sendStatus(404);
        }
    })

buchungskategorieRouter.post("",
    authenticate,
    body("name").isString(),
    body("benutzer").isMongoId(),
    body("ausgabenlimit").isNumeric().optional(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
            return
        }
        try {
            const results = matchedData(req) as BuchungskategorieResource
            const kat = await createBuchungsKategorie(results)
            res.status(200).send(kat)
        } catch (error) {
            if (String(error).includes("Benutzer nicht gefunden")) {
                res.sendStatus(404);
                return;
            }
            res.sendStatus(400);
            return;
        }
    }
)

buchungskategorieRouter.put("/:id",
    authenticate,
    param("id").isMongoId(),
    body("name").isString().optional(),
    body("ausgabenlimit").optional().custom(val => val === null || typeof val === 'number'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
            return
        }
        try {
            const results = matchedData(req)
            const kat = await updateBuchungskategorie({ id: results.id, name: results.name, ausgabenlimit: results.ausgabenlimit })
            res.status(200).send(kat)
        } catch (error) {
            if (String(error).includes("Buchungskategorie nicht gefunden")) {
                res.sendStatus(404);
                return;
            }
            res.sendStatus(400);
            return;
        }
    }
)

buchungskategorieRouter.delete("/:id",
    authenticate,
    param("id").isMongoId(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
            return
        }
        try {
            await deleteBuchungsKategorie(req.params.id)
            res.sendStatus(204)
        } catch (error) {
            if (String(error).includes("Buchungskategorie nicht gefunden")) {
                res.sendStatus(404);
                return;
            }
            res.sendStatus(400);
            return;
        }
    }
)

