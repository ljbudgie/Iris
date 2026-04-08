import { motion } from "framer-motion";
import { ModelSelectorLogo } from "@/components/ai-elements/model-selector";
import { type ChatModel, chatModels } from "@/lib/ai/models";
import { SparklesIcon } from "./icons";

type GreetingProps = {
  hasChosenModel: boolean;
  onChooseModel: (id: string) => void;
  onDismiss: () => void;
};

export const Greeting = ({
  hasChosenModel,
  onChooseModel,
  onDismiss,
}: GreetingProps) => {
  if (hasChosenModel) {
    return (
      <div className="flex flex-col items-center px-4" key="overview">
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20"
          initial={{ opacity: 0, scale: 0.8 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <SparklesIcon size={20} />
        </motion.div>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="text-center font-semibold text-2xl tracking-tight text-foreground md:text-3xl"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          What can I help with?
        </motion.div>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 max-w-sm text-center text-muted-foreground/70 text-sm leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Ask a question, get guided help with a dispute, or explore ideas.
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="flex w-full max-w-xl flex-col items-center px-4 pb-8"
      key="onboarding"
    >
      {/* Iris Icon */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-[var(--shadow-glow)]"
        initial={{ opacity: 0, scale: 0.8 }}
        transition={{
          delay: 0.2,
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <SparklesIcon size={22} />
      </motion.div>

      {/* Title */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-semibold text-2xl tracking-tight text-foreground md:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Hi, I&apos;m Iris ✨
      </motion.div>

      {/* Subtitle */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 text-center text-base font-medium text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Your thoughtful AI companion &amp; intelligent gateway
      </motion.div>

      {/* Burgess Principle tagline */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 max-w-md text-center text-muted-foreground/60 text-xs leading-relaxed tracking-wide"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Guided by human-centered values: clarity, review, and control.
      </motion.div>

      {/* Model description */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 max-w-md text-center text-muted-foreground/70 text-sm leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        I connect you to the most powerful AI models and intelligently match
        each request to the best one. Choose a model to begin:
      </motion.div>

      {/* Smart Companion Mode (recommended) */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 w-full"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.75, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          className="group relative flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.06] px-4 py-3 text-left transition-all duration-200 hover:border-primary/50 hover:bg-primary/[0.1] hover:shadow-[var(--shadow-glow)] active:scale-[0.98]"
          onClick={onDismiss}
          type="button"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
            <SparklesIcon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Smart Companion Mode
              </span>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Recommended
              </span>
            </div>
            <span className="text-xs text-muted-foreground/70">
              Intelligent routing + context awareness — Iris picks the best
              model for each task
            </span>
          </div>
          <div className="shrink-0 text-primary/40 transition-colors group-hover:text-primary/70">
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M9 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      </motion.div>

      {/* Divider */}
      <motion.div
        animate={{ opacity: 1 }}
        className="mt-5 flex w-full items-center gap-3"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.85, duration: 0.4 }}
      >
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">
          or choose a model
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </motion.div>

      {/* Model cards grid */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 grid w-full grid-cols-1 gap-2 sm:grid-cols-2"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.95, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {chatModels.map((model: ChatModel, index: number) => (
          <motion.button
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3.5 py-3 text-left backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-card/90 hover:shadow-[var(--shadow-card)] active:scale-[0.97]"
            initial={{ opacity: 0, y: 8 }}
            key={model.id}
            onClick={() => onChooseModel(model.id)}
            transition={{
              delay: 1.0 + 0.06 * index,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            type="button"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border/40 transition-all duration-200 group-hover:ring-primary/20">
              <ModelSelectorLogo provider={model.provider} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-foreground">
                  {model.name}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="rounded-md bg-muted/80 px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                  {model.strengthTag}
                </span>
                <span className="truncate text-[10px] capitalize text-muted-foreground/50">
                  {model.provider}
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};
