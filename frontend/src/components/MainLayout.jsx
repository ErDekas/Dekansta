import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import { useDispatch } from 'react-redux';

const MainLayout = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      dispatch({ type: 'SET_USER', payload: JSON.parse(savedUser) });
    }
  }, [dispatch]);

  return (
    <div>
      <LeftSidebar />
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
