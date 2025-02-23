import { HydratedDocument } from "mongoose";
import { Benutzer, IBenutzer } from "../../src/models/BenutzerModel";
import { BenutzerResource } from "src/Resources";

export async function loginBenutzer(email: string, password: string): Promise<string | false> {
    const foundBenutzer = await Benutzer.findOne({ email: email }).exec();
    if (!foundBenutzer) {
        return false;
    }
    const isPasswordCorrect = await foundBenutzer.isCorrectPassword(password);
    if (!isPasswordCorrect) {
        return false;
    }
    return foundBenutzer.id
}

export async function registerBenutzer(email: string, name: string, password: string): Promise<string | false> {
    let registeredBenutzer: HydratedDocument<IBenutzer>;
    try {
        registeredBenutzer = await Benutzer.create({
            name: name,
            email: email,
            password: password,
        });
    } catch (e) {
        return false;
    }
    return registeredBenutzer.id
}