// SlideSheet — Glass bottom sheet with framer-motion
// Opens from bottom, 65% viewport desktop, 85vh mobile
// Swipe-to-dismiss on mobile via drag="y"

import { motion, AnimatePresence } from "framer-motion";
import type { PanInfo, Variants } from "framer-motion";

interface SlideSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const sheetVariants: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { type: "spring", damping: 30, stiffness: 300 },
  },
  exit: {
    y: "100%",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as any },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export function SlideSheet({ open, onClose, title, children }: SlideSheetProps) {
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close if dragged down fast enough or far enough
    if (info.velocity.y > 300 || info.offset.y > 150) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            data-testid="slidesheet-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 40,
            }}
          />

          {/* Sheet */}
          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: "65vh",
              background: "var(--glass-sheet-bg)",
              backdropFilter: "var(--glass-sheet-blur)",
              WebkitBackdropFilter: "var(--glass-sheet-blur)",
              borderTop: "1px solid var(--glass-sheet-border)",
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            className="max-md:!h-[85vh]"
          >
            {/* Drag handle */}
            <div
              data-testid="slidesheet-handle"
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "10px 0 6px",
                cursor: "grab",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.15)",
                }}
              />
            </div>

            {/* Title */}
            {title && (
              <div style={{ padding: "0 20px 12px" }}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--ink)",
                    margin: 0,
                  }}
                >
                  {title}
                </h3>
              </div>
            )}

            {/* Scrollable content */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 20px 20px",
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
