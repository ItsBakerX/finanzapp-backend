import { Schema, model, Model } from "mongoose";
import bcrypt from "bcryptjs"

export interface IBenutzer {
    name: string;
    email: string;
    password: string;
    active?: boolean;
}

export interface IBenutzerMethods {
    isCorrectPassword(password: string): Promise<boolean>;
}

type BenutzerModel = Model<IBenutzer, {}, IBenutzerMethods>;

const benutzerSchema = new Schema<IBenutzer>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: false }
});

benutzerSchema.pre('save', async function () {
    if (this.isModified('password')) {
        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
    }
})

benutzerSchema.pre('updateOne', async function () {
    const update = this.getUpdate();
    if (update && "password" in update) {
        const hashedPassword = await bcrypt.hash(update.password, 10);
        update.password = hashedPassword;
    }
})

benutzerSchema.method("isCorrectPassword", async function (candidatePassword: string): Promise<boolean> {
    if (candidatePassword === this.password) {
        throw new Error("Passwort wurde nicht gehasht");
    }
    return await bcrypt.compare(candidatePassword, this.password);
})
export const Benutzer = model<IBenutzer, BenutzerModel>('Benutzer', benutzerSchema);