import { Benutzer } from "../models/BenutzerModel";
import { Pocket } from "../models/PocketModel";
import { BuchungResource, PocketResource } from "../../src/Resources";
import { deleteBuchung, getAlleBuchungen } from "./BuchungService";
import mongoose, { ObjectId } from "mongoose";
import { EinmaligeBuchung } from "../../src/models/EinmaligeBuchungModel";
import { Ubertrag } from "../../src/models/UbertragModel";
import { WiederkehrendeBuchung } from "../../src/models/WiederkehrendeBuchungModel";

export async function createPocket(pocketResource: PocketResource): Promise<PocketResource> {
    const benutzer = await Benutzer.findById(pocketResource.benutzer);
    if (!benutzer) {
        throw new Error(`Benutzer existiert nicht`);
    }
    const alreadyExists = await Pocket.findOne({ name: pocketResource.name, benutzer: pocketResource.benutzer }).exec();
    if (alreadyExists) {
        throw new Error(`Pocket mit dem Namen ${pocketResource.name} existiert bereits`);
    }
    const pocket = await Pocket.create({
        id: pocketResource.id,
        name: pocketResource.name,
        benutzer: pocketResource.benutzer,
        betrag: pocketResource.betrag,
        notiz: pocketResource.notiz
    })
    return {
        id: pocket.id,
        name: pocket.name,
        benutzer: pocket.benutzer.toString(),
        betrag: pocket.betrag,
        notiz: pocket.notiz
    }
}

export async function getAllePockets(benutzerId: string): Promise<PocketResource[]> {
    const benutzer = await Benutzer.findById(benutzerId).exec();
    if (!benutzer) {
        throw new Error(`Benutzer mit ID ${benutzerId} existiert nicht`);
    }
    const pockets = await Pocket.find({ benutzer: benutzerId }).exec();
    const delPocket = await Pocket.findOne({ benutzer: benutzerId, name: "deletedPocket" }).exec()
    if (delPocket) {
        pockets.splice(pockets.indexOf(delPocket), 1)
    }
    return pockets.map(pocket => ({
        id: pocket.id,
        name: pocket.name,
        benutzer: pocket.benutzer.toString(),
        betrag: pocket.betrag,
        notiz: pocket.notiz
    }));
}

export async function getPocket(id: string): Promise<PocketResource> {
    const pocket = await Pocket.findById(id).exec();
    if (!pocket) {
        throw new Error(`Kein Pocket mit der ID ${id} gefunden`);
    }
    return {
        id: pocket.id,
        name: pocket.name,
        benutzer: pocket.benutzer.toString(),
        betrag: pocket.betrag,
        notiz: pocket.notiz
    }
}

export async function updatePocket(id: string, pocketResource: PocketResource): Promise<PocketResource> {
    const pocket = await Pocket.findById(id).exec();
    if (!pocket) {
        throw new Error(`Kein Pocket mit der ID ${id} gefunden`);
    }
    if (pocketResource.name) {
        pocket.name = pocketResource.name;
    }
    if (pocketResource.betrag) {
        pocket.betrag = pocketResource.betrag;
    }
    if (pocketResource.notiz) {
        pocket.notiz = pocketResource.notiz;
    }
    const updatedPocket = await pocket.save();
    return {
        id: updatedPocket.id,
        name: updatedPocket.name,
        benutzer: updatedPocket.benutzer.toString(),
        betrag: updatedPocket.betrag,
        notiz: updatedPocket.notiz
    }
}

export async function updatePocketNameOrNotiz(id: string, { name, notiz }: { name?: string, notiz?: string }): Promise<PocketResource> {
    const pocket = await Pocket.findById(id).exec();
    if (!pocket) {
        throw new Error(`Kein Pocket mit der ID ${id} gefunden`);
    }
    if (name) {
        pocket.name = name;
    }
    if (notiz) {
        pocket.notiz = notiz;
    }
    const updatedPocket = await pocket.save();
    return {
        id: updatedPocket.id,
        name: updatedPocket.name,
        benutzer: updatedPocket.benutzer.toString(),
        betrag: updatedPocket.betrag,
        notiz: updatedPocket.notiz
    }
}

export async function deletePocket(id: string, deleteBuchungen: boolean = false): Promise<void> {
    const pocket = await Pocket.findOne({ _id: id });
    if (!pocket) {
        throw new Error(`Kein Pocket mit der ID ${id} gefunden`);
    }
    const buchungen = await getAlleBuchungen(pocket.id!)
    const buchungTypes = [EinmaligeBuchung, Ubertrag, WiederkehrendeBuchung];
    if (deleteBuchungen) {
        for (let i = 0; i < buchungen.length; i++) {
            try {
                await deleteBuchung(buchungen[i].id!)
            } catch (e) {
                throw e
            }

        }
        await Pocket.findByIdAndDelete(id).exec()
        return
    }

    let delpocket = await Pocket.findOne({ benutzer: pocket.benutzer, name: "deletedPocket" }) as PocketResource
    if (!delpocket && buchungen.length > 0) {
        delpocket = await createPocket({ name: "deletedPocket", benutzer: pocket.benutzer.toString(), betrag: 0 })

    }
    for (let i = 0; i < buchungen.length; i++) {
        try {
            console.log(`Moving ${buchungen[i].id!} from alleBuchungenPocket `)
            console.log(buchungen)
            let buchung: any = null;
            let buchungType: string = '';
            for (const type of buchungTypes) {
                buchung = await (type as any).findById(buchungen[i].id!).exec();
                if (buchung) {
                    buchungType = type.modelName;
                    break;
                }
            }
            console.log(`Updating Buchung ${buchung} moving to ${delpocket.id}`);
            if (!buchung) {
                throw Error("Buchung nicht gefunden")
            }
            buchung.pocket = delpocket.id!
            const updatedBuchung = await buchung!.save()
            console.log(`Updated Buchung ${updatedBuchung}`);
        } catch (e) {
            console.log(e)
            throw e
        }
    }
    await Pocket.findByIdAndDelete(id).exec()
}