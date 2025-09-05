# SMNB Design System Documentation
## Comprehensive Design Report for SMNB AI-Powered News Platform

---

## Executive Summary

The SMNB webpage represents a sophisticated convergence of broadcast journalism aesthetics and modern AI technology interfaces. Drawing inspiration from professional newsroom control centers, terminal-based command interfaces, and high-end broadcast equipment, the interface creates a premium, intelligence-focused atmosphere that positions SMNB as the world's first AI-powered news curation platform while maintaining accessibility for everyday news consumers.

---

## 1. Design Philosophy

### 1.1 Core Concept
The design embodies a **"News Intelligence Terminal"** approach, combining:
- **Newsroom aesthetics** - Professional broadcast journalism visual language
- **AI/ML interface design** - Modern machine learning dashboard aesthetics  
- **Terminal/CLI elements** - Suggesting technical competence and real-time processing
- **Live broadcast indicators** - Dynamic status elements and real-time processing visualization

### 1.2 Design Principles
1. **Intelligence over information** - Every element suggests AI processing and understanding
2. **Live transparency** - Real-time status indicators and processing visibility
3. **Professional broadcast** - High-end newsroom equipment aesthetics
4. **Accessible sophistication** - Complex AI made approachable through clear design

---

## 2. Color System

### 2.1 Primary Grayscale Palette (BMW M-Series Inspired)

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Base Black** | `#191919` | rgb(25, 25, 25) | Primary background, main content areas |
| **Dark Gray** | `#1f1f1f` | rgb(31, 31, 31) | Secondary backgrounds, header, footer |
| **Medium Dark** | `#262626` | rgb(38, 38, 38) | Tertiary elements, subtle cards |
| **Medium** | `#2d2d2d` | rgb(45, 45, 45) | Borders, dividers |
| **Accent Gray** | `#404040` | rgb(64, 64, 64) | Interactive elements, buttons |

### 2.2 SMNB Intelligence Accent Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Electric Blue** | `#3b82f6` | rgb(59, 130, 246) | Primary CTAs, active states, AI indicators |
| **AI Purple** | `#8b5cf6` | rgb(139, 92, 246) | AI processing, intelligent features |
| **Neural Blue** | `#1a1a2e` | rgb(26, 26, 46) | Deep backgrounds with blue undertones |

### 2.3 Status & News Colors

| Color | Hex Code | Usage | Context |
|-------|----------|-------|---------|
| **Breaking Red** | `#ef4444` | Urgent news, live indicators | High-priority stories |
| **Processing Orange** | `#f59e0b` | Developing stories, analysis | Story development states |
| **Analysis Blue** | `#3b82f6` | In-depth coverage, AI insights | Intelligence processing |
| **Human Interest Green** | `#10b981` | Positive stories, community | Positive sentiment stories |
| **Host Orange** | `#fb923c` | AI host narration, personality | Host interaction elements |

### 2.4 CSS Custom Properties

```css
:root {
  /* SMNB Grayscale Foundation */
  --base-black: #191919;
  --dark-gray: #1f1f1f;
  --medium-dark: #262626;
  --medium: #2d2d2d;
  --accent-gray: #404040;
  
  /* SMNB Intelligence Accents */
  --electric-blue: #3b82f6;
  --ai-purple: #8b5cf6;
  --neural-blue: #1a1a2e;
  
  /* News Status Colors */
  --breaking-red: #ef4444;
  --processing-orange: #f59e0b;
  --analysis-blue: #3b82f6;
  --human-interest-green: #10b981;
  --host-orange: #fb923c;
}
```

---

### 2.3 Text Hierarchy Colors

| Level | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| **Primary** | `#ffffff` | rgb(255, 255, 255) | Headlines, primary content |
| **Secondary** | `#e5e5e5` | rgb(229, 229, 229) | Body text, descriptions |
| **Tertiary** | `#b8b8b8` | rgb(184, 184, 184) | Supporting text |
| **Quaternary** | `#9d9d9d` | rgb(157, 157, 157) | Meta information |
| **Muted** | `#757575` | rgb(117, 117, 117) | Disabled states |

### 2.4 Transparency & Glass Effects

