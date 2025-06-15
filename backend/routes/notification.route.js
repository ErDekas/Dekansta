// notification.route.js
import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    deleteAllNotifications,
    getUnreadCount 
} from "../controllers/notification.controller.js";

const router = express.Router();

// Obtener todas las notificaciones del usuario
router.route("/").get(isAuthenticated, getNotifications);

// Obtener contador de no leídas
router.route("/unread-count").get(isAuthenticated, getUnreadCount);

// Marcar una notificación como leída
router.route("/:notificationId/read").put(isAuthenticated, markAsRead);

// Marcar todas las notificaciones como leídas
router.route("/read-all").put(isAuthenticated, markAllAsRead);

// Eliminar una notificación específica
router.route("/:notificationId").delete(isAuthenticated, deleteNotification);

// Eliminar todas las notificaciones
router.route("/delete-all").delete(isAuthenticated, deleteAllNotifications);

export default router;