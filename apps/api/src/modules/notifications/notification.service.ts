import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { NotificationModel } from "./notification.model.js";

export const createNotification = async (input: { companyId: string; userId: string; title: string; message: string; type: "INFO" | "SUCCESS" | "WARNING" | "ERROR"; metadata?: unknown }) => {
  if (getDatabaseStatus() !== "connected") return;
  await NotificationModel.create(input);
};
export const listNotifications = async (userId: string, companyId: string) => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
  return NotificationModel.find({ userId: new Types.ObjectId(userId), companyId }).sort({ createdAt: -1 }).limit(100);
};
export const markNotificationRead = async (userId: string, companyId: string, notificationId: string) => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
  if (!Types.ObjectId.isValid(notificationId)) throw new HttpError(400, "INVALID_NOTIFICATION_ID", "Notificación inválida");
  const notification = await NotificationModel.findOneAndUpdate({ _id: notificationId, userId, companyId }, { readAt: new Date() }, { new: true });
  if (!notification) throw new HttpError(404, "NOTIFICATION_NOT_FOUND", "Notificación no encontrada");
  return notification;
};