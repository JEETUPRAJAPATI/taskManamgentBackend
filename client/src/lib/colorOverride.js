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
  // Run initial override
  forceRemoveYellowColors();
  
  // Set up mutation observer to catch dynamic changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        setTimeout(forceRemoveYellowColors, 100);
      }
    });
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
  setInterval(forceRemoveYellowColors, 2000);
};