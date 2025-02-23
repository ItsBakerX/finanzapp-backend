import { model, Schema, Types } from "mongoose";

export interface INotification {
	benutzer: Types.ObjectId;
	message: string;
	read: boolean;
}

export const notificationSchema = new Schema<INotification>({
	benutzer: {
		type: Schema.Types.ObjectId,
		ref: "Benutzer",
		required: true,
	},
	message: { type: String, required: true },
	read: { type: Boolean, default: false },
});

export const Notification = model("Notification", notificationSchema);
