// notification.model.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'comment', 'follow', 'mention'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null // Solo para likes, comments, mentions
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Índices para optimizar consultas
notificationSchema.index({ to: 1, createdAt: -1 });
notificationSchema.index({ to: 1, isRead: 1 });

// Middleware para limpiar notificaciones antiguas (opcional)
notificationSchema.pre('save', async function() {
    // Mantener solo las últimas 100 notificaciones por usuario
    const count = await this.constructor.countDocuments({ to: this.to });
    if (count > 100) {
        const oldNotifications = await this.constructor.find({ to: this.to })
            .sort({ createdAt: 1 })
            .limit(count - 100);
        
        const idsToDelete = oldNotifications.map(notif => notif._id);
        await this.constructor.deleteMany({ _id: { $in: idsToDelete } });
    }
});

export const Notification = mongoose.model("Notification", notificationSchema);