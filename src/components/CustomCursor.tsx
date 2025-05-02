import React, { useEffect, useState } from 'react';

const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hidden, setHidden] = useState(true);
  const [clicked, setClicked] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  useEffect(() => {
    const mobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    if (mobileDevice) return;
    
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setHidden(false);
    };

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);
    
    const handleLinkHoverOn = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'A' || 
          (e.target as HTMLElement).tagName === 'BUTTON' ||
          (e.target as HTMLElement).closest('a') || 
          (e.target as HTMLElement).closest('button')) {
        setLinkHovered(true);
      }
    };
    
    const handleLinkHoverOff = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'A' || 
          (e.target as HTMLElement).tagName === 'BUTTON' ||
          (e.target as HTMLElement).closest('a') || 
          (e.target as HTMLElement).closest('button')) {
        setLinkHovered(false);
      }
    };
    
    const handleMouseLeave = () => setHidden(true);
    const handleMouseEnter = () => setHidden(false);

    document.addEventListener('mousemove', updatePosition, { passive: true });
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleLinkHoverOn);
    document.addEventListener('mouseout', handleLinkHoverOff);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      document.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleLinkHoverOn);
      document.removeEventListener('mouseout', handleLinkHoverOff);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseLeave);
    };
  }, []);

  if (hidden) return null;

  return (
    <>
      <div 
        className={`fixed pointer-events-none z-50 rounded-full transform -translate-x-1/2 -translate-y-1/2 mix-blend-difference transition-transform duration-75 ${
          linkHovered ? 'w-8 h-8 bg-white' : 'w-6 h-6 bg-white'
        } ${clicked ? 'scale-75' : 'scale-100'}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      />
      <div 
        className="fixed pointer-events-none z-40 rounded-full w-8 h-8 border-2 border-white/50 transform -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transition: 'left 0.1s ease-out, top 0.1s ease-out, width 0.2s, height 0.2s',
          width: linkHovered ? '40px' : '30px',
          height: linkHovered ? '40px' : '30px',
        }}
      />
    </>
  );
};

export default CustomCursor