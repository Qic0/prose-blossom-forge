# Minimalism 2026 + Classicism Kanban Design

## Overview
This document describes the implementation of a minimalist 2026 + classical design system for the Kanban board, replacing brown/gold accents with muted sapphire and soft platinum tones.

## Design Philosophy
- **Minimalism 2026**: Clean, uncluttered interface with purposeful elements
- **Classical Typography**: Serif fonts for headings, geometric sans for body text
- **No Decorative Patterns**: Focus on typography, spacing, and subtle accents
- **Premium Feel**: Sophisticated shadows, refined interactions, elegant proportions

## Color Palette

### Light Theme
```css
--minimalist-bg: #F6F5F3;        /* Warm ivory background */
--minimalist-card: #FFFFFF;      /* Pure white cards */
--minimalist-text: #0F1720;      /* Deep charcoal text */
--minimalist-muted: #7A7A7A;     /* Muted text */
--minimalist-accent: #0B3D91;    /* Muted sapphire */
--minimalist-platinum: #E6E9EE;  /* Soft platinum */
```

### Dark Theme
```css
--minimalist-bg: #0B0D10;        /* Deep graphite */
--minimalist-card: #131519;      /* Dark card background */
--minimalist-text: #E1E5E9;      /* Light text */
--minimalist-muted: #A6A6A6;     /* Muted light text */
--minimalist-accent: #3B6FBF;    /* Lighter sapphire */
--minimalist-platinum: #2A2D32;  /* Dark platinum */
```

## Typography System

### Fonts
- **Classical Serif**: Playfair Display, Cormorant Garamond for headings
- **Classical Sans**: Inter for body text and UI elements

### Usage
```css
/* Column titles - classical serif with small-caps */
.kanban-column-title {
  font-family: var(--font-classical-serif);
  font-variant: small-caps;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: lowercase;
}

/* Card content - geometric sans */
.kanban-card-title {
  font-family: var(--font-classical-sans);
  font-weight: 600;
  line-height: 1.3;
}
```

## Component Classes

### Kanban Container
```css
.kanban-container {
  background: hsl(var(--minimalist-bg));
  min-height: 100vh;
  font-family: var(--font-classical-sans);
}
```

### Columns
```css
.kanban-column {
  background: hsl(var(--minimalist-card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: var(--transition-luxury);
}
```

### Cards
```css
.kanban-card {
  background: hsl(var(--minimalist-card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  box-shadow: var(--shadow-1);
  transition: var(--transition-luxury);
  cursor: pointer;
}

/* Hover state */
.kanban-card:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: var(--shadow-2);
  border-color: hsl(var(--minimalist-accent) / 0.2);
}

/* Dragging state */
.kanban-card.dragging {
  transform: scale(1.04);
  opacity: 0.98;
  border-color: hsl(var(--minimalist-accent));
  box-shadow: var(--shadow-2), 0 0 0 1px hsl(var(--minimalist-accent) / 0.3);
  backdrop-filter: blur(3px);
}
```

### Badges
```css
.kanban-badge {
  background: hsl(var(--minimalist-platinum));
  border: 1px solid hsl(var(--border));
  color: hsl(var(--minimalist-text));
  font-family: var(--font-classical-sans);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: calc(var(--radius-sm) * 0.5);
  transition: var(--transition-base);
}
```

## Animations

### Card Appearance
```css
@keyframes kanban-card-appear {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Drop Animation
```css
@keyframes kanban-bounce {
  0% { transform: scale(0.985); }
  100% { transform: scale(1); }
}
```

## Accessibility

### Reduced Motion Support
All animations respect `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  .kanban-card, .kanban-column, 
  .kanban-card:hover, .kanban-column:hover {
    transform: none;
    transition: none;
  }
  
  .kanban-card-enter, .kanban-card-drop {
    animation: none;
  }
}
```

### Focus States
- Visible outlines for keyboard navigation
- Proper ARIA attributes
- Color contrast meets WCAG AA standards

## Implementation Notes

### CSS Variables
All colors use HSL format for consistency and easier manipulation.

### Performance
- Animations use `transform` and `opacity` for hardware acceleration
- Minimal layout thrashing with careful property selection
- Efficient transitions with `cubic-bezier` timing functions

### Browser Support
- Modern browsers with CSS custom properties support
- Graceful fallbacks for older browsers
- Backdrop-filter with fallback shadows

## Customization

To modify the accent color system-wide:
```css
:root {
  --minimalist-accent: 220 80% 35%; /* Different sapphire shade */
}
```

To adjust spacing:
```css
:root {
  --radius-lg: 20px; /* Larger border radius */
}
```

## Files Modified
- `src/index.css` - Added CSS variables and component styles
- `src/components/KanbanBoard.tsx` - Updated container classes
- `src/components/KanbanColumn.tsx` - Applied column styling
- `src/components/OrderCard.tsx` - Updated card appearance
- `tailwind.config.ts` - Added color tokens and font families
- `index.html` - Updated font imports