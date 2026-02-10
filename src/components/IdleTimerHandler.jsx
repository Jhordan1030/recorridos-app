import React from 'react';
import useIdleTimer from '../hooks/useIdleTimer';

const IdleTimerHandler = () => {
    // 15 minutos = 900000 ms
    useIdleTimer(900000);
    return null;
};

export default IdleTimerHandler;
