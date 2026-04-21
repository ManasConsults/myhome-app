# /fe-animation — Generate a Framer Motion animation pattern

Generate a reusable Framer Motion animation utility or wrapper component. The argument format is:
`/fe-animation [--list] [--page] [--modal] [--drag] [--gesture]`

One flag is required. If multiple are passed, generate all of them.

---

## `--list` — Stagger list animation

Create `components/motion/AnimatedList.tsx`:
```tsx
"use client"
import { motion } from "framer-motion"

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

export function AnimatedList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.ul variants={containerVariants} initial="hidden" animate="visible" className={className}>
      {children}
    </motion.ul>
  )
}

export function AnimatedListItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.li variants={itemVariants} className={className}>
      {children}
    </motion.li>
  )
}
```

---

## `--page` — Page enter/exit transition

Create `components/motion/PageTransition.tsx`:
```tsx
"use client"
import { motion, AnimatePresence } from "framer-motion"

const variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div variants={variants} initial="hidden" animate="visible" exit="exit" className={className}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

---

## `--modal` — Modal/dialog scale + fade

Create `components/motion/AnimatedModal.tsx`:
```tsx
"use client"
import { motion, AnimatePresence } from "framer-motion"

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.95, y: 8, transition: { duration: 0.2 } },
}

interface AnimatedModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function AnimatedModal({ open, onClose, children }: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={overlayVariants}
          initial="hidden" animate="visible" exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden" animate="visible" exit="exit"
            className="relative w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

## `--drag` — Draggable card / reorderable item

Create `components/motion/DraggableItem.tsx`:
```tsx
"use client"
import { motion, useMotionValue, useTransform } from "framer-motion"

interface DraggableItemProps {
  children: React.ReactNode
  onDragEnd?: () => void
  className?: string
}

export function DraggableItem({ children, onDragEnd, className }: DraggableItemProps) {
  const x = useMotionValue(0)
  const background = useTransform(x, [-100, 0, 100], ["#fee2e2", "#ffffff", "#dcfce7"])

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -120, right: 120 }}
      dragElastic={0.2}
      onDragEnd={onDragEnd}
      style={{ x, background }}
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

---

## `--gesture` — Tap + swipe gesture wrapper (mobile)

Create `components/motion/GestureWrapper.tsx`:
```tsx
"use client"
import { motion } from "framer-motion"

interface GestureWrapperProps {
  children: React.ReactNode
  onTap?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}

export function GestureWrapper({ children, onTap, onSwipeLeft, onSwipeRight, className }: GestureWrapperProps) {
  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -60) onSwipeLeft?.()
    else if (info.offset.x > 60) onSwipeRight?.()
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      onTap={onTap}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

---

## After generating

- Update barrel export at `components/motion/index.ts`
- List all created file paths
