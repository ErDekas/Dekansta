import { Heart, Home, LogOut, MessageCircle, PlusSquare, Search, TrendingUp } from 'lucide-react'
import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { toast } from 'sonner'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setAuthUser } from '@/redux/authSlice'
import CreatePost from './CreatePost'
import { setPosts, setSelectedPost } from '@/redux/postSlice'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'

// NUEVO: Añade estos imports arriba
import { X, Check, Trash2 } from 'lucide-react'

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { user } = useSelector(store => store.auth);
  const { likeNotification } = useSelector(store => store.realTimeNotification);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // Notificación visible o no

  const logoutHandler = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/v1/user/logout', { withCredentials: true });
      if (res.data.success) {
        dispatch(setAuthUser(null));
        dispatch(setSelectedPost(null));
        dispatch(setPosts([]));
        navigate("/login");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  }

  const sidebarHandler = (textType) => {
    if (textType === selectedItem) {
      setSelectedItem(null); // Toggle off
      return;
    }
    if (textType === 'Logout') logoutHandler();
    else if (textType === "Create") setOpen(true);
    else if (textType === "Profile") navigate(`/profile/${user?._id}`);
    else if (textType === "Home") navigate("/");
    else if (textType === 'Messages') navigate("/chat");
    else setSelectedItem(textType); // Marca elemento seleccionado (ej. Notificaciones)
  }

  const sidebarItems = [
    { icon: <Home />, text: "Home" },
    { icon: <Search />, text: "Search" },
    { icon: <TrendingUp />, text: "Explore" },
    { icon: <MessageCircle />, text: "Messages" },
    {
      icon: (
        <div className="relative">
          <Heart />
          {likeNotification.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {likeNotification.length}
            </span>
          )}
        </div>
      ),
      text: "Notifications"
    },
    { icon: <PlusSquare />, text: "Create" },
    {
      icon: (
        <Avatar className='w-6 h-6'>
          <AvatarImage src={user?.profilePicture} alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      ),
      text: "Profile"
    },
    { icon: <LogOut />, text: "Logout" },
  ];

  return (
    <div className='fixed top-0 left-0 z-10 h-screen flex'>
      {/* Sidebar principal */}
      <div className='px-4 border-r border-gray-300 w-64 bg-white'>
        <div className='flex flex-col'>
          <h1 className='my-8 pl-3 font-bold text-xl'>LOGO</h1>
          <div>
            {
              sidebarItems.map((item, index) => (
                <div
                  onClick={() => sidebarHandler(item.text)}
                  key={index}
                  className={`flex items-center gap-3 hover:bg-gray-100 cursor-pointer rounded-lg p-3 my-3 relative ${
                    selectedItem === item.text ? "bg-gray-200" : ""
                  }`}
                >
                  {item.icon}
                  <span>{item.text}</span>
                </div>
              ))
            }
          </div>
        </div>
        <CreatePost open={open} setOpen={setOpen} />
      </div>

      {/* Panel de notificaciones lateral */}
      {selectedItem === "Notifications" && (
        <div className="w-[400px] border-r border-gray-300 bg-white p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Notificaciones</h2>
            <button onClick={() => setSelectedItem(null)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          {likeNotification.length === 0 ? (
            <p className="text-sm text-gray-500">No tienes notificaciones nuevas.</p>
          ) : (
            likeNotification.map((notification) => (
              <div key={notification.userId} className="flex items-center gap-3 py-2 border-b">
                <Avatar>
                  <AvatarImage src={notification.userDetails?.profilePicture} />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-sm">
                  <span className="font-semibold">{notification.userDetails?.username}</span>{" "}
                  le dio like a tu publicación.
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;
