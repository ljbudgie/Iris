import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { VercelIcon } from "@/components/chat/icons";
import { Preview } from "@/components/chat/preview";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-screen" style={{ background: "#08080c" }}>
      <div
        className="flex w-full flex-col p-8 xl:w-[600px] xl:shrink-0 xl:rounded-r-2xl xl:border-r md:p-16"
        style={{ background: "#0f0f14", borderColor: "#27272a" }}
      >
        <Link
          className="flex w-fit items-center gap-1.5 text-[13px] text-[#52525b] transition-colors hover:text-[#e4e4e7]"
          href="/"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10">
          <div className="flex flex-col gap-2">
            <div className="mb-2">
              <span
                className="text-sm font-semibold tracking-[0.2em] uppercase text-[#e4e4e7]"
                style={{
                  fontFamily:
                    "var(--font-geist-mono), 'JetBrains Mono', monospace",
                }}
              >
                IRIS
              </span>
            </div>
            {children}
          </div>
        </div>
      </div>

      <div className="hidden flex-1 flex-col overflow-hidden pl-12 xl:flex">
        <div className="flex items-center gap-1.5 pt-8 text-[13px] text-[#52525b]">
          Powered by
          <VercelIcon size={14} />
          <span className="font-medium text-[#a1a1aa]">AI Gateway</span>
        </div>
        <div className="flex-1 pt-4">
          <Preview />
        </div>
      </div>
    </div>
  );
}
