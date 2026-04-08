import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { SparklesIcon, VercelIcon } from "@/components/chat/icons";
import { Preview } from "@/components/chat/preview";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex h-dvh w-screen"
      style={{ background: "var(--surface-0)" }}
    >
      <div
        className="flex w-full flex-col p-8 xl:w-[600px] xl:shrink-0 xl:rounded-r-2xl xl:border-r xl:border-border/30 md:p-16"
        style={{ background: "var(--surface-1)" }}
      >
        <Link
          className="flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground/60 transition-colors hover:text-foreground"
          href="/"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10">
          <div className="flex flex-col gap-2">
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
              <SparklesIcon size={14} />
            </div>
            {children}
          </div>
        </div>
      </div>

      <div className="hidden flex-1 flex-col overflow-hidden pl-12 xl:flex">
        <div className="flex items-center gap-1.5 pt-8 text-[13px] text-muted-foreground/40">
          Powered by
          <VercelIcon size={14} />
          <span className="font-medium text-muted-foreground/60">
            AI Gateway
          </span>
        </div>
        <div className="flex-1 pt-4">
          <Preview />
        </div>
      </div>
    </div>
  );
}
