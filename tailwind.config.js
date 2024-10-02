const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navbar': {
          DEFAULT: colors.slate[900],
          hover: colors.slate[800],
        },
        'footer': {
          DEFAULT: colors.slate[900],
          text: colors.slate[300],
        },
        'body': {
          DEFAULT: colors.white,
          secondary: colors.gray[100],
        },
        'accent': {
          light: colors.green[400],
          DEFAULT: colors.green[500],
          dark: colors.green[600],
        },
        'text': {
          light: colors.gray[300],
          DEFAULT: colors.gray[900],
          dark: colors.gray[600],
        },
      },
    },

  },
  plugins: [],
}

