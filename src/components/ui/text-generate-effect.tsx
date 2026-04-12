import { useEffect } from "react";
import { motion, stagger, useAnimate } from "motion/react";
import { cn } from "../../lib/utils";

export const TextGenerateEffect = ({ words, className, filter = false, duration = 0.4 }: {
  words: string; className?: string; filter?: boolean; duration?: number;
}) => {
  const [scope, animate] = useAnimate();
  const wordsArray = words.split(" ");
  useEffect(() => {
    animate("span", { opacity: 1, filter: filter ? "blur(0px)" : "none" },
      { duration, delay: stagger(0.05) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={cn("font-bold", className)}>
      <motion.div ref={scope} style={{ display: "inline" }}>
        {wordsArray.map((word, idx) => (
          <motion.span key={word + idx} style={{ opacity: 0, filter: filter ? "blur(8px)" : "none", display: "inline" }}>
            {word}{" "}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};
