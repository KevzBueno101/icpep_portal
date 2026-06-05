/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#001F4D', // Deep Navy Blue
        secondary: '#003C8F', // Royal Blue
        accent: '#FFFFFF', // White
        highlight: '#D9D9D9', // Light Silver
      },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(135deg, #001F4D, #003C8F)',
        'diagonal-stripes': "repeating-linear-gradient(135deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 2px, transparent 2px, transparent 8px)",
      },
      boxShadow: {
        card: '0 4px 12px rgba(0,0,0,0.15)',
      },
      fontFamily: {
        primary: ['Montserrat', 'sans-serif'],
        secondary: ['Poppins', 'sans-serif'],
        body: ['Inter', 'Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};