- **Glass effects**: 5%, 8%, 10%, 15% blue-tinted overlays
- **Border opacity**: `border-blue-400/10` for subtle AI-themed separation
- **Background overlays**: `bg-[#1a1a2e]/80` for layered intelligence depth

---

## 3. Typography System

### 3.1 Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
```

### 3.2 News-Focused Type Scale

| Class | Size | Line Height | Letter Spacing | Weight | Usage |
|-------|------|-------------|----------------|--------|-------|
| **text-hero** | clamp(3rem, 8vw, 6rem) | 0.85 | -0.04em | 900 | News headlines, main titles |
| **text-display** | clamp(2rem, 5vw, 4rem) | 0.9 | -0.03em | 800 | Section titles, story headers |
| **text-subtitle** | clamp(1.25rem, 3vw, 1.5rem) | 1.2 | -0.01em | 600 | Story subtitles, categories |
| **text-body-large** | 1.25rem | 1.6 | normal | 400 | Lead story descriptions |
| **text-body-elegant** | 1.125rem | 1.7 | normal | 400 | Standard story content |

### 3.3 Monospace Usage
- **Font**: `font-mono` (system monospace)
- **Context**: AI processing states, system status, pipeline indicators
- **Size**: Typically `text-sm` (0.875rem) or `text-xs` (0.75rem)
- **Color**: Often paired with accent colors for technical information

---

## 4. Component Architecture

### 4.1 Glass Morphism System (SMNB Intelligence Theme)

Three levels of glass effects with sophisticated grayscale and blue AI accents:

```css
.glass-subtle {
  backdrop-filter: blur(20px) saturate(180%);
  background: rgba(25, 25, 25, 0.95); /* Base Black with transparency */
  border: 1px solid rgba(59, 130, 246, 0.1); /* Electric Blue accent */
}

.glass-card {
  backdrop-filter: blur(16px) saturate(160%);
  background: rgba(31, 31, 31, 0.8); /* Dark Gray with transparency */
  border: 1px solid rgba(59, 130, 246, 0.08); /* Electric Blue accent */
}

.glass-accent {
  backdrop-filter: blur(12px) saturate(140%);
  background: rgba(38, 38, 38, 0.9); /* Medium Dark with transparency */
  border: 1px solid rgba(139, 92, 246, 0.15); /* AI Purple accent */
}

.glass-strong {
  backdrop-filter: blur(24px) saturate(200%);
  background: rgba(15, 15, 30, 0.9);
  border: 1px solid rgba(139, 92, 246, 0.1);
}
```

### 4.2 News Terminal Components

#### Header Intelligence Bar
- **Structure**: SMNB Logo + AI status indicators + Navigation
- **Status Line**: `$ smnb pipeline status` with live processing indicators
- **Visual**: Red "LIVE" indicator with pulsing animation

#### AI Processing Console
- **Window Controls**: Red, Yellow, Green circles (terminal-style)
- **Content**: Live terminal output showcasing multi-agent AI processing
- **Animation**: Real-time scrolling showing Reddit → Enrichment → Scoring → Narration
- **Commands**: `smnb host narrate`, `smnb agents orchestrate`, `smnb intelligence report`

#### Live Status Ticker
- **Content**: "LIVE AI NEWS CURATION • MULTI-AGENT PROCESSING • REAL-TIME NARRATION"
- **Speed**: 40-second marquee with seamless loop
- **Colors**: Different accent colors for each status type

### 4.3 AI Light Sweep Effect (Signature Intelligence Element)

The AI scanner effect appears on major headings, suggesting intelligent processing:

```css
@keyframes light-sweep {
  0% { background-position: -200% center; }
  50% { background-position: 200% center; }
  100% { background-position: -200% center; }
}

