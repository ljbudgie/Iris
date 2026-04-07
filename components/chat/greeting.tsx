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
          Ask a question, write code, or explore ideas.
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4" key="onboarding">
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
        Hi, I&apos;m Iris ✨
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 max-w-md text-center text-muted-foreground/70 text-sm leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        I connect you to the most powerful AI models and intelligently match
        each request to the best one for the job.
        <br />
        Which model would you like to start with?
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 flex max-w-lg flex-wrap items-center justify-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {chatModels.map((model: ChatModel) => (
          <button
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:scale-[0.97]"
            key={model.id}
            onClick={() => onChooseModel(model.id)}
            type="button"
          >
            <ModelSelectorLogo provider={model.provider} />
            <span>{model.name}</span>
          </button>
        ))}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          className="rounded-lg px-4 py-2 text-sm text-muted-foreground/70 transition-colors hover:bg-muted/50 hover:text-foreground"
          onClick={onDismiss}
          type="button"
        >
          Dismiss — use smart default
        </button>
      </motion.div>
    </div>
  );
};
