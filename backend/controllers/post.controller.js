// post.controller.js - Versión actualizada con notificaciones
import sharp from 'sharp';
import cloudinary from '../utils/cloudinary.js';
import { Post } from '../models/post.model.js';
import { User } from '../models/user.model.js';
import { Comment } from '../models/comment.model.js';
import { createNotification } from './notification.controller.js';
import { getReceiverSocketId, io } from "../socket/socket.js";

export const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file;
        const authorId = req.id;
        if (!image) return res.status(400).json({ message: 'Image is required' });

        // image upload
        const optimizedImageBuffer = await sharp(image.buffer)
            .resize({ width: 800, height: 600, fit: 'inside' })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();

        // buffer to data URI
        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
        const cloudResponse = await cloudinary.uploader.upload(fileUri);
        const post = await Post.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId
        });
        const user = await User.findById(authorId);
        if (user) {
            user.posts.push(post._id);
            await user.save();
        }

        await post.populate({ path: 'author', select: '-password' });

        // Opcional: Notificar a los seguidores sobre el nuevo post
        // const followers = await User.find({ following: authorId }, '_id');
        // for (const follower of followers) {
        //     await createNotification(
        //         authorId,
        //         follower._id,
        //         'new_post',
        //         `${user.username} published a new post`,
        //         post._id
        //     );
        // }

        return res.status(201).json({
            message: 'Post created successfully',
            post,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error creating post',
            success: false
        });
    }
}

export const getAllPost = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePicture' })
            .populate({
                path: 'comments',
                sort: { createdAt: -1 },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            });
        return res.status(200).json({
            posts,
            success: true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error fetching posts',
            success: false
        });
    }
}

export const getUserPost = async (req, res) => {
    try {
        const authorId = req.id;
        const posts = await Post.find({ author: authorId }).sort({ createdAt: -1 }).populate({
            path: 'author',
            select: 'username profilePicture'
        }).populate({
            path: 'comments',
            sort: { createdAt: -1 },
            populate: {
                path: 'author',
                select: 'username profilePicture'
            }
        });
        return res.status(200).json({
            posts,
            success: true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error fetching user posts',
            success: false
        });
    }
}

export const likePost = async (req, res) => {
    try {
        const likeUserId = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found', success: false });
        }

        await post.updateOne({ $addToSet: { likes: likeUserId } });
        await post.save();

        // Crear notificación para el dueño del post
        const user = await User.findById(likeUserId).select('username profilePicture');
        const postOwnerId = post.author.toString();
        
        if (postOwnerId !== likeUserId) {
            await createNotification(
                likeUserId,
                postOwnerId,
                'like',
                `${user.username} liked your post`,
                postId
            );
        }

        return res.status(200).json({ message: 'Post liked', success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error liking post',
            success: false
        });
    }
}

export const dislikePost = async (req, res) => {
    try {
        const likeUserId = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found', success: false });
        }

        await post.updateOne({ $pull: { likes: likeUserId } });
        await post.save();

        // Opcional: Eliminar la notificación de like si existe
        // await Notification.findOneAndDelete({
        //     from: likeUserId,
        //     to: post.author,
        //     type: 'like',
        //     post: postId
        // });

        return res.status(200).json({ message: 'Post disliked', success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error disliking post',
            success: false
        });
    }
}

export const addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const commentUserId = req.id;
        const { text } = req.body;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found', success: false });
        }

        if (!text) return res.status(400).json({ message: 'Comment text is required', success: false });

        const comment = await Comment.create({
            text,
            author: commentUserId,
            post: postId
        });

        await comment.populate({
            path: 'author',
            select: "username profilePicture"
        });

        post.comments.push(comment._id);
        await post.save();

        // Crear notificación para el dueño del post
        const commentUser = await User.findById(commentUserId).select('username');
        const postOwnerId = post.author.toString();
        
        if (postOwnerId !== commentUserId) {
            await createNotification(
                commentUserId,
                postOwnerId,
                'comment',
                `${commentUser.username} commented on your post`,
                postId
            );
        }

        // Opcional: Buscar menciones en el comentario (@username)
        const mentions = text.match(/@(\w+)/g);
        if (mentions) {
            for (const mention of mentions) {
                const username = mention.substring(1);
                const mentionedUser = await User.findOne({ username });
                if (mentionedUser && mentionedUser._id.toString() !== commentUserId) {
                    await createNotification(
                        commentUserId,
                        mentionedUser._id,
                        'mention',
                        `${commentUser.username} mentioned you in a comment`,
                        postId
                    );
                }
            }
        }

        return res.status(201).json({
            message: 'Comment Added',
            comment,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error adding comment',
            success: false
        });
    }
}

export const getCommentsOfPost = async (req, res) => {
    try {
        const postId = req.params.id;

        const comments = await Comment.find({ post: postId }).populate('author', 'username profilePicture');

        if (!comments) return res.status(404).json({ message: 'No comments found for this post', success: false });

        return res.status(200).json({ success: true, comments });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error fetching comments',
            success: false
        });
    }
}

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        if (post.author.toString() !== authorId) return res.status(403).json({ message: 'Unauthorized' });

        await Post.findByIdAndDelete(postId);

        let user = await User.findById(authorId);
        user.posts = user.posts.filter(id => id.toString() !== postId);
        await user.save();

        await Comment.deleteMany({ post: postId });

        // Opcional: Eliminar notificaciones relacionadas con este post
        // await Notification.deleteMany({ post: postId });

        return res.status(200).json({ message: 'Post deleted successfully', success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error deleting post',
            success: false
        });
    }
}

export const bookmarkPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        const user = await User.findById(authorId);
        if (!user) return res.status(404).json({ message: 'User not found', success: false });

        if (user.bookmarks.includes(post._id)) {
            await user.updateOne({ $pull: { bookmarks: post._id } });
            await user.save();
            return res.status(200).json({ type: 'unsaved', message: 'Post removed from bookmark', success: true });
        } else {
            await user.updateOne({ $addToSet: { bookmarks: post._id } });
            await user.save();
            return res.status(200).json({ type: 'saved', message: 'Post bookmarked', success: true });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error bookmarking post',
            success: false
        });
    }
}