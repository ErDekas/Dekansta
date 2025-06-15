import { User } from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import getDataUri from '../utils/datauri.js';
import cloudinary from '../utils/cloudinary.js';
import { Post } from '../models/post.model.js';

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required", success: false });
        }
        // Check if user already exists
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists", success: false });
        };
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username,
            email,
            password: hashedPassword,
        });
        return res.status(201).json({ message: "User registered successfully", success: true });
    } catch (error) {
        console.log(error);
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required", success: false });
        }
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found", success: false });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password", success: false });
        }
        
        const token = await jwt.sign({userId:user._id}, process.env.SECRET_KEY, { expiresIn: '1d' });
        
        const populatedPosts = await Promise.all(
            user.posts.map( async (postId)=>{
                const post = await Post.findById(postId);
                if(post.author.equals(user._id)){
                    return post;
                }
                return null;
            })
        );
        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: populatedPosts,
        }

        return res.cookie("token", token, {httpOnly:true, sameSite:'strict', maxAge:1*24*60*60*1000}).json({
            message: `Login successful. Welcome back ${user.username}`,
            success: true,
            user
        });
    } catch (error) {
        console.log(error);
    }
};

export const logout = async (_, res) => {
    try {
        return res.cookie("token", "", {maxAge:0}).json({
            message: "Logout successfully",
            success: true
        });
    } catch (error) {
        console.log(error);
    }
}

export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId).populate({path:'posts', createdAt:-1}).populate('bookmarks');
        return res.status(200).json({
            user,
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};

export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        let cloudResponse;

        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: 'User not found.',
                success: false
            });
        };
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message: 'Profile updated.',
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
    }
};
export const getSuggestedUsers = async (req, res) => {
    try {
        const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select("-password");
        if (!suggestedUsers) {
            return res.status(400).json({
                message: 'Currently do not have any users',
            })
        };
        return res.status(200).json({
            success: true,
            users: suggestedUsers
        })
    } catch (error) {
        console.log(error);
    }
};
export const followOrUnfollow = async (req, res) => {
    try {
        const follower = req.id;
        const whoIsFollow = req.params.id;
        if (follower === whoIsFollow) {
            return res.status(400).json({
                message: 'You cannot follow/unfollow yourself',
                success: false
            });
        }

        const user = await User.findById(follower);
        const targetUser = await User.findById(whoIsFollow);

        if (!user || !targetUser) {
            return res.status(400).json({
                message: 'User not found',
                success: false
            });
        }
        const isFollowing = user.following.includes(whoIsFollow);
        if (isFollowing) {
            // unfollow logic
            await Promise.all([
                User.updateOne({ _id: follower }, { $pull: { following: whoIsFollow } }),
                User.updateOne({ _id: whoIsFollow }, { $pull: { followers: follower } }),
            ])
            
            // Obtener datos actualizados
            const updatedUser = await User.findById(follower);
            const updatedTargetUser = await User.findById(whoIsFollow);
            
            return res.status(200).json({ 
                message: 'Unfollowed successfully', 
                success: true,
                user: updatedUser,
                targetUser: updatedTargetUser
            });
        } else {
            // follow logic
            await Promise.all([
                User.updateOne({ _id: follower }, { $push: { following: whoIsFollow } }),
                User.updateOne({ _id: whoIsFollow }, { $push: { followers: follower } }),
            ])
            
            // Obtener datos actualizados
            const updatedUser = await User.findById(follower);
            const updatedTargetUser = await User.findById(whoIsFollow);
            
            return res.status(200).json({ 
                message: 'Followed successfully', 
                success: true,
                user: updatedUser,
                targetUser: updatedTargetUser
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', success: false });
    }
}