import { model, Schema } from "mongoose";

export interface IVerification {
    email: string;
    verificationCode: string;
    createdAt?: Date;
}

const verificationSchema = new Schema<IVerification>(
    {
    email: { type: String, required: true },
    verificationCode: { type: String, required: true }
    }, {
    timestamps: { createdAt: true, updatedAt: false }
});

export const Verification = model<IVerification>('Verification', verificationSchema);