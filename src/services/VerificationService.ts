import { Benutzer } from "../../src/models/BenutzerModel";
import { Verification } from "../../src/models/VerificationModel";

export async function createVerification(email: string, verificationCode: string): Promise<void> {
    try {
        await Verification.create({ email, verificationCode });
    } catch (e: any) {
        throw new Error(e);
    }
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
    const benutzer = await Verification.findOne({ email: email });
    if (!benutzer) {
        return false;
    }
    if (benutzer.verificationCode === code) {
        await Benutzer.updateOne({ email: email }, { active: true });
        await Verification.deleteOne({ email: email });
        return true;
    }
    return false;
}

export async function checkVerificationStatus(email: string): Promise<boolean> {
    const benutzer = await Benutzer.findOne({ email: email });
    if (!benutzer) {
        throw new Error("Benutzer nicht gefunden");
    }
    return benutzer.active ? true : false;
}