/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'class', // This enables dark mode
	theme: {
	  extend: {
		fontFamily: {
		  sans: ['Manrope', 'sans-serif'],
		  heading: ['"Roboto Slab"', 'serif'],
		},
	  },
	},
	plugins: [],
  }