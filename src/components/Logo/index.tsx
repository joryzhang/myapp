import React from 'react';
import { theme } from 'antd';

const { useToken } = theme;

interface LogoProps {
    className?: string;
    style?: React.CSSProperties;
    size?: number;
}

const Logo: React.FC<LogoProps> = ({ className, style, size = 64 }) => {
    const { token } = useToken();

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 1024 1024"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={style}
        >
            {/* Hexagon Background */}
            <path d="M512 85.3333L869.547 291.733V704.533L512 910.933L154.453 704.533V291.733L512 85.3333Z"
                fill={token.colorPrimary}
                fillOpacity="0.1"
                stroke={token.colorPrimary}
                strokeWidth="32"
                strokeLinejoin="round"
            />

            {/* Neural Network Nodes */}
            <circle cx="512" cy="340" r="48" fill={token.colorPrimary} />
            <circle cx="384" cy="554" r="48" fill={token.colorPrimary} />
            <circle cx="640" cy="554" r="48" fill={token.colorPrimary} />
            <circle cx="512" cy="740" r="48" fill={token.colorPrimary} />

            {/* Connections */}
            <path d="M512 340V740" stroke="white" strokeWidth="24" strokeLinecap="round" />
            <path d="M384 554L512 340" stroke="white" strokeWidth="24" strokeLinecap="round" />
            <path d="M640 554L512 340" stroke="white" strokeWidth="24" strokeLinecap="round" />
            <path d="M384 554L512 740" stroke="white" strokeWidth="24" strokeLinecap="round" />
            <path d="M640 554L512 740" stroke="white" strokeWidth="24" strokeLinecap="round" />

            {/* Highlight/Sparkle */}
            <path d="M850 180L870 200M850 180L830 160M850 180L870 160M850 180L830 200" stroke={token.colorWarning} strokeWidth="16" strokeLinecap="round" />

        </svg>
    );
};

export default Logo;
