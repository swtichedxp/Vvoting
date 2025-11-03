// components/Layout/GradientBackground.tsx

import React from 'react';

// This component provides the soft, full-screen gradient background for the pages.
// We use a fixed position and z-index to place it behind all content.
const GradientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* The gradient elements. We use absolute positioning and large dimensions 
        to create the soft, blurred glow effect from the corners.
      */}
      
      {/* Top Left Glow (Soft Purple/Pink) */}
      <div 
        className="absolute top-0 left-0 w-[60vw] h-[60vh] 
                   bg-pink-500/30 blur-3xl rounded-full opacity-50 
                   animate-pulse-slow"
        style={{ animationDuration: '15s', transform: 'translate(-50%, -50%)' }}
      />
      
      {/* Bottom Right Glow (Soft Yellow/Orange) */}
      <div 
        className="absolute bottom-0 right-0 w-[60vw] h-[60vh] 
                   bg-yellow-400/30 blur-3xl rounded-full opacity-50 
                   animate-pulse-slow"
        style={{ animationDuration: '20s', transform: 'translate(50%, 50%)' }}
      />

      {/* Custom Animation Keyframes (Not necessary for this simple example, 
        but included here to show how to define custom animation if needed). 
        We are relying on default Tailwind utility classes for simplicity.
      */}
    </div>
  );
};

export default GradientBackground;
