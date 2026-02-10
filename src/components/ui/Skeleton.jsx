import React from 'react';

const Skeleton = ({ className = '', variant = 'rect' }) => {
    const baseStyles = "animate-pulse bg-slate-200 rounded-2xl";

    const variants = {
        rect: "h-24 w-full",
        circle: "h-14 w-14 rounded-full",
        text: "h-4 w-3/4 rounded-lg",
        title: "h-8 w-1/2 rounded-xl",
        card: "h-48 w-full rounded-[2rem]",
        stat: "h-32 w-full rounded-3xl"
    };

    return (
        <div className={`${baseStyles} ${variants[variant] || ''} ${className}`} />
    );
};

export default Skeleton;
