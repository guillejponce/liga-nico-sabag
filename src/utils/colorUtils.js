// Map of color names to their Tailwind CSS classes
const colorMap = {
  // Primary colors
  red: {
    bg: 'bg-red-500',
    text: 'text-red-500',
    border: 'border-red-500',
    hover: 'hover:bg-red-600',
    light: 'bg-red-100',
  },
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    border: 'border-blue-500',
    hover: 'hover:bg-blue-600',
    light: 'bg-blue-100',
  },
  green: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-500',
    hover: 'hover:bg-green-600',
    light: 'bg-green-100',
  },
  yellow: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    border: 'border-yellow-500',
    hover: 'hover:bg-yellow-600',
    light: 'bg-yellow-100',
  },
  black: {
    bg: 'bg-black',
    text: 'text-black',
    border: 'border-black',
    hover: 'hover:bg-black',
    light: 'bg-black',
  },
  white: {
    bg: 'bg-white',
    text: 'text-white',
    border: 'border-white',
    hover: 'hover:bg-white',
    light: 'bg-white',
  },
  gray: {
    bg: 'bg-gray-500',
    text: 'text-gray-500',
    border: 'border-gray-500',
    hover: 'hover:bg-gray-600',
    light: 'bg-gray-100',
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-purple-500',
    border: 'border-purple-500',
    hover: 'hover:bg-purple-600',
    light: 'bg-purple-100',
  },
  orange: {
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    border: 'border-orange-500',
    hover: 'hover:bg-orange-600',
    light: 'bg-orange-100',
  },
  lightblue: {
    bg: 'bg-lightblue-500',
    text: 'text-lightblue-500',
    border: 'border-lightblue-500',
    hover: 'hover:bg-lightblue-600',
    light: 'bg-lightblue-100',
  },
};

// Get color classes for a team
export const getTeamColorClasses = (primaryColor, secondaryColor, type = 'bg') => {
  const primary = colorMap[primaryColor?.toLowerCase()] || colorMap.blue;
  const secondary = colorMap[secondaryColor?.toLowerCase()] || colorMap.white;

  return {
    primary: primary[type] || primary.bg,
    secondary: secondary[type] || secondary.bg,
    hover: primary.hover,
    light: primary.light,
  };
};

// Get gradient classes for a team
export const getTeamGradientClass = (primaryColor, secondaryColor) => {
  const primary = colorMap[primaryColor?.toLowerCase()] || colorMap.blue;
  const secondary = colorMap[secondaryColor?.toLowerCase()] || colorMap.white;

  // Extract the color values from the Tailwind classes
  const primaryClass = primary.bg.replace('bg-', '');
  const secondaryClass = secondary.bg.replace('bg-', '');

  return `bg-gradient-to-r from-${primaryClass} to-${secondaryClass}`;
};

// Get text color based on background color for contrast
export const getContrastTextColor = (backgroundColor) => {
  const darkColors = ['blue', 'green', 'red'];
  return darkColors.includes(backgroundColor?.toLowerCase()) ? 'text-white' : 'text-gray-900';
};
