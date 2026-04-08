import { motion } from "framer-motion";
import { SparklesIcon } from "./icons";

export const Greeting = () => {
  return (
    <div className="flex flex-col items-center px-4" key="overview">
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-[var(--shadow-glow)]"
        initial={{ opacity: 0, scale: 0.8 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <SparklesIcon size={22} />
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-semibold text-2xl tracking-tight text-foreground md:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Hi, I&apos;m Iris ✨
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 max-w-sm text-center text-muted-foreground/70 text-sm leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        I&apos;m here with you. Take your time — there&apos;s no rush. Whether
        you need help with a dispute, want to explore your rights, or just need
        someone who&apos;ll actually listen, I&apos;m right here.
      </motion.div>
    </div>
  );
};
