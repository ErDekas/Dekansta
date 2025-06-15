import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import axios from 'axios'
import { toast } from 'sonner'

const SuggestedUsers = () => {
  const { user: loggedInUser, suggestedUsers } = useSelector(store => store.auth)
  const dispatch = useDispatch()

  // Mapeamos cada usuario sugerido con si está seguido o no
  const [followingMap, setFollowingMap] = useState({})

  useEffect(() => {
    const map = {}
    suggestedUsers.forEach(sUser => {
      map[sUser._id] = loggedInUser?.following?.includes(sUser._id)
    })
    setFollowingMap(map)
  }, [suggestedUsers, loggedInUser])

  const handleFollowToggle = async (targetUserId) => {
    try {
      const res = await axios.post(
        `https://dekansta.onrender.com/api/v1/user/followorunfollow/${targetUserId}`,
        {},
        { withCredentials: true }
      )

      if (res.data.success) {
        // Actualiza el mapa de estado local
        setFollowingMap(prev => ({
          ...prev,
          [targetUserId]: !prev[targetUserId],
        }))

        // Actualiza Redux y localStorage
        const updatedUser = { ...loggedInUser }
        if (updatedUser.following.includes(targetUserId)) {
          updatedUser.following = updatedUser.following.filter(id => id !== targetUserId)
        } else {
          updatedUser.following = [...updatedUser.following, targetUserId]
        }

        dispatch({ type: 'SET_USER', payload: updatedUser })
        localStorage.setItem('user', JSON.stringify(updatedUser))

        toast.success(res.data.message)
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Error updating follow state')
    }
  }

  return (
    <div className='my-10'>
      <div className='flex items-center justify-between text-sm'>
        <h1 className='font-semibold text-gray-600'>Suggested for you</h1>
        <span className='font-medium cursor-pointer'>See All</span>
      </div>

      {suggestedUsers.map(user => (
        <div key={user._id} className='flex items-center justify-between my-5'>
          <div className='flex items-center gap-2'>
            <Link to={`/profile/${user?._id}`}>
              <Avatar>
                <AvatarImage src={user?.profilePicture} alt='profile_image' />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <h1 className='font-semibold text-sm'>
                <Link to={`/profile/${user?._id}`}>{user?.username}</Link>
              </h1>
              <span className='text-gray-600 text-sm'>{user?.bio || 'Bio here...'}</span>
            </div>
          </div>
          <span
            className={`text-xs font-bold cursor-pointer ${
              followingMap[user._id] ? 'text-gray-500 hover:text-gray-700' : 'text-[#3BADF8] hover:text-[#3495d6]'
            }`}
            onClick={() => handleFollowToggle(user._id)}
          >
            {followingMap[user._id] ? 'Unfollow' : 'Follow'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default SuggestedUsers
