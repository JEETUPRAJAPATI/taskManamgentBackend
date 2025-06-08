// Color Override Utility - Force Professional Color Palette
// This utility forcefully removes all yellow colors and replaces them with professional alternatives

export const PROFESSIONAL_COLORS = {
  // Professional Corporate Blue palette
  primary: '#1e3a8a',      // Navy blue-800
  secondary: '#2563eb',    // Blue-600
  accent: '#3b82f6',       // Blue-500
  success: '#15803d',      // Green-600
  warning: '#2563eb',      // Blue-600 (NO ORANGE/YELLOW)
  danger: '#dc2626',       // Red-600
  info: '#0284c7',         // Sky-600
  
  // Text colors
  textPrimary: '#1e293b',  // Slate-800
  textSecondary: '#64748b', // Slate-500
  textMuted: '#94a3b8',    // Slate-400
  
  // Background colors
  bgPrimary: '#ffffff',    // White
  bgSecondary: '#f8fafc',  // Slate-50
  bgMuted: '#f1f5f9',      // Slate-100
  
  // Card backgrounds
  cardBg: '#ffffff',       // White cards
  cardBorder: '#e2e8f0',   // Light border
  
  // Professional blue shades for replacements
  lightBlue: '#dbeafe',    // Blue-100
  mediumBlue: '#93c5fd',   // Blue-300
  darkBlue: '#1e40af',     // Blue-800
};

