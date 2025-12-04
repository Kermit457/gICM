# Framer Motion Wizard

> **ID:** `framer-motion-wizard`
> **Tier:** 2
> **Token Cost:** 7000
> **MCP Connections:** context7

## 🎯 What This Skill Does

- Build fluid page transitions
- Create micro-interactions and hover states
- Implement scroll-triggered animations
- Design gesture-based interactions
- Orchestrate complex animation sequences
- AnimatePresence for mount/unmount
- Layout animations and shared element transitions
- Spring physics and keyframe animations

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** framer, motion, animation, animate, transition, gesture, spring
- **File Types:** N/A
- **Directories:** N/A

## 🚀 Core Capabilities


### 1. Build fluid page transitions

Page transitions enhance user experience by providing visual continuity between route changes. Framer Motion makes this seamless with AnimatePresence and motion components.

**Best Practices:**
- Use consistent transition durations across your app (200-400ms)
- Avoid blocking navigation with overly long animations
- Implement exit animations for smooth page departures
- Use layout animations to prevent layout shifts
- Provide reduced motion alternatives for accessibility
- Preload next page content before animating

**Common Patterns:**
```typescript
// app/layout.tsx - Page transition wrapper
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1], // Custom easing
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
    },
  },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Slide transition
const slideVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  }),
};

// Scale fade transition
const scaleFadeVariants = {
  initial: {
    scale: 0.95,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    scale: 1.05,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Morph transition (shared layout)
function NavigationExample() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <div className="grid gap-4">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layoutId={item.id}
            onClick={() => setSelectedId(item.id)}
            className="cursor-pointer rounded-lg bg-white p-4"
          >
            <motion.h2 layoutId={`title-${item.id}`}>{item.title}</motion.h2>
            <motion.p layoutId={`subtitle-${item.id}`}>{item.subtitle}</motion.p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedId && (
          <motion.div
            layoutId={selectedId}
            className="fixed inset-0 flex items-center justify-center bg-black/50"
            onClick={() => setSelectedId(null)}
          >
            <motion.div className="w-full max-w-2xl rounded-lg bg-white p-8">
              <motion.h2 layoutId={`title-${selectedId}`}>
                {items.find((i) => i.id === selectedId)?.title}
              </motion.h2>
              <motion.p layoutId={`subtitle-${selectedId}`}>
                {items.find((i) => i.id === selectedId)?.subtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p>Additional content appears after layout animation</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

**Gotchas:**
- AnimatePresence requires unique keys for each child
- Exit animations won't play if AnimatePresence unmounts
- Layout animations can be expensive on large components
- Remember to set `mode="wait"` to prevent overlap
- Custom easing requires array format `[x1, y1, x2, y2]`
- Initial animations on page load need `initial={false}` to disable


### 2. Create micro-interactions and hover states

Micro-interactions provide instant feedback and make interfaces feel alive. They should be subtle, fast, and enhance usability without distracting.

**Best Practices:**
- Keep hover animations under 200ms
- Use scale transforms for buttons (1.05-1.1 max)
- Provide visual feedback for all interactive elements
- Use whileHover and whileTap for consistency
- Add subtle shadows or glows for depth
- Consider touch devices (tap instead of hover)

**Common Patterns:**
```typescript
// Button micro-interactions
const ButtonMotion = motion.button;

function InteractiveButton() {
  return (
    <ButtonMotion
      whileHover={{
        scale: 1.05,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="rounded-lg bg-blue-600 px-6 py-3 text-white"
    >
      Click Me
    </ButtonMotion>
  );
}

// Card hover effect
function CardWithHover() {
  return (
    <motion.div
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="relative overflow-hidden rounded-xl bg-white p-6 shadow-lg"
    >
      <motion.div
        variants={{
          rest: { scale: 1, y: 0 },
          hover: { scale: 1.02, y: -5 },
        }}
        transition={{ duration: 0.2 }}
      >
        <h3>Card Title</h3>
        <p>Card content goes here</p>
      </motion.div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0"
        variants={{
          rest: { x: "-100%" },
          hover: { x: "100%" },
        }}
        transition={{ duration: 0.6 }}
      />
    </motion.div>
  );
}

// Icon rotation on hover
function RotatingIcon() {
  return (
    <motion.div
      whileHover={{ rotate: 180 }}
      transition={{ duration: 0.3 }}
      className="inline-block"
    >
      <IconComponent />
    </motion.div>
  );
}

// Ripple effect
function RippleButton() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples([...ripples, { x, y, id: Date.now() }]);
  };

  return (
    <motion.button
      onClick={handleClick}
      className="relative overflow-hidden rounded-lg bg-blue-600 px-6 py-3 text-white"
      whileTap={{ scale: 0.95 }}
    >
      Button Text
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute h-2 w-2 rounded-full bg-white"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 40, opacity: 0 }}
          transition={{ duration: 0.6 }}
          onAnimationComplete={() =>
            setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
          }
        />
      ))}
    </motion.button>
  );
}