.animate-light-sweep {
  animation: light-sweep 25s ease-in-out infinite;
  background: linear-gradient(to right, transparent, rgba(59,130,246,0.3), transparent);
}
```

**Intelligence-themed Implementation**:
- Duration: 25 seconds (suggesting deep AI analysis)
- Pattern: Blue light bar representing AI scanning/processing
- Appearance: Sharp rectangles suggesting precision AI analysis

---

## 5. Animation System

### 5.1 Core News & AI Animations

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| **marquee** | 40s | linear | Breaking news ticker scrolling |
| **float** | 6s | ease-in-out | Floating AI processing orbs |
| **pulse-glow** | 2s | ease-in-out | Live status indicators |
| **code-scroll** | 30s | linear | AI processing console scroll |
| **light-sweep** | 25s | ease-in-out | AI intelligence scanner effect |

### 5.2 News-Specific Animation Principles
- **Live urgency**: Faster pulse animations for breaking news
- **AI precision**: Deliberate, measured animations suggesting intelligent processing
- **Broadcast continuity**: Smooth, professional transitions like newsroom graphics

---

## 6. Content Patterns

### 6.1 Live Status Elements
- **Processing indicators**: "🧠 PROCESSING", "🎙️ NARRATING", "📊 ANALYZING"
- **AI pipeline states**: raw → enriched → scored → scheduled → published
- **Real-time metrics**: Stories processed, quality scores, sentiment analysis

### 6.2 News Intelligence Metrics Display
- **🔥 Breaking Stories**
- **🧠 AI Analysis** 
- **🎙️ Live Narration**

Displayed with emoji indicators and technical precision.

### 6.3 AI Host Personalities
- **Professional**: "Good evening. Here are tonight's top stories from across social media..."
- **Conversational**: "Hey there! So this is pretty interesting - let me break down what's happening..."
- **Technical**: "Analyzing the sentiment data, we see a 73% positive correlation with..."

---

## 7. Interactive Elements

### 7.1 SMNB Button Hierarchy

#### Primary Intelligence CTA
```css
bg-blue-400 text-[#0f0f1e] font-bold rounded-md
```

#### Secondary AI CTA  
```css
border-2 border-purple-400/30 text-white bg-secondary
```

#### Ghost Terminal Buttons
```css
border border-transparent hover:border-blue-400/30
```

### 7.2 News-Focused Hover States
- **Story cards**: Gentle lift with blue glow suggesting AI selection
- **Processing elements**: Subtle highlight indicating AI interaction
- **Navigation**: Blue accent transitions matching the intelligence theme

---

## 8. Special SMNB Effects

### 8.1 AI Processing Background
Five floating orbs representing different AI agents:
- **Blue orbs**: Reddit aggregation and data collection
- **Purple orbs**: AI enrichment and analysis processing
- **Mixed colors**: Multi-agent coordination and intelligence synthesis

### 8.2 SMNB Intelligence Gradients
Strategic grayscale to blue gradients suggesting AI depth and sophistication:
```css
/* Primary Background Gradient */
background: linear-gradient(135deg, #191919 0%, #262626 100%);

/* AI Processing Accent */
background: linear-gradient(135deg, #1f1f1f 0%, #1a1a2e 100%);

/* Deep Intelligence Theme */
background: linear-gradient(45deg, #191919 0%, #1a1a2e 50%, #262626 100%);
```

---

## 9. SMNB Brand Consistency Rules

### 9.1 Logo Usage
- **Icon**: Brain icon representing AI intelligence
- **Container**: 8x8 with blue border, brain icon inside
- **Animation**: Blue pulsing dot for "active AI processing" state

### 9.2 Voice & Tone
- **Intelligent**: AI terminology, processing language
- **Transparent**: "See through the noise", visible AI pipeline
- **Professional**: News industry terminology with modern AI twist
- **Accessible**: Complex AI made understandable

### 9.3 Visual Hierarchy
1. AI light sweep headlines (blue sweep effect)
2. Primary news text (white)
3. Secondary story content (light gray)
4. AI status indicators (blue/purple/colored)
5. Processing meta information (muted)

---

## 10. News-Specific Features

### 10.1 Story Processing Visualization
- **Live feed cards**: Real Reddit posts with processing states
- **AI enrichment indicators**: Sentiment, categories, quality scores
- **Priority scoring**: Visual priority levels with color coding
- **Host narration**: AI personality delivering story summaries

### 10.2 Multi-Agent Pipeline Display
- **Aggregation**: Database icons, blue theme
- **Enrichment**: Brain icons, purple theme  
- **Scoring**: Chart icons, green theme
- **Narration**: Microphone icons, orange theme

### 10.3 Platform Comparison
- **Traditional News**: Limited, editorial bias, delayed
- **Raw Social Media**: Overwhelming, no filtering, no context
- **SMNB**: AI-curated, real-time, intelligent, transparent

---

## Conclusion

The SMNB design system successfully merges broadcast journalism aesthetics with cutting-edge AI interface design to create a unique news intelligence platform. The deep space color palette, combined with AI processing visualization and terminal-first interface elements, positions SMNB as the world's first AI-powered news curation platform.

The design's strength lies in its intelligence-first approach—using blue and purple accent colors to suggest AI processing, employing live status indicators that show real-time AI work, and maintaining professional news industry visual language throughout. This creates a cohesive experience that positions SMNB as both technically sophisticated and editorially trustworthy.

The multi-agent processing pipeline visualization, AI host personality system, and transparent intelligence approach differentiate SMNB from both traditional news platforms and raw social media feeds, establishing it as a new category: AI-powered news intelligence.

---

**Document Version**: 2.0  
**Last Updated**: September 2025  
**Platform**: SMNB - Social Media News Network  
**Maintained by**: ACDC Digital Design Team
.glass-subtle {
  backdrop-filter: blur(20px) saturate(180%);
  background: rgba(25, 25, 25, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.glass-card {
  backdrop-filter: blur(16px) saturate(160%);
  background: rgba(25, 25, 25, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.glass-strong {
  backdrop-filter: blur(24px) saturate(200%);
  background: rgba(25, 25, 25, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### 4.2 Terminal Components

#### Header Terminal
- **Structure**: Logo + Status indicators + Navigation
- **Status Line**: `$ aura --status waitlist`
- **Visual**: Green "waitlist" indicator with pulsing cursor

#### Console Demo
- **Window Controls**: Red, Yellow, Green circles (macOS style)
- **Content**: Scrolling terminal output showcasing agent interactions
- **Animation**: Continuous vertical scroll at 30s duration

#### Footer Terminal
- **Prompt**: `$ echo "thanks for exploring aura - happy coding!"`
- **Status Indicators**: Green/Yellow circles for system state

### 4.3 Scanner Effect (Signature Element)

The photocopier-inspired scanner effect appears on major headings:

```css
@keyframes light-sweep {
  0% { background-position: -200% center; }
  50% { background-position: 200% center; }
  100% { background-position: -200% center; }
}

.animate-light-sweep {
  animation: light-sweep 25s ease-in-out infinite;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
}
```

**Implementation**:
- Duration: 25 seconds (ultra-slow, deliberate)
- Pattern: Light bar sweeps left-to-right-to-left
- Appearance: Sharp rectangles with extended right padding (`pr-20`)

---

## 5. Animation System

### 5.1 Core Animations

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| **marquee** | 40s | linear | Status ticker scrolling |
| **float** | 6s | ease-in-out | Floating background orbs |
| **pulse-glow** | 2s | ease-in-out | Status indicators |
| **code-scroll** | 30s | linear | Terminal content scroll |
| **light-sweep** | 25s | ease-in-out | Scanner effect |

### 5.2 Animation Principles
- **Deliberate pacing**: Slow animations suggesting precision
- **Continuous motion**: No sudden stops or starts
- **Subtle presence**: Animations enhance, not distract

---

## 6. Layout System

### 6.1 Grid Structure
- **Maximum width**: `max-w-7xl` (80rem)
- **Padding**: `px-8` (2rem) standard, `px-6` (1.5rem) mobile
- **Section spacing**: `py-16` (4rem) standard sections

### 6.2 Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### 6.3 Component Grids
- **Hero**: 12-column grid (6-6 split on desktop)
- **Cards**: 3-column grid (responsive to 1 column mobile)
- **Footer**: 4-column grid (stacks on mobile)

---

## 7. Interactive Elements

### 7.1 Button Hierarchy

#### Primary CTA
```css
bg-blue-400 text-[#191919] font-bold rounded-md
```

#### Secondary CTA
```css
border-2 border-tertiary text-white bg-secondary
```

#### Ghost Buttons
```css
border border-transparent hover:border-primary/30
```

### 7.2 Hover States
- **Removed hover effects** on key CTAs for cleaner interaction
- **Terminal navigation**: Subtle background highlight on hover
- **Links**: Color transition to white or respective accent

---

## 8. Content Patterns

### 8.1 Status Ticker
- **Continuous loop** with duplicated content for seamless scrolling
- **Color-coded segments**: Each information type has distinct color
- **Speed**: 40-second full cycle
- **Edge fading**: Gradient masks at edges for smooth appearance

### 8.2 Metrics Display
- **10x Faster Growth**
- **$0 Start Free**
- **∞ Possibilities**

Displayed in glass cards with large typography for impact.

### 8.3 Pricing Structure
- **Three tiers**: Free, Pro ($5/mo), Power User ($20/mo)
- **Extension pricing**: Transparent per-use costs
- **Visual hierarchy**: Pro tier scaled up 105% as recommended option

---

## 9. Special Effects

### 9.1 Background Animation
Five floating orbs with different delays creating depth:
```css
.animate-float {
  animation: float 6s ease-in-out infinite;
}
```

### 9.2 Gradient Overlays
Strategic use of gradients for depth without color:
```css
background: linear-gradient(135deg, #191919 0%, #262626 100%);
```

---

## 10. Accessibility Considerations

### 10.1 Contrast Ratios
- **Primary text on background**: 21:1 (AAA compliant)
- **Secondary text on background**: 11:1 (AAA compliant)
- **Minimum contrast**: 4.5:1 for all text elements

### 10.2 Motion Preferences
Consider implementing:
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable animations */
}
```

### 10.3 Semantic Structure
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels on interactive elements
- Keyboard navigation support

---

## 11. Implementation Guidelines

### 11.1 Component Naming Convention
- **Utility classes**: Tailwind CSS utilities
- **Custom classes**: `.glass-*`, `.text-*`, `.animate-*`
- **Semantic naming**: Purpose-driven rather than appearance-driven

### 11.2 Performance Optimization
- **Backdrop filters**: Used sparingly for performance
- **Animation GPU acceleration**: Transform and opacity only
- **Image optimization**: SVG icons from Lucide React

### 11.3 Browser Compatibility
- **Modern browsers**: Full support
- **Fallbacks**: Solid backgrounds for browsers without backdrop-filter
- **CSS Grid/Flexbox**: Primary layout methods

---

## 12. Brand Consistency Rules

### 12.1 Logo Usage
- **Icon**: Fingerprint from Lucide React
- **Container**: 8x8 with border, 4x4 icon inside
- **Animation**: Pulsing dot indicator for "active" state

### 12.2 Voice & Tone
- **Technical**: Terminal commands, lowercase naming
- **Professional**: Clear value propositions
- **Accessible**: No jargon in main content

### 12.3 Visual Hierarchy
1. Scanner effect headlines (white on sweep)
2. Primary text (white)
3. Secondary text (gray)
4. Status indicators (colored)
5. Meta information (muted gray)

---

## 13. Future Considerations

### 13.1 Dark Mode
Current design is dark-by-default. Light mode would require:
- Inverted grayscale palette
- Adjusted glass effects
- Modified scanner effect visibility

### 13.2 Component Extensions
- Additional terminal animations
- More sophisticated status visualizations
- Enhanced interactive console demonstrations

### 13.3 Performance Enhancements
- Lazy loading for animations below fold
- Optimized backdrop-filter usage
- Progressive enhancement for older browsers

---

## Conclusion

The AURA design system successfully merges industrial design aesthetics with modern web technology to create a unique, premium experience. The BMW M-Series inspired grayscale palette, combined with photocopier scanner effects and terminal-first interface elements, positions AURA as a sophisticated yet accessible platform for social media automation.

The design's strength lies in its restraint—using color sparingly for maximum impact, employing slow, deliberate animations that suggest precision, and maintaining consistent visual language throughout. This creates a cohesive brand experience that stands out in the crowded SaaS marketplace while remaining functionally excellent.

---

**Document Version**: 1.0  
**Last Updated**: September 2025  
**Maintained by**: ACDC Digital Design Team