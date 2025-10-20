"use client";

import { memo } from "react";
import { motion, type Variants } from "framer-motion";

type BubbleBackgroundProps = React.ComponentProps<"div">;

const backgroundBlobVariants: Variants = {
  animate: {
    x: [0, 30, -20, 0],
    y: [0, -50, 20, 0],
    scale: [1, 1.1, 0.9, 1],
    transition: {
      duration: 7,
      repeat: Infinity,
      repeatType: "reverse" as const,
    },
  },
};

const BackgroundBlobs = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    <motion.div
      className="absolute top-1/4 -left-4 w-48 sm:w-72 h-48 sm:h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30"
      variants={backgroundBlobVariants}
      animate="animate"
    />
    <motion.div
      className="absolute top-1/3 -right-4 w-48 sm:w-72 h-48 sm:h-72 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30"
      variants={backgroundBlobVariants}
      animate="animate"
      transition={{ delay: 2 }}
    />
    <motion.div
      className="absolute -bottom-8 left-20 w-48 sm:w-72 h-48 sm:h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30"
      variants={backgroundBlobVariants}
      animate="animate"
      transition={{ delay: 4 }}
    />
  </div>
));

BackgroundBlobs.displayName = "BackgroundBlobs";

function BubbleBackground(_props: BubbleBackgroundProps) {
  return (
    <div>
      <BackgroundBlobs />
    </div>
  );
}

export { BubbleBackground, type BubbleBackgroundProps };
