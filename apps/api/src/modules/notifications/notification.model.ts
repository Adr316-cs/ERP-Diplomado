import { Schema, model, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  type: { type: String, enum: ["INFO", "SUCCESS", "WARNING", "ERROR"], required: true, default: "INFO" },
  readAt: { type: Date },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const NotificationModel = model("Notification", notificationSchema);