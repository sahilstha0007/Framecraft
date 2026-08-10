import React, {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

import { cn } from "@/lib/utils";

// Custom wrap function
const wrap = (min: number, max: number, value: number): number => {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
};

// `MotionValue` and `SpringOptions` are not re-exported from "framer-motion",
// so derive the MotionValue type from the hook (TS instantiation expression)
// and keep a small structural type for the spring configs.
type MotionValueOf<T> = ReturnType<typeof useMotionValue<T>>;

interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
  bounce?: number;
  restDelta?: number;
  restSpeed?: number;
  duration?: number;
}

type PreserveAspectRatioAlign =
  | "none"
  | "xMinYMin"
  | "xMidYMin"
  | "xMaxYMin"
  | "xMinYMid"
  | "xMidYMid"
  | "xMaxYMid"
  | "xMinYMax"
  | "xMidYMax"
  | "xMaxYMax";

type PreserveAspectRatioMeetOrSlice = "meet" | "slice";

type PreserveAspectRatio =
  | PreserveAspectRatioAlign
  | `${Exclude<PreserveAspectRatioAlign, "none">} ${PreserveAspectRatioMeetOrSlice}`;

interface MarqueeAlongSvgPathProps {
  children: React.ReactNode;
  className?: string;

  // Path properties
  path: string;
  preserveAspectRatio?: PreserveAspectRatio;
  showPath?: boolean;

  // SVG properties
  width?: string | number;
  height?: string | number;
  viewBox?: string;

  // Marquee properties
  baseVelocity?: number;
  direction?: "normal" | "reverse";
  easing?: (value: number) => number;
  slowdownOnHover?: boolean;
  slowDownFactor?: number;
  slowDownSpringConfig?: SpringConfig;

  // Scroll properties
  useScrollVelocity?: boolean;
  scrollAwareDirection?: boolean;
  scrollSpringConfig?: SpringConfig;
  scrollContainer?: RefObject<HTMLElement | null> | null;

  // Item repetition
  repeat?: number;

  // Drag properties
  draggable?: boolean;
  dragSensitivity?: number;
  dragVelocityDecay?: number;
  dragAwareDirection?: boolean;
  grabCursor?: boolean;

  // Z-index properties
  enableRollingZIndex?: boolean;
  zIndexBase?: number;
  zIndexRange?: number;

  // Responsive properties
  responsive?: boolean;
}

interface MarqueeItemProps {
  baseOffset: MotionValueOf<number>;
  itemIndex: number;
  itemCount: number;
  easing?: (value: number) => number;
  path: string;
  enableRollingZIndex: boolean;
  zIndexBase: number;
  zIndexRange: number;
  draggable: boolean;
  grabCursor: boolean;
  ariaHidden: boolean;
  child: React.ReactNode;
  calculateZIndex: (offsetDistance: number) => number | undefined;
  onHoverChange: (hovered: boolean) => void;
}

/**
 * One travelling marquee item. Extracted into its own component so every
 * MotionValue / effect below is a top-level hook call (the source component
 * called them inside `.map()`, which violates React's rules of hooks).
 */
function MarqueeItem({
  baseOffset,
  itemIndex,
  itemCount,
  easing,
  path,
  enableRollingZIndex,
  zIndexBase,
  zIndexRange,
  draggable,
  grabCursor,
  ariaHidden,
  child,
  calculateZIndex,
  onHoverChange,
}: MarqueeItemProps) {
  // Unique offset transform for this item along the path
  const itemOffset = useTransform(baseOffset, (v) => {
    const position = (itemIndex * 100) / itemCount;
    const wrappedValue = wrap(0, 100, v + position);
    return `${easing ? easing(wrappedValue / 100) * 100 : wrappedValue}%`;
  });

  // Mirror the percentage into a number so the rolling z-index stays smooth
  const currentOffsetDistance = useMotionValue(0);

  useEffect(() => {
    const unsubscribe = itemOffset.on("change", (value: string) => {
      const match = value.match(/^([\d.]+)%$/);
      if (match && match[1]) {
        currentOffsetDistance.set(parseFloat(match[1]));
      }
    });
    return unsubscribe;
  }, [itemOffset, currentOffsetDistance]);

  // Progress-based z-index so items travelling "in front" of the curve
  // (higher offset %) render above the ones behind.
  const zIndex = useTransform(currentOffsetDistance, (value) =>
    calculateZIndex(value)
  );

  return (
    <motion.div
      className={cn(
        "absolute top-0 left-0",
        draggable && grabCursor && "cursor-grab"
      )}
      style={{
        offsetPath: `path('${path}')`,
        offsetDistance: itemOffset,
        zIndex: enableRollingZIndex ? zIndex : undefined,
        willChange: "offset-distance",
        backfaceVisibility: "hidden",
      }}
      aria-hidden={ariaHidden}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {child}
    </motion.div>
  );
}

