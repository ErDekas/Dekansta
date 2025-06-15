// notification.controller.js
import { Notification } from '../models/notification.model.js';
import { User } from '../models/user.model.js';
import { getReceiverSocketId, io } from "../socket/socket.js";

// Crear una nueva notificación
export const createNotification = async (fromUserId, toUserId, type, message, postId = null) => {
    try {
        // No crear notificación si es el mismo usuario
        if (fromUserId.toString() === toUserId.toString()) return;

        // Verificar si ya existe una notificación similar reciente (evitar spam)
        const existingNotification = await Notification.findOne({
            from: fromUserId,
            to: toUserId,
            type: type,
            post: postId,
            createdAt: { $gte: new Date(Date.now() - 60000) } // último minuto
        });

        if (existingNotification) return;

        // Crear la notificación
        const notification = await Notification.create({
            from: fromUserId,
            to: toUserId,
            type: type,
            message: message,
            post: postId,
            isRead: false
        });

        await notification.populate([
            { path: 'from', select: 'username profilePicture' },
            { path: 'post', select: 'image' }
        ]);

        // Enviar notificación en tiempo real
        const receiverSocketId = getReceiverSocketId(toUserId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('notification', {
                _id: notification._id,
                type: notification.type,
                from: notification.from,
                post: notification.post,
                message: notification.message,
                createdAt: notification.createdAt,
                isRead: notification.isRead
            });
        }

        return notification;
    } catch (error) {
        console.log('Error creating notification:', error);
    }
};

// Obtener todas las notificaciones del usuario
export const getNotifications = async (req, res) => {
    try {
        const userId = req.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ to: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('from', 'username profilePicture')
            .populate('post', 'image');

        const unreadCount = await Notification.countDocuments({ 
            to: userId, 
            isRead: false 
        });

        return res.status(200).json({
            success: true,
            notifications,
            unreadCount,
            currentPage: page,
            hasMore: notifications.length === limit
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error fetching notifications',
            success: false
        });
    }
};

// Marcar notificación como leída
export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, to: userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                message: 'Notification not found',
                success: false
            });
        }

        return res.status(200).json({
            message: 'Notification marked as read',
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error marking notification as read',
            success: false
        });
    }
};

// Marcar todas las notificaciones como leídas
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.id;

        await Notification.updateMany(
            { to: userId, isRead: false },
            { isRead: true }
        );

        return res.status(200).json({
            message: 'All notifications marked as read',
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error marking all notifications as read',
            success: false
        });
    }
};

// Eliminar una notificación
export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            to: userId
        });

        if (!notification) {
            return res.status(404).json({
                message: 'Notification not found',
                success: false
            });
        }

        return res.status(200).json({
            message: 'Notification deleted successfully',
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error deleting notification',
            success: false
        });
    }
};

// Eliminar todas las notificaciones
export const deleteAllNotifications = async (req, res) => {
    try {
        const userId = req.id;

        await Notification.deleteMany({ to: userId });

        return res.status(200).json({
            message: 'All notifications deleted successfully',
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error deleting all notifications',
            success: false
        });
    }
};

// Obtener contador de notificaciones no leídas
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.id;

        const unreadCount = await Notification.countDocuments({
            to: userId,
            isRead: false
        });

        return res.status(200).json({
            success: true,
            unreadCount
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error getting unread count',
            success: false
        });
    }
};