import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const useIdleTimer = (timeout = 1000 * 60 * 15) => { // 15 minutos por defecto
    const [isIdle, setIsIdle] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const timerRef = useRef(null);

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsIdle(false);
        timerRef.current = setTimeout(() => {
            setIsIdle(true);
            logout();
            navigate('/login');
        }, timeout);
    };

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

        const handleActivity = () => resetTimer();

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        resetTimer(); // Iniciar timer

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [logout, navigate, timeout]);

    return isIdle;
};

export default useIdleTimer;
