// Color Override Utility - Force Professional Color Palette
// This utility forcefully removes all yellow colors and replaces them with professional alternatives

export const PROFESSIONAL_COLORS = {
  // Professional Blue color palette - Various Blue Shades
  primary: '#2563eb',      // Blue-600
  secondary: '#1e40af',    // Blue-800
  accent: '#3b82f6',       // Blue-500
  success: '#22c55e',      // Green-500
  warning: '#60a5fa',      // Blue-400 (NO ORANGE/YELLOW)
  danger: '#dc2626',       // Red-600
  info: '#0ea5e9',         // Sky-500
  
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

// Function to replace unwanted colors with blue alternatives
export const replaceUnwantedColors = (color) => {
  if (!color) return color;
  
  const colorStr = color.toString().toLowerCase();
  
  // Unwanted color patterns to replace (yellow, orange, brown)
  const unwantedPatterns = [
    // Yellow patterns
    'yellow', '#ffff00', '#ffd700', '#fff700', '#ffef00',
    'rgb(255, 255, 0)', 'rgb(255, 215, 0)', 'rgb(255, 239, 0)',
    'hsl(60,', 'hsl(51,', 'hsl(45,', 'amber',
    
    // Orange patterns
    'orange', '#ffa500', '#ff8c00', '#ff7f50', '#ff6347',
    'rgb(255, 165, 0)', 'rgb(255, 140, 0)', 'rgb(255, 127, 80)',
    'hsl(39,', 'hsl(33,', 'hsl(16,',
    
    // Brown patterns
    'brown', '#a52a2a', '#8b4513', '#daa520', '#cd853f',
    'rgb(165, 42, 42)', 'rgb(139, 69, 19)', 'rgb(218, 165, 32)',
    'hsl(30,', 'hsl(25,', 'hsl(20,'
  ];
  
  // Check if color contains unwanted patterns
  const isUnwanted = unwantedPatterns.some(pattern => colorStr.includes(pattern));
  
  if (isUnwanted) {
    return PROFESSIONAL_COLORS.accent; // Replace with blue
  }
  
  return color;
};

// Check if a color is unwanted (yellow, orange, brown)
const isUnwantedColor = (color) => {
  if (!color || color === 'transparent' || color === 'inherit') return false;
  
  const unwantedPatterns = [
    // Yellow patterns
    'rgb(255, 255, 0)', 'rgb(255, 215, 0)', 'rgb(255, 239, 0)',
    '#ffff00', '#ffd700', '#fff700', '#ffef00',
    
    // Orange patterns  
    'rgb(255, 165, 0)', 'rgb(255, 140, 0)', 'rgb(255, 127, 80)',
    '#ffa500', '#ff8c00', '#ff7f50', '#ff6347',
    
    // Brown patterns
    'rgb(165, 42, 42)', 'rgb(139, 69, 19)', 'rgb(218, 165, 32)',
    '#a52a2a', '#8b4513', '#daa520', '#cd853f'
  ];
  
  const colorStr = color.toLowerCase();
  return unwantedPatterns.some(pattern => colorStr.includes(pattern)) || 
         colorStr.includes('yellow') || 
         colorStr.includes('amber') ||
         colorStr.includes('orange') ||
         colorStr.includes('brown');
};

// Force override unwanted colors in DOM elements
export const forceRemoveUnwantedColors = () => {
  // Get all elements in the document
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    
    // Check and override text color
    const textColor = computedStyle.color;
    if (textColor && isUnwantedColor(textColor)) {
      element.style.setProperty('color', PROFESSIONAL_COLORS.accent, 'important');
    }
    
    // Check and override background color
    const bgColor = computedStyle.backgroundColor;
    if (bgColor && isUnwantedColor(bgColor)) {
      element.style.setProperty('background-color', 'transparent', 'important');
    }
    
    // Check and override border color
    const borderColor = computedStyle.borderColor;
    if (borderColor && isUnwantedColor(borderColor)) {
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
  forceRemoveUnwantedColors();
  
  // Add global CSS override style
  const style = document.createElement('style');
  style.textContent = `
    /* FORCE OVERRIDE ALL UNWANTED COLORS - JAVASCRIPT INJECTION */
    * {
      --yellow-50: rgb(59, 130, 246) !important;
      --yellow-100: rgb(59, 130, 246) !important;
      --yellow-200: rgb(59, 130, 246) !important;
      --yellow-300: rgb(59, 130, 246) !important;
      --yellow-400: rgb(59, 130, 246) !important;
      --yellow-500: rgb(59, 130, 246) !important;
      --yellow-600: rgb(59, 130, 246) !important;
      --yellow-700: rgb(59, 130, 246) !important;
      --yellow-800: rgb(59, 130, 246) !important;
      --yellow-900: rgb(59, 130, 246) !important;
      --orange-50: rgb(59, 130, 246) !important;
      --orange-100: rgb(59, 130, 246) !important;
      --orange-200: rgb(59, 130, 246) !important;
      --orange-300: rgb(59, 130, 246) !important;
      --orange-400: rgb(59, 130, 246) !important;
      --orange-500: rgb(59, 130, 246) !important;
      --orange-600: rgb(59, 130, 246) !important;
      --orange-700: rgb(59, 130, 246) !important;
      --orange-800: rgb(59, 130, 246) !important;
      --orange-900: rgb(59, 130, 246) !important;
    }
    
    /* Override any unwanted text or backgrounds */
    .text-yellow-50, .text-yellow-100, .text-yellow-200, .text-yellow-300, .text-yellow-400,
    .text-yellow-500, .text-yellow-600, .text-yellow-700, .text-yellow-800, .text-yellow-900,
    .text-orange-50, .text-orange-100, .text-orange-200, .text-orange-300, .text-orange-400,
    .text-orange-500, .text-orange-600, .text-orange-700, .text-orange-800, .text-orange-900,
    [style*="color: yellow"], [style*="color:#FFD700"], [style*="color:#FFFF00"],
    [style*="color: orange"], [style*="color:#FFA500"], [style*="color:#FF8C00"] {
      color: rgb(59, 130, 246) !important;
    }
    
    .bg-yellow-50, .bg-yellow-100, .bg-yellow-200, .bg-yellow-300, .bg-yellow-400,
    .bg-yellow-500, .bg-yellow-600, .bg-yellow-700, .bg-yellow-800, .bg-yellow-900,
    .bg-orange-50, .bg-orange-100, .bg-orange-200, .bg-orange-300, .bg-orange-400,
    .bg-orange-500, .bg-orange-600, .bg-orange-700, .bg-orange-800, .bg-orange-900,
    [style*="background-color: yellow"], [style*="background-color:#FFD700"], [style*="background-color:#FFFF00"],
    [style*="background-color: orange"], [style*="background-color:#FFA500"], [style*="background-color:#FF8C00"] {
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
      setTimeout(forceRemoveUnwantedColors, 100);
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
  window.addEventListener('load', forceRemoveUnwantedColors);
  window.addEventListener('resize', forceRemoveUnwantedColors);
  
  // Run periodically to catch any missed changes
  const intervalId = setInterval(forceRemoveUnwantedColors, 1000);
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(intervalId);
    observer.disconnect();
  });
};