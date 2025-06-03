// Color Override Utility - Force Professional Color Palette
// This utility forcefully removes all yellow colors and replaces them with professional alternatives

export const PROFESSIONAL_COLORS = {
  // Professional color palette - Navy Blue, Orange, Green
  primary: '#1e3a8a',      // Navy blue-800
  secondary: '#334155',    // Slate-600
  accent: '#ea580c',       // Orange-600
  success: '#16a34a',      // Green-600
  warning: '#ea580c',      // Orange-600 (NO YELLOW)
  danger: '#dc2626',       // Red-600
  info: '#0284c7',         // Sky-600
  
  // Text colors
  textPrimary: '#0f172a',  // Slate-900
  textSecondary: '#64748b', // Slate-500
  textMuted: '#94a3b8',    // Slate-400
  
  // Background colors
  bgPrimary: '#ffffff',    // White
  bgSecondary: '#f8fafc',  // Slate-50
  bgMuted: '#f1f5f9',      // Slate-100
  
  // Dark mode variants
  dark: {
    bgPrimary: '#0f172a',    // Slate-900
    bgSecondary: '#1e293b',  // Slate-800
    textPrimary: '#f8fafc',  // Slate-50
    textSecondary: '#94a3b8', // Slate-400
  }
};

// Function to replace yellow colors with professional alternatives
export const replaceYellowColors = (color) => {
  if (!color) return color;
  
  const colorStr = color.toString().toLowerCase();
  
  // Yellow color patterns to replace
  const yellowPatterns = [
    'yellow', '#ffff00', '#ffd700', '#fff700', '#ffef00',
    'rgb(255, 255, 0)', 'rgb(255, 215, 0)', 'rgb(255, 239, 0)',
    'hsl(60,', 'hsl(51,', 'hsl(45,', 'amber'
  ];
  
  // Check if color contains yellow patterns
  const isYellow = yellowPatterns.some(pattern => colorStr.includes(pattern));
  
  if (isYellow) {
    return PROFESSIONAL_COLORS.accent; // Replace with orange
  }
  
  return color;
};

// Check if a color is yellow
const isYellowColor = (color) => {
  if (!color || color === 'transparent' || color === 'inherit') return false;
  
  const yellowPatterns = [
    'rgb(255, 255, 0)', 'rgb(255, 215, 0)', 'rgb(255, 239, 0)',
    '#ffff00', '#ffd700', '#fff700', '#ffef00'
  ];
  
  const colorStr = color.toLowerCase();
  return yellowPatterns.some(pattern => colorStr.includes(pattern)) || 
         colorStr.includes('yellow') || 
         colorStr.includes('amber');
};

// Force override yellow colors in DOM elements
export const forceRemoveYellowColors = () => {
  // Get all elements in the document
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    
    // Check and override text color
    const textColor = computedStyle.color;
    if (textColor && isYellowColor(textColor)) {
      element.style.setProperty('color', PROFESSIONAL_COLORS.accent, 'important');
    }
    
    // Check and override background color
    const bgColor = computedStyle.backgroundColor;
    if (bgColor && isYellowColor(bgColor)) {
      element.style.setProperty('background-color', 'transparent', 'important');
    }
    
    // Check and override border color
    const borderColor = computedStyle.borderColor;
    if (borderColor && isYellowColor(borderColor)) {
      element.style.setProperty('border-color', PROFESSIONAL_COLORS.secondary, 'important');
    }
  });
};

// Initialize color override system
export const initColorOverride = () => {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startColorOverride();
    });
  } else {
    startColorOverride();
  }
};

const startColorOverride = () => {
  // Run initial override
  forceRemoveYellowColors();
  
  // Add global CSS override style
  const style = document.createElement('style');
  style.textContent = `
    /* FORCE OVERRIDE ALL YELLOW COLORS - JAVASCRIPT INJECTION */
    * {
      --yellow-50: rgb(241, 245, 249) !important;
      --yellow-100: rgb(226, 232, 240) !important;
      --yellow-200: rgb(203, 213, 225) !important;
      --yellow-300: rgb(148, 163, 184) !important;
      --yellow-400: rgb(100, 116, 139) !important;
      --yellow-500: rgb(234, 88, 12) !important;
      --yellow-600: rgb(234, 88, 12) !important;
      --yellow-700: rgb(194, 65, 12) !important;
      --yellow-800: rgb(154, 52, 18) !important;
      --yellow-900: rgb(124, 45, 18) !important;
    }
    
    /* Override any yellow text or backgrounds */
    .text-yellow-50, .text-yellow-100, .text-yellow-200, .text-yellow-300, .text-yellow-400,
    .text-yellow-500, .text-yellow-600, .text-yellow-700, .text-yellow-800, .text-yellow-900,
    [style*="color: yellow"], [style*="color:#FFD700"], [style*="color:#FFFF00"] {
      color: rgb(234, 88, 12) !important;
    }
    
    .bg-yellow-50, .bg-yellow-100, .bg-yellow-200, .bg-yellow-300, .bg-yellow-400,
    .bg-yellow-500, .bg-yellow-600, .bg-yellow-700, .bg-yellow-800, .bg-yellow-900,
    [style*="background-color: yellow"], [style*="background-color:#FFD700"], [style*="background-color:#FFFF00"] {
      background-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
  
  // Set up mutation observer to catch dynamic changes
  const observer = new MutationObserver((mutations) => {
    let hasChanges = false;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setTimeout(forceRemoveYellowColors, 100);
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  // Also run on window load and resize
  window.addEventListener('load', forceRemoveYellowColors);
  window.addEventListener('resize', forceRemoveYellowColors);
  
  // Run periodically to catch any missed changes
  const intervalId = setInterval(forceRemoveYellowColors, 1000);
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(intervalId);
    observer.disconnect();
  });
};