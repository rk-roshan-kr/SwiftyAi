import React from 'react';

export const DigiLockerLogo = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="20" width="80" height="60" rx="10" fill="#2563EB" />
        <path d="M35 20V10C35 5 40 2 50 2C60 2 65 5 65 10V20" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" />
        <circle cx="50" cy="50" r="15" fill="white" />
        <path d="M45 50L55 50" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 45L50 55" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 70L80 80" stroke="white" strokeWidth="5" strokeLinecap="round" />
        <path d="M20 70L30 80" stroke="white" strokeWidth="5" strokeLinecap="round" />
    </svg>
);

export const IndianEmblem = ({ className }) => (
    <svg viewBox="0 0 100 120" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        {/* Simplified Ashoka Pillar */}
        <path d="M20 20 C20 10, 35 0, 50 0 C65 0, 80 10, 80 20 L80 80 L20 80 Z" />
        <circle cx="35" cy="30" r="5" fill="white" opacity="0.5" />
        <circle cx="65" cy="30" r="5" fill="white" opacity="0.5" />
        <path d="M30 80 L30 100 L70 100 L70 80 Z" />
        <circle cx="50" cy="90" r="5" fill="white" />
        <path d="M25 100 L75 100 L80 110 L20 110 Z" />
    </svg>
);

export const AadhaarLogo = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Sun / Fingerprint Abstraction */}
        <circle cx="50" cy="50" r="45" stroke="#F59E0B" strokeWidth="2" />
        <path d="M50 10 L50 90" stroke="#DB2777" strokeWidth="8" strokeLinecap="round" />
        <path d="M20 30 C30 20, 70 20, 80 30" stroke="#10B981" strokeWidth="6" strokeLinecap="round" />
        <path d="M20 70 C30 80, 70 80, 80 70" stroke="#10B981" strokeWidth="6" strokeLinecap="round" />
        <circle cx="50" cy="50" r="15" fill="#DB2777" />
    </svg>
);