// Function to replace unwanted colors with blue alternatives
export const replaceUnwantedColors = (color) => {
  if (!color) return color;
  
  const colorStr = color.toString().toLowerCase();
  
  // Unwanted color patterns to replace (yellow, orange, brown)
  const unwantedPatterns = [
    // Yellow patterns
    'yellow', '#ffff00', '#ffd700', '#fff700', '#ffef00', '#f59e0b', '#d97706',
    'rgb(255, 255, 0)', 'rgb(255, 215, 0)', 'rgb(255, 239, 0)', 'rgb(245, 158, 11)', 'rgb(217, 119, 6)',
    'hsl(60,', 'hsl(51,', 'hsl(45,', 'amber',
    
    // Orange patterns - COMPREHENSIVE
    'orange', '#ffa500', '#ff8c00', '#ff7f50', '#ff6347', '#ea580c', '#f97316', '#fb923c',
    'rgb(255, 165, 0)', 'rgb(255, 140, 0)', 'rgb(255, 127, 80)', 'rgb(234, 88, 12)', 'rgb(249, 115, 22)', 'rgb(251, 146, 60)',
    '234, 88, 12', '249, 115, 22', '251, 146, 60', // CSS variable format
    'hsl(39,', 'hsl(33,', 'hsl(16,', 'hsl(24,', 'hsl(32,',
    
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
    'rgb(255, 255, 0)', 'rgb(255, 215, 0)', 'rgb(255, 239, 0)', 'rgb(245, 158, 11)', 'rgb(217, 119, 6)',
    '#ffff00', '#ffd700', '#fff700', '#ffef00', '#f59e0b', '#d97706',
    
    // Orange patterns - EXACT MATCHES FOR CSS VARIABLES
    'rgb(255, 165, 0)', 'rgb(255, 140, 0)', 'rgb(255, 127, 80)', 'rgb(234, 88, 12)', 'rgb(249, 115, 22)', 'rgb(251, 146, 60)',
    'rgb(234 88 12)', 'rgb(249 115 22)', 'rgb(251 146 60)', // CSS variables format (no commas)
    '234, 88, 12', '249, 115, 22', '251, 146, 60', // Raw RGB values
    '#ffa500', '#ff8c00', '#ff7f50', '#ff6347', '#ea580c', '#f97316', '#fb923c',
    
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
      element.style.setProperty('background-color', 'rgb(219, 234, 254)', 'important');
    }
    
    // Check and override border color
    const borderColor = computedStyle.borderColor;
    if (borderColor && isUnwantedColor(borderColor)) {
      element.style.setProperty('border-color', 'rgb(147, 197, 253)', 'important');
    }
    
    // Check for yellow class names and replace them
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ');
      const updatedClasses = classes.map(cls => {
        if (cls.includes('yellow')) {
          return cls.replace('yellow', 'blue');
        }
        if (cls.includes('amber')) {
          return cls.replace('amber', 'blue');
        }
        return cls;
      });
      if (updatedClasses.join(' ') !== element.className) {
        element.className = updatedClasses.join(' ');
      }
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
      --amber-50: rgb(59, 130, 246) !important;
      --amber-100: rgb(59, 130, 246) !important;
      --amber-200: rgb(59, 130, 246) !important;
      --amber-300: rgb(59, 130, 246) !important;
      --amber-400: rgb(59, 130, 246) !important;
      --amber-500: rgb(59, 130, 246) !important;
      --amber-600: rgb(59, 130, 246) !important;
      --amber-700: rgb(59, 130, 246) !important;
      --amber-800: rgb(59, 130, 246) !important;
      --amber-900: rgb(59, 130, 246) !important;
      --yellow: rgb(59, 130, 246) !important;
      --amber: rgb(59, 130, 246) !important;
      --orange: rgb(59, 130, 246) !important;
    }
    
    /* Override any unwanted text or backgrounds */
    .text-yellow-50, .text-yellow-100, .text-yellow-200, .text-yellow-300, .text-yellow-400,
    .text-yellow-500, .text-yellow-600, .text-yellow-700, .text-yellow-800, .text-yellow-900,
    .text-orange-50, .text-orange-100, .text-orange-200, .text-orange-300, .text-orange-400,
    .text-orange-500, .text-orange-600, .text-orange-700, .text-orange-800, .text-orange-900,
    .text-amber-50, .text-amber-100, .text-amber-200, .text-amber-300, .text-amber-400,
    .text-amber-500, .text-amber-600, .text-amber-700, .text-amber-800, .text-amber-900,
    [style*="color: yellow"], [style*="color:#FFD700"], [style*="color:#FFFF00"],
    [style*="color: orange"], [style*="color:#FFA500"], [style*="color:#FF8C00"],
    [style*="color: amber"], [style*="color:#FFC107"], [style*="color:#FF6F00"],
    [class*="yellow"], [class*="amber"], [class*="orange"] {
      color: rgb(59, 130, 246) !important;
    }
    
    .bg-yellow-50, .bg-yellow-100, .bg-yellow-200, .bg-yellow-300, .bg-yellow-400,
    .bg-yellow-500, .bg-yellow-600, .bg-yellow-700, .bg-yellow-800, .bg-yellow-900,
    .bg-orange-50, .bg-orange-100, .bg-orange-200, .bg-orange-300, .bg-orange-400,
    .bg-orange-500, .bg-orange-600, .bg-orange-700, .bg-orange-800, .bg-orange-900,
    .bg-amber-50, .bg-amber-100, .bg-amber-200, .bg-amber-300, .bg-amber-400,
    .bg-amber-500, .bg-amber-600, .bg-amber-700, .bg-amber-800, .bg-amber-900,
    [style*="background-color: yellow"], [style*="background-color:#FFD700"], [style*="background-color:#FFFF00"],
    [style*="background-color: orange"], [style*="background-color:#FFA500"], [style*="background-color:#FF8C00"],
    [style*="background-color: amber"], [style*="background-color:#FFC107"], [style*="background-color:#FF6F00"] {
      background-color: rgb(219, 234, 254) !important;
    }
    
    /* Force override border colors */
    .border-yellow-50, .border-yellow-100, .border-yellow-200, .border-yellow-300, .border-yellow-400,
    .border-yellow-500, .border-yellow-600, .border-yellow-700, .border-yellow-800, .border-yellow-900,
    .border-orange-50, .border-orange-100, .border-orange-200, .border-orange-300, .border-orange-400,
    .border-orange-500, .border-orange-600, .border-orange-700, .border-orange-800, .border-orange-900,
    .border-amber-50, .border-amber-100, .border-amber-200, .border-amber-300, .border-amber-400,
    .border-amber-500, .border-amber-600, .border-amber-700, .border-amber-800, .border-amber-900 {
      border-color: rgb(147, 197, 253) !important;
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
  
  // Run very frequently to catch any missed changes
  const intervalId = setInterval(forceRemoveUnwantedColors, 100);
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(intervalId);
    observer.disconnect();
  });
};