// Magnetic button
function MagneticButton() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  return (
    <motion.button
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPosition({ x: 0, y: 0 })}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      className="rounded-lg bg-blue-600 px-6 py-3 text-white"
    >
      Magnetic Button
    </motion.button>
  );
}

// Loading spinner
function Spinner() {
  return (
    <motion.div
      className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-blue-600"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}
```

**Gotchas:**
- whileHover doesn't work on mobile (use whileTap)
- Scale transforms can cause text to blur (use translateZ(0) hack)
- Box shadows are expensive (consider alternatives)
- Ripple effects need overflow:hidden on parent
- Magnetic effects can feel weird on edges
- Always provide haptic feedback on mobile


### 3. Implement scroll-triggered animations

Scroll animations reveal content progressively, creating engaging storytelling experiences. Use them to guide user attention and create depth.

**Best Practices:**
- Use useScroll and useTransform for performance
- Trigger animations at 20-30% viewport entry (not 0%)
- Don't animate everything (it becomes noise)
- Use stagger effects for lists
- Keep scroll animations simple and predictable
- Provide instant-show for critical content

**Common Patterns:**
```typescript
import { useScroll, useTransform, motion, useInView } from "framer-motion";

// Fade in on scroll
function FadeInOnScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Parallax effect
function ParallaxSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  return (
    <div ref={ref} className="relative h-screen overflow-hidden">
      <motion.div
        style={{ y }}
        className="absolute inset-0 bg-gradient-to-b from-blue-500 to-purple-600"
      />
      <motion.div style={{ opacity }} className="relative z-10">
        <h1>Parallax Content</h1>
      </motion.div>
    </div>
  );
}

// Scroll progress indicator
function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 h-1 bg-blue-600 origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

// Stagger list on scroll
function StaggerList({ items }: { items: string[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.ul
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="space-y-4"
    >
      {items.map((item, i) => (
        <motion.li key={i} variants={itemVariants}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}

// Scale on scroll
function ScaleOnScroll() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  return (
    <motion.div
      ref={ref}
      style={{ scale }}
      className="mx-auto h-[400px] w-full max-w-4xl rounded-xl bg-gradient-to-br from-pink-500 to-purple-600"
    />
  );
}

// Reveal text by scroll
function RevealText({ text }: { text: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.25"],
  });

  const words = text.split(" ");

  return (
    <p ref={ref} className="text-4xl">
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        const opacity = useTransform(scrollYProgress, [start, end], [0.2, 1]);

        return (
          <motion.span key={i} style={{ opacity }} className="inline-block mr-2">
            {word}
          </motion.span>
        );
      })}
    </p>
  );
}
```

**Gotchas:**
- useScroll creates many event listeners (optimize with throttle)
- Parallax can cause janky scrolling on low-end devices
- useInView margin is opposite of what you expect
- Scroll transforms don't work in Safari < 15.4 without polyfill
- Multiple scroll observers can impact performance
- Remember to clean up scroll listeners


### 4. Design gesture-based interactions

Gestures make interfaces feel natural and intuitive. Framer Motion provides powerful drag, pan, and swipe detection out of the box.

**Best Practices:**
- Provide visual feedback during drag (lift, shadow)
- Implement drag constraints for boundaries
- Use dragElastic for natural feel (0.1-0.2)
- Add haptic feedback on mobile gestures
- Show drag affordances (handles, instructions)
- Support keyboard alternatives

**Common Patterns:**
```typescript
// Draggable card
function DraggableCard() {
  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      whileDrag={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
      className="h-40 w-60 cursor-grab rounded-xl bg-white p-6 active:cursor-grabbing"
    >
      <h3>Drag me!</h3>
    </motion.div>
  );
}

// Swipe to dismiss
function SwipeToDismiss({ onDismiss }: { onDismiss: () => void }) {
  const [exitX, setExitX] = useState(0);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, { offset, velocity }) => {
        const swipe = Math.abs(offset.x) * velocity.x;
        if (swipe > 10000) {
          setExitX(offset.x > 0 ? 1000 : -1000);
          setTimeout(onDismiss, 300);
        }
      }}
      animate={{ x: exitX }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="rounded-xl bg-white p-6 shadow-lg"
    >
      <p>Swipe left or right to dismiss</p>
    </motion.div>
  );
}

// Carousel with drag
function DragCarousel({ items }: { items: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="relative overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={{ left: -1000, right: 1000 }}
        dragElastic={0.1}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.x > 100) {
            setCurrentIndex(Math.max(0, currentIndex - 1));
          } else if (offset.x < -100) {
            setCurrentIndex(Math.min(items.length - 1, currentIndex + 1));
          }
        }}
        animate={{ x: -currentIndex * 320 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex gap-4"
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            className="h-80 w-80 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600"
          >
            {item}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// Rotate gesture
function RotateGesture() {
  const [rotation, setRotation] = useState(0);

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0}
      onDrag={(e, info) => {
        const angle = Math.atan2(info.offset.y, info.offset.x);
        setRotation(angle * (180 / Math.PI));
      }}
      animate={{ rotate: rotation }}
      className="h-40 w-40 rounded-xl bg-blue-600"
    />
  );
}

// Pull to refresh
function PullToRefresh({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={async (e, { offset, velocity }) => {
        if (offset.y > 100 && velocity.y > 500) {
          setIsRefreshing(true);
          await onRefresh();
          setIsRefreshing(false);
        }
      }}
    >
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center py-4"
        >
          <Spinner />
        </motion.div>
      )}
      <div>Content goes here</div>
    </motion.div>
  );
}

// Pinch to zoom
function PinchZoom({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);

  return (
    <motion.div
      style={{ scale }}
      onWheel={(e) => {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        setScale(Math.min(Math.max(scale + delta, 0.5), 3));
      }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
```

**Gotchas:**
- Drag doesn't work inside scrollable containers without config
- dragConstraints accepts refs for dynamic boundaries
- Gestures can conflict with native scroll (use dragDirectionLock)
- Touch events need passive: false for preventDefault
- Multiple drag handlers can conflict
- Rotation math requires careful coordinate system understanding


### 5. Orchestrate complex animation sequences

Complex sequences combine multiple animations with precise timing. Use orchestration to tell stories, guide users, or create delightful moments.

**Best Practices:**
- Break sequences into logical steps
- Use staggerChildren for list animations
- Leverage delayChildren for cascade effects
- Keep total sequence under 2 seconds
- Allow users to skip long animations
- Test on slow devices

**Common Patterns:**
```typescript
// Sequential animation
const sequenceVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

function SequenceExample() {
  return (
    <motion.div variants={sequenceVariants} initial="hidden" animate="visible">
      <motion.h1 variants={itemVariants}>Title</motion.h1>
      <motion.p variants={itemVariants}>Subtitle</motion.p>
      <motion.div variants={itemVariants}>
        <Button>Action</Button>
      </motion.div>
    </motion.div>
  );
}

// Loading sequence
function LoadingSequence({ onComplete }: { onComplete: () => void }) {
  const steps = ["Loading assets...", "Preparing data...", "Almost ready..."];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => setCurrentStep(currentStep + 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [currentStep]);

  return (
    <div className="flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {steps[currentStep]}
        </motion.p>
      </AnimatePresence>
      <motion.div
        className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-gray-200"
      >
        <motion.div
          className="h-full bg-blue-600"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
    </div>
  );
}

// Card flip sequence
function CardFlipSequence() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      className="perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative h-64 w-80"
      >
        {/* Front */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-blue-600 p-6 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <h2>Front</h2>
        </motion.div>

        {/* Back */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-purple-600 p-6 backface-hidden"
          style={{ backfaceVisibility: "hidden", rotateY: 180 }}
        >
          <h2>Back</h2>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Typewriter effect
function Typewriter({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(displayText + text[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, displayText]);

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-mono"
    >
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        |
      </motion.span>
    </motion.p>
  );
}

// Success animation sequence
function SuccessSequence() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { scale: 0 },
        visible: {
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 260,
            damping: 20,
            staggerChildren: 0.1,
            delayChildren: 0.2,
          },
        },
      }}
      className="flex flex-col items-center"
    >
      <motion.div
        variants={{
          hidden: { scale: 0 },
          visible: { scale: 1 },
        }}
        className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500"
      >
        <motion.svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          variants={{
            hidden: { pathLength: 0 },
            visible: { pathLength: 1 },
          }}
          transition={{ duration: 0.5 }}
        >
          <motion.path
            d="M5 13l4 4L19 7"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.svg>
      </motion.div>
      <motion.h2
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
      >
        Success!
      </motion.h2>
    </motion.div>
  );
}
```

**Gotchas:**
- Sequences can become janky if too complex
- staggerChildren doesn't work with AnimatePresence
- delayChildren is in seconds, not milliseconds
- when: "beforeChildren" prevents flicker
- Nested sequences multiply delays
- useAnimationControls for imperative sequences


### 6. AnimatePresence for mount/unmount

AnimatePresence enables exit animations for components that are being removed from the tree. Essential for modals, toasts, and conditional UI.

**Best Practices:**
- Always provide unique keys for children
- Use mode="wait" to prevent overlap
- Keep exit animations faster than enter (200ms vs 300ms)
- Handle focus management in modals
- Provide escape hatches (ESC key, click outside)
- Test with screen readers

**Common Patterns:**
```typescript
// Modal with AnimatePresence
function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Toast notifications
function ToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);

  return (
    <div className="fixed bottom-4 right-4 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            layout
            className="rounded-lg bg-gray-900 px-4 py-3 text-white shadow-lg"
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Conditional content swap
function ContentSwap({ showA }: { showA: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {showA ? (
        <motion.div
          key="a"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          Content A
        </motion.div>
      ) : (
        <motion.div
          key="b"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          Content B
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// List with add/remove
function AnimatedList({ items }: { items: string[] }) {
  return (
    <ul>
      <AnimatePresence>
        {items.map((item, i) => (
          <motion.li
            key={item}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            layout
          >
            {item}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
```

**Gotchas:**
- Children must have unique keys (not index)
- Exit animations need AnimatePresence as direct parent
- mode="popLayout" for better list animations
- initial={false} prevents mount animations
- onExitComplete callback for cleanup
- layout prop causes reflow on every render


### 7. Layout animations and shared element transitions

Layout animations automatically animate layout changes. Shared elements create seamless transitions between different UI states.

**Best Practices:**
- Use layoutId for shared elements
- Keep layout animations simple (position, size)
- Avoid animating too many layout properties
- Use layout="position" for performance
- Test with dynamic content (text wrapping, images)
- Provide fallback for browsers without support

**Common Patterns:**
```typescript
// Expandable card
function ExpandableCard({ isExpanded, onToggle }: CardProps) {
  return (
    <motion.div
      layout
      onClick={onToggle}
      className="cursor-pointer rounded-xl bg-white p-6 shadow-lg"
      transition={{ layout: { duration: 0.3 } }}
    >
      <motion.h2 layout="position">Card Title</motion.h2>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p>Expanded content appears here</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Shared element navigation
function GalleryToDetail() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {images.map((img) => (
          <motion.img
            key={img.id}
            layoutId={`image-${img.id}`}
            src={img.src}
            onClick={() => setSelectedId(img.id)}
            className="h-40 w-full cursor-pointer rounded-lg object-cover"
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/80"
            onClick={() => setSelectedId(null)}
          >
            <motion.img
              layoutId={`image-${selectedId}`}
              src={images.find((i) => i.id === selectedId)?.src}
              className="max-h-[80vh] max-w-[80vw] rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Reorderable list
function ReorderableList({ items, onReorder }: ListProps) {
  return (
    <Reorder.Group values={items} onReorder={onReorder}>
      {items.map((item) => (
        <Reorder.Item key={item} value={item} layout>
          <div className="mb-2 rounded-lg bg-white p-4 shadow">{item}</div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

// Tab navigation with underline
function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="relative">
      <div className="flex space-x-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className="relative px-4 py-2"
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Gotchas:**
- Layout animations can cause performance issues
- layoutId must be unique across entire tree
- Shared elements need same layoutId in both states
- layout prop causes reflow on mount
- CSS transforms can conflict with layout animations
- border-radius doesn't animate smoothly


### 8. Spring physics and keyframe animations

Springs create natural, physics-based motion. Keyframes provide precise control over animation timing. Choose based on your needs.

**Best Practices:**
- Use springs for interactive animations (drag, gestures)
- Use keyframes for precise choreography
- Default spring (stiffness: 100, damping: 10) works for most cases
- Higher stiffness = faster, snappier
- Higher damping = less bounce
- Test on 60Hz and 120Hz displays

**Common Patterns:**
```typescript
// Spring configurations
const springConfigs = {
  // Gentle spring
  gentle: { type: "spring", stiffness: 100, damping: 15 },

  // Bouncy
  bouncy: { type: "spring", stiffness: 400, damping: 10 },

  // Snappy
  snappy: { type: "spring", stiffness: 400, damping: 25 },

  // Slow
  slow: { type: "spring", stiffness: 50, damping: 20 },
};

// Keyframe animation
function PulseAnimation() {
  return (
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="h-20 w-20 rounded-full bg-blue-600"
    />
  );
}

// Complex keyframe sequence
function ComplexKeyframes() {
  return (
    <motion.div
      animate={{
        x: [0, 100, 100, 0, 0],
        y: [0, 0, 100, 100, 0],
        rotate: [0, 0, 90, 90, 0],
        scale: [1, 1.2, 1.2, 1.2, 1],
      }}
      transition={{
        duration: 5,
        times: [0, 0.25, 0.5, 0.75, 1],
        ease: "easeInOut",
        repeat: Infinity,
      }}
      className="h-20 w-20 bg-purple-600"
    />
  );
}

// Spring comparison
function SpringComparison() {
  return (
    <div className="space-y-8">
      {Object.entries(springConfigs).map(([name, config]) => (
        <div key={name}>
          <p>{name}</p>
          <motion.div
            animate={{ x: 200 }}
            transition={config}
            className="h-10 w-10 rounded-full bg-blue-600"
          />
        </div>
      ))}
    </div>
  );
}

// Bounce effect
function BounceButton() {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 10,
      }}
      className="rounded-lg bg-blue-600 px-6 py-3 text-white"
    >
      Bouncy Button
    </motion.button>
  );
}

// Custom easing curves
const customEasing = [0.43, 0.13, 0.23, 0.96]; // Cubic bezier

function CustomEasingAnimation() {
  return (
    <motion.div
      animate={{ x: 200 }}
      transition={{
        duration: 1,
        ease: customEasing,
      }}
      className="h-20 w-20 rounded-full bg-green-600"
    />
  );
}
```

**Gotchas:**
- Springs ignore duration prop
- Keyframe arrays must match property arrays
- times array must start with 0 and end with 1
- Spring damping < 1 = infinite bounce
- Very high stiffness can cause jank
- Custom easings are [x1, y1, x2, y2] format


## 💡 Real-World Examples

### Example 1: Animated Dashboard Cards

```typescript
"use client";

import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

export function DashboardGrid({ cards }: { cards: any[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.id}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
          className="rounded-xl bg-white p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold">{card.title}</h3>
          <p className="mt-2 text-gray-600">{card.description}</p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${card.progress}%` }}
            transition={{ delay: i * 0.1 + 0.5, duration: 1 }}
            className="mt-4 h-2 rounded-full bg-blue-600"
          />
        </motion.div>
      ))}
    </div>
  );
}
```

### Example 2: Multi-Step Form with Transitions

```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = ["Personal Info", "Contact Details", "Confirmation"];

export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <motion.div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  i <= currentStep ? "bg-blue-600" : "bg-gray-300"
                }`}
                animate={{ scale: i === currentStep ? 1.2 : 1 }}
              >
                {i + 1}
              </motion.div>
              <p className="mt-2 text-sm">{step}</p>
            </div>
          ))}
        </div>
        <motion.div
          className="mt-4 h-1 bg-blue-600"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Form content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl bg-white p-8 shadow-lg"
        >
          {/* Step content goes here */}
          <h2 className="text-2xl font-bold">{steps[currentStep]}</h2>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="rounded-lg bg-gray-200 px-6 py-2 disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white"
            >
              {currentStep === steps.length - 1 ? "Submit" : "Next"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

## 🔗 Related Skills

- **react-spring** - Alternative animation library
- **tailwind-ui-designer** - Style animated components
- **shadcn-ui-master** - Combine with UI components
- **threejs-webgl** - 3D animations with Three.js

## 📖 Further Reading

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Animation Principles](https://www.framer.com/motion/animation/)
- [Gesture Documentation](https://www.framer.com/motion/gestures/)
- [Layout Animations Guide](https://www.framer.com/motion/layout-animations/)
- [Spring Physics Explained](https://www.framer.com/motion/transition/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Fully expanded with production-ready patterns and examples*