const MarqueeAlongSvgPath = ({
  children,
  className,

  // Path defaults
  path,
  preserveAspectRatio = "xMidYMid meet",
  showPath = false,

  // SVG defaults
  width = "100%",
  height = "100%",
  viewBox = "0 0 100 100",

  // Marquee defaults
  baseVelocity = 5,
  direction = "normal",
  easing,
  slowdownOnHover = false,
  slowDownFactor = 0.3,
  slowDownSpringConfig = { damping: 50, stiffness: 400 },

  // Scroll defaults
  useScrollVelocity = false,
  scrollAwareDirection = false,
  scrollSpringConfig = { damping: 50, stiffness: 400 },
  scrollContainer,

  // Items repetition
  repeat = 3,

  // Drag defaults
  draggable = false,
  dragSensitivity = 0.2,
  dragVelocityDecay = 0.96,
  dragAwareDirection = false,
  grabCursor = false,

  // Z-index defaults
  enableRollingZIndex = true,
  zIndexBase = 1,
  zIndexRange = 10,

  // Responsive defaults
  responsive = false,
}: MarqueeAlongSvgPathProps) => {
  const container = useRef<HTMLDivElement>(null);
  const marqueeContainerRef = useRef<HTMLDivElement>(null);
  const baseOffset = useMotionValue(0);

  // Responsive scaling using direct DOM manipulation (no re-renders)
  useEffect(() => {
    if (!responsive) return;

    const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number);
    const originalWidth = vbWidth || 100;
    const originalHeight = vbHeight || 100;

    const updateScale = () => {
      const wrapper = container.current;
      const marqueeContainer = marqueeContainerRef.current;
      if (!wrapper || !marqueeContainer) return;

      const wrapperWidth = wrapper.clientWidth;
      const wrapperHeight = wrapper.clientHeight;

      const scaleX = wrapperWidth / originalWidth;
      const scaleY = wrapperHeight / originalHeight;
      const scale = Math.min(scaleX, scaleY);

      const scaledWidth = originalWidth * scale;
      const scaledHeight = originalHeight * scale;

      const offsetX = (wrapperWidth - scaledWidth) / 2;
      const offsetY = (wrapperHeight - scaledHeight) / 2;

      marqueeContainer.style.width = `${originalWidth}px`;
      marqueeContainer.style.height = `${originalHeight}px`;

      marqueeContainer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
      marqueeContainer.style.transformOrigin = "top left";
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [responsive, viewBox]);

  // Create an array of items outside of the render function
  const items = useMemo(() => {
    const childrenArray = React.Children.toArray(children);

    return childrenArray.flatMap((child, childIndex) =>
      Array.from({ length: repeat }, (_, repeatIndex) => {
        const itemIndex = repeatIndex * childrenArray.length + childIndex;
        const key = `${childIndex}-${repeatIndex}`;
        return {
          child,
          childIndex,
          repeatIndex,
          itemIndex,
          key,
        };
      })
    );
  }, [children, repeat]);

  // Function to calculate z-index based on offset distance
  const calculateZIndex = useCallback(
    (offsetDistance: number) => {
      if (!enableRollingZIndex) {
        return undefined;
      }
      const normalizedDistance = offsetDistance / 100;
      return Math.floor(zIndexBase + normalizedDistance * zIndexRange);
    },
    [enableRollingZIndex, zIndexBase, zIndexRange]
  );

  // Scroll tracking
  const { scrollY } = useScroll({
    container: (scrollContainer as RefObject<HTMLElement | null>) || container,
  });

  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, scrollSpringConfig);

  // Hover and drag state tracking
  const isHovered = useRef(false);
  const isDragging = useRef(false);
  const dragVelocity = useRef(0);

  // Direction factor for changing direction based on scroll or drag
  const directionFactor = useRef(direction === "normal" ? 1 : -1);

  // Motion values for animation
  const hoverFactorValue = useMotionValue(1);
  const defaultVelocity = useMotionValue(1);
  const smoothHoverFactor = useSpring(hoverFactorValue, slowDownSpringConfig);

  // Transform scroll velocity into a factor that affects marquee speed
  const velocityFactor = useTransform(
    useScrollVelocity ? smoothVelocity : defaultVelocity,
    [0, 1000],
    [0, 5],
    { clamp: false }
  );

  // Animation frame handler
  useAnimationFrame((_, delta) => {
    if (isDragging.current && draggable) {
      baseOffset.set(baseOffset.get() + dragVelocity.current);

      // Add decay to dragVelocity
      dragVelocity.current *= 0.9;

      // Stop completely if velocity is very small
      if (Math.abs(dragVelocity.current) < 0.01) {
        dragVelocity.current = 0;
      }

      return;
    }

    // Update hover factor
    if (isHovered.current) {
      hoverFactorValue.set(slowdownOnHover ? slowDownFactor : 1);
    } else {
      hoverFactorValue.set(1);
    }

    // Calculate regular movement
    let moveBy =
      directionFactor.current *
      baseVelocity *
      (delta / 1000) *
      smoothHoverFactor.get();

    // Adjust movement based on scroll velocity if scrollAwareDirection is enabled
    if (scrollAwareDirection && !isDragging.current) {
      if (velocityFactor.get() < 0) {
        directionFactor.current = -1;
      } else if (velocityFactor.get() > 0) {
        directionFactor.current = 1;
      }
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    if (draggable) {
      moveBy += dragVelocity.current;

      // Update direction based on drag direction if dragAwareDirection is true
      if (dragAwareDirection && Math.abs(dragVelocity.current) > 0.1) {
        directionFactor.current = Math.sign(dragVelocity.current);
      }

      // Gradually decay drag velocity back to zero
      if (!isDragging.current && Math.abs(dragVelocity.current) > 0.01) {
        dragVelocity.current *= dragVelocityDecay;
      } else if (!isDragging.current) {
        dragVelocity.current = 0;
      }
    }

    baseOffset.set(baseOffset.get() + moveBy);
  });

  // Pointer event handlers for dragging
  const lastPointerPosition = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!draggable) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (grabCursor) {
      (e.currentTarget as HTMLElement).style.cursor = "grabbing";
    }

    isDragging.current = true;
    lastPointerPosition.current = { x: e.clientX, y: e.clientY };

    // Pause automatic animation by setting velocity to 0
    dragVelocity.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggable || !isDragging.current) return;

    const currentPosition = { x: e.clientX, y: e.clientY };

    // Calculate movement delta - simplified for path movement
    const deltaX = currentPosition.x - lastPointerPosition.current.x;
    const deltaY = currentPosition.y - lastPointerPosition.current.y;

    // For path following, we use a simple magnitude of movement
    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const projectedDelta = deltaX > 0 ? delta : -delta;

    // Update drag velocity based on the projected movement
    dragVelocity.current = projectedDelta * dragSensitivity;

    // Update last position
    lastPointerPosition.current = currentPosition;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggable) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    isDragging.current = false;

    if (grabCursor) {
      (e.currentTarget as HTMLElement).style.cursor = "grab";
    }
  };

  return (
    <div
      ref={container}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn("relative", className)}
    >
      <div
        ref={marqueeContainerRef}
        className="relative"
        style={{ contain: "layout style" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={width}
          height={height}
          viewBox={viewBox}
          preserveAspectRatio={preserveAspectRatio}
          className="w-full h-full"
        >
          <path
            d={path}
            stroke={showPath ? "currentColor" : "none"}
            fill="none"
          />
        </svg>

        {items.map(({ child, repeatIndex, itemIndex, key }) => (
          <MarqueeItem
            key={key}
            baseOffset={baseOffset}
            itemIndex={itemIndex}
            itemCount={items.length}
            easing={easing}
            path={path}
            enableRollingZIndex={enableRollingZIndex}
            zIndexBase={zIndexBase}
            zIndexRange={zIndexRange}
            draggable={draggable}
            grabCursor={grabCursor}
            ariaHidden={repeatIndex > 0}
            child={child}
            calculateZIndex={calculateZIndex}
            onHoverChange={(hovered) => {
              isHovered.current = hovered;
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MarqueeAlongSvgPath;
