import express from "express";
import { authenticate } from "./Authentication";
import { getAnzahlBuchungen, getAusgaben, getAusgaben12Monate, getAusgaben4Wochen, getAusgabenAlleJahre, getAusgabenJahr, getAusgabenMonat, getAusgabenWoche, getEinahmen, getEinahmenJahr, getEinahmenMonat, getEinahmenWoche, getGesamtvermoegen, getPocketProzente, jahresAusgabenKat, katAusgabenLimit, monatsAusgabenKat, wochenAusgabenKat } from "../../src/services/StatistikService";

export const statistikRouter = express.Router()


//gibt die Summe aller Einahmen des des aktuellen Woche zurück daten befinden sich im body.value
statistikRouter.get("/einnahmenWoche", authenticate, async (req, res) => {
    try {
        const einnahmen = await getEinahmenWoche(req.userId!)
        res.status(200).send({ value: einnahmen })
    } catch (e) {
        res.sendStatus(400)
    }
})

//gibt die Summe aller Ausgaben des des aktuellen Woche zurück daten befinden sich im body.value
statistikRouter.get("/ausgabenWoche", authenticate, async (req, res) => {
    try {
        const ausgaben = await getAusgabenWoche(req.userId!)
        res.status(200).send({ value: ausgaben })
    } catch (e) {
        res.sendStatus(400)
    }
})

//gibt die Summe aller Einahmen des des aktuellen Monats zurück daten befinden sich im body.value
statistikRouter.get("/einnahmenMonat", authenticate, async (req, res) => {
    try {
        const einnahmen = await getEinahmenMonat(req.userId!)
        res.status(200).send({ value: einnahmen })
    } catch (e) {
        res.sendStatus(400)
    }
})

//gibt die Summe aller Ausgaben des des aktuellen Monats zurück daten befinden sich im body.value
statistikRouter.get("/ausgabenMonat", authenticate, async (req, res) => {
    try {
        const ausgaben = await getAusgabenMonat(req.userId!)
        res.status(200).send({ value: ausgaben })
    } catch (e) {
        res.sendStatus(400)
    }
})

//gibt die Summe aller Einahmen des des aktuellen Jahr zurück daten befinden sich im body.value
statistikRouter.get("/einnahmenJahr", authenticate, async (req, res) => {
    try {
        const einnahmen = await getEinahmenJahr(req.userId!)
        res.status(200).send({ value: einnahmen })
    } catch (e) {
        res.sendStatus(400)
    }
})

//gibt die Summe aller Ausgaben des des aktuellen Monats zurück daten befinden sich im body.value
statistikRouter.get("/ausgabenJahr", authenticate, async (req, res) => {
    try {
        const ausgaben = await getAusgabenJahr(req.userId!)
        res.status(200).send({ value: ausgaben })
    } catch (e) {
        res.sendStatus(400)
    }
})

//gibt die Summe aller Einahmen zurück daten befinden sich im body.value
statistikRouter.get("/alleEinnahmen", authenticate, async (req, res) => {
    try {
        const einnahmen = await getEinahmen(req.userId!)
        res.status(200).send({ value: einnahmen })
    } catch (e) {
        res.sendStatus(400)
    }
})

//gibt die Summe aller Ausgaben zurück daten befinden sich im body.value
statistikRouter.get("/alleAusgaben", authenticate, async (req, res) => {
    try {
        const ausgaben = await getAusgaben(req.userId!)
        res.status(200).send({ value: ausgaben })
    } catch (e) {
        res.sendStatus(400)
    }
})
//gibt den prozentualen anteil aller Pockets am gesamtvermögen wieder daten befinden sich im body.value
//im Frontend const map = new Map(Object.entries(data)); verwenden um aus den gesendet Date eine map zu machen

statistikRouter.get("/pocketProzent", authenticate,
    async (req, res) => {
        try {
            const map = await getPocketProzente(req.userId!)
            const object = Object.fromEntries(map)
            res.status(200).send(object)
        } catch (e: any) {

            res.sendStatus(400)
            return
        }

    }
)
statistikRouter.get("/wochenAusgaben", authenticate,
    async (req, res) => {
        try {
            const ausgaben = await getAusgaben4Wochen(req.userId!)
            res.status(200).send({ wochen: ausgaben[0], values: ausgaben[1] })
        } catch (e) {
            res.sendStatus(400)
            return
        }
    }
)

statistikRouter.get("/monateAusgaben", authenticate,
    async (req, res) => {
        try {
            const ausgaben = await getAusgaben12Monate(req.userId!)
            res.status(200).send({ wochen: ausgaben[0], values: ausgaben[1] })
        } catch (e) {
            res.sendStatus(400)
            return
        }
    }
)

statistikRouter.get("/JahreAusgaben", authenticate,
    async (req, res) => {
        try {
            const ausgaben = await getAusgabenAlleJahre(req.userId!)
            res.status(200).send({ wochen: ausgaben[0], values: ausgaben[1] })
        } catch (e) {
            res.sendStatus(400)
            return
        }
    }
)

statistikRouter.get("/anzahlBuchungen/", authenticate,
    async (req, res) => {
        try {
            const map = await getAnzahlBuchungen(req.userId!)
            const object = Object.fromEntries(map)
            res.status(200).send(object)
        } catch (e: any) {
            res.sendStatus(400)
            return
        }
    }
)

statistikRouter.get("/gesamtvermoegen", authenticate,
    async (req, res) => {
        try {
            const vermoegen = await getGesamtvermoegen(req.userId!)
            res.status(200).send({ value: vermoegen })
        } catch (e: any) {
            res.sendStatus(400)
            return
        }
    })


statistikRouter.get("/kategorieAusgaben/woche", authenticate,
    async (req, res) => {
        try {
            const map = await wochenAusgabenKat(req.userId!)
            const object = Object.fromEntries(map)
            res.status(200).send(object)
        } catch (e: any) {
            res.sendStatus(400)
            return
        }
    })

statistikRouter.get("/kategorieAusgaben/monat", authenticate,
    async (req, res) => {
        try {
            const map = await monatsAusgabenKat(req.userId!)
            const object = Object.fromEntries(map)
            res.status(200).send(object)
        } catch (e: any) {
            res.sendStatus(400)
            return
        }
    })

statistikRouter.get("/kategorieLimitAusgaben", authenticate,
    async (req, res) => {
        try {
            const map = await katAusgabenLimit(req.userId!)
            const object = Object.fromEntries(map)
            res.status(200).send(object)
        } catch (e: any) {
            res.sendStatus(400)
            return
        }
    })

statistikRouter.get("/kategorieAusgaben/jahr", authenticate,
    async (req, res) => {
        try {
            const map = await jahresAusgabenKat(req.userId!)
            const object = Object.fromEntries(map)
            res.status(200).send(object)
        } catch (e: any) {
            res.sendStatus(400)
            return
        }
    })