import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import useGetUserProfile from "@/hooks/useGetUserProfile";
import { Link, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AtSign, Heart, MessageCircle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const Profile = () => {
  const params = useParams();
  const userId = params.id;
  const dispatch = useDispatch();

  useGetUserProfile(userId);

  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isFollowingLocal, setIsFollowingLocal] = useState(false);

  const { userProfile, user } = useSelector((store) => store.auth);

  // Sincroniza estado local al montar el componente
  useEffect(() => {
    if (user && userProfile?._id) {
      const isFollowed = user.following?.includes(userProfile._id);
      setIsFollowingLocal(isFollowed);
    }
  }, [user, userProfile]);

  const isLoggedInUserProfile = user?._id === userProfile?._id;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleFollowUnfollow = async () => {
    if (isFollowLoading || !userProfile?._id) return;

    setIsFollowLoading(true);
    try {
      const res = await axios.post(
        `https://dekansta.onrender.com/api/v1/user/followorunfollow/${userProfile._id}`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        const updatedUser = { ...user };
        const updatedUserProfile = { ...userProfile };

        if (isFollowingLocal) {
          updatedUser.following = updatedUser.following.filter(
            (id) => id !== userProfile._id
          );
          updatedUserProfile.followers = updatedUserProfile.followers.filter(
            (id) => id !== user._id
          );
        } else {
          updatedUser.following = [
            ...(updatedUser.following || []),
            userProfile._id,
          ];
          updatedUserProfile.followers = [
            ...(updatedUserProfile.followers || []),
            user._id,
          ];
        }

        // Actualiza Redux
        dispatch({ type: "SET_USER", payload: updatedUser });
        dispatch({ type: "SET_USER_PROFILE", payload: updatedUserProfile });

        // Actualiza localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Estado local
        setIsFollowingLocal(!isFollowingLocal);

        toast.success(res.data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const displayedPost =
    activeTab === "posts" ? userProfile?.posts : userProfile?.bookmarks;

  return (
    <div className="flex max-w-5xl justify-center mx-auto pl-10">
      <div className="flex flex-col gap-20 p-8">
        <div className="grid grid-cols-2">
          <section className="flex items-center justify-center">
            <Avatar className="h-32 w-32">
              <AvatarImage
                src={userProfile?.profilePicture}
                alt="profilephoto"
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </section>
          <section>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <span>{userProfile?.username}</span>
                {isLoggedInUserProfile ? (
                  <>
                    <Link to="/account/edit">
                      <Button
                        variant="secondary"
                        className="hover:bg-gray-200 h-8"
                      >
                        Edit profile
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      className="hover:bg-gray-200 h-8"
                    >
                      View archive
                    </Button>
                    <Button
                      variant="secondary"
                      className="hover:bg-gray-200 h-8"
                    >
                      Ad tools
                    </Button>
                  </>
                ) : isFollowingLocal ? (
                  <>
                    <Button
                      variant="secondary"
                      className="h-8"
                      onClick={handleFollowUnfollow}
                      disabled={isFollowLoading}
                    >
                      {isFollowLoading ? "Unfollowing..." : "Unfollow"}
                    </Button>
                    <Button variant="secondary" className="h-8">
                      <Link to='/chat'>
                      Message
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    className="bg-[#0095F6] hover:bg-[#3192d2] h-8"
                    onClick={handleFollowUnfollow}
                    disabled={isFollowLoading}
                  >
                    {isFollowLoading ? "Following..." : "Follow"}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <p>
                  <span className="font-semibold">
                    {userProfile?.posts?.length || 0}{" "}
                  </span>
                  posts
                </p>
                <p>
                  <span className="font-semibold">
                    {userProfile?.followers?.length || 0}{" "}
                  </span>
                  followers
                </p>
                <p>
                  <span className="font-semibold">
                    {userProfile?.following?.length || 0}{" "}
                  </span>
                  following
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold">
                  {userProfile?.bio || "bio here..."}
                </span>
                <Badge className="w-fit" variant="secondary">
                  <AtSign />{" "}
                  <span className="pl-1">{userProfile?.username}</span>{" "}
                </Badge>
              </div>
            </div>
          </section>
        </div>
        <div className="border-t border-t-gray-200">
          <div className="flex items-center justify-center gap-10 text-sm">
            <span
              className={`py-3 cursor-pointer ${
                activeTab === "posts" ? "font-bold" : ""
              }`}
              onClick={() => handleTabChange("posts")}
            >
              POSTS
            </span>
            <span
              className={`py-3 cursor-pointer ${
                activeTab === "saved" ? "font-bold" : ""
              }`}
              onClick={() => handleTabChange("saved")}
            >
              SAVED
            </span>
            <span className="py-3 cursor-pointer">REELS</span>
            <span className="py-3 cursor-pointer">TAGS</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {displayedPost?.map((post) => (
              <div key={post?._id} className="relative group cursor-pointer">
                <img
                  src={post.image}
                  alt="postimage"
                  className="rounded-sm my-2 w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center text-white space-x-4">
                    <button className="flex items-center gap-2 hover:text-gray-300">
                      <Heart />
                      <span>{post?.likes?.length || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-gray-300">
                      <MessageCircle />
                      <span>{post?.comments?.length || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
