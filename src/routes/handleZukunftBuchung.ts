import { stringToDate } from "../services/ServiceHelper";
import { getAlleZukunftBuchungen, zukunftBuchungAusfuehren } from "../services/BuchungService";
import { NextFunction, Request, Response } from "express";
import { createNotification } from "../services/NotificationService";

export async function handleZukunftBuchung(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId;
    const zukunftBuchungen = await getAlleZukunftBuchungen(userId!)

    zukunftBuchungen.forEach(async buchung => {
        if (stringToDate(buchung.datum) <= new Date(Date.now())) {
            await zukunftBuchungAusfuehren(buchung.id!)
            const message = `Deine ${buchung.typ} "${buchung.name}" mit dem betrag ${buchung.betrag}€ wurde erfolgreich ausgeführt`
            await createNotification(userId!, message)
        }
    })
    next()
}