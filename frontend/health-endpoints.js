@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 9%;
    --primary: 351 70% 26%;
    --primary-foreground: 0 0% 100%;
    --secondary: 30 30% 96%;
    --secondary-foreground: 0 0% 9%;
    --muted: 30 20% 95%;
    --muted-foreground: 0 0% 45%;
    --accent: 351 70% 26%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 30 20% 88%;
    --input: 30 20% 88%;
    --ring: 351 70% 26%;
    --maroon: #6B0F1A;
    --maroon-dark: #4A0A12;
    --maroon-light: #8B1424;
    --cream: #FAF7F2;
    --radius: 0.25rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-white text-neutral-900;
    font-family: 'Inter', sans-serif;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Playfair Display', serif;
  }
}

@layer components {
  .btn-maroon {
    background-color: #6B0F1A;
    color: white;
    font-weight: 600;
    transition: background-color 0.2s;
  }
  .btn-maroon:hover {
    background-color: #4A0A12;
  }
  .btn-outline-maroon {
    border: 1px solid #6B0F1A;
    color: #6B0F1A;
    font-weight: 600;
    background-color: transparent;
    transition: all 0.2s;
  }
  .btn-outline-maroon:hover {
    background-color: #6B0F1A;
    color: white;
  }
  .text-maroon {
    color: #6B0F1A;
  }
  .bg-maroon {
    background-color: #6B0F1A;
  }
  .border-maroon {
    border-color: #6B0F1A;
  }
  .bg-cream {
    background-color: #FAF7F2;
  }
}

@layer base {
  [data-debug-wrapper="true"] {
    display: contents !important;
  }

  [data-debug-wrapper="true"] > * {
    margin-left: inherit;
    margin-right: inherit;
    margin-top: inherit;
    margin-bottom: inherit;
    padding-left: inherit;
    padding-right: inherit;
    padding-top: inherit;
    padding-bottom: inherit;
    column-gap: inherit;
    row-gap: inherit;
    gap: inherit;
    border-left-width: inherit;
    border-right-width: inherit;
    border-top-width: inherit;
    border-bottom-width: inherit;
    border-left-style: inherit;
    border-right-style: inherit;
    border-top-style: inherit;
    border-bottom-style: inherit;
    border-left-color: inherit;
    border-right-color: inherit;
    border-top-color: inherit;
    border-bottom-color: inherit;
  }
}
