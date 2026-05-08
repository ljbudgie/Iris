"use client";

/**
 * First-run onboarding wizard.
 *
 * Three steps, matching the master vision's "3-card guided flow":
 *   1. Choose mode — Local / Cloud / Hybrid.
 *   2. Pick an AI provider (preselects Ollama if reachable).
 *   3. 15-second Burgess Principle overlay.
 *
 * Choices persist in localStorage via lib/setup/preferences.
 */

import { CheckIcon, CloudIcon, HomeIcon, ShuffleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  type IrisProvider,
  type IrisRunMode,
  readPreferences,
  writePreferences,
} from "@/lib/setup/preferences";

type Step = 0 | 1 | 2;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [mode, setMode] = useState<IrisRunMode>("local");
  const [provider, setProvider] = useState<IrisProvider>("gateway");
  const [ollamaReachable, setOllamaReachable] = useState(false);
  const [seconds, setSeconds] = useState(15);

  // Skip if already onboarded
  useEffect(() => {
    const prefs = readPreferences();
    if (prefs.onboarded) {
      router.replace("/");
    }
  }, [router]);

  // Detect a local Ollama instance to preselect the local provider.
  // Probed via a server route to avoid the browser CORS limitation.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/onboarding/probe-ollama`
        );
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as { reachable: boolean };
        if (!cancelled && data.reachable) {
          setOllamaReachable(true);
          setProvider("ollama");
        }
      } catch {
        /* not reachable — leave gateway selected */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = useCallback(() => {
    writePreferences({ onboarded: true, mode, provider });
    router.replace("/");
  }, [mode, provider, router]);

  // Burgess overlay countdown
  useEffect(() => {
    if (step !== 2) {
      return;
    }
    if (seconds <= 0) {
      finish();
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, seconds, finish]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 px-6 py-12">
      <header className="text-center">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#5eead4]">
          Iris · welcome
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          Three quick choices, then we begin.
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Iris is sovereign by default. You decide where your data lives.
        </p>
      </header>

      {/* Step indicator */}
      <ol
        aria-label="Onboarding progress"
        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
      >
        {(["Mode", "Provider", "Principle"] as const).map((label, i) => (
          <li
            className={
              i === step
                ? "rounded-full bg-[rgba(15,118,110,0.18)] px-3 py-1 text-[#5eead4]"
                : "px-3 py-1"
            }
            key={label}
          >
            {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section
          aria-label="Choose run mode"
          className="grid w-full gap-3 sm:grid-cols-3"
        >
          {[
            {
              id: "local" as const,
              icon: <HomeIcon className="size-5" />,
              title: "Local",
              body: "Runs on your machine. Nothing leaves your device.",
            },
            {
              id: "cloud" as const,
              icon: <CloudIcon className="size-5" />,
              title: "Cloud",
              body: "Hosted on Vercel with the AI Gateway.",
            },
            {
              id: "hybrid" as const,
              icon: <ShuffleIcon className="size-5" />,
              title: "Hybrid",
              body: "Local by default, cloud only when you opt in.",
            },
          ].map((option) => (
            <button
              aria-pressed={mode === option.id}
              className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors ${
                mode === option.id
                  ? "border-[rgba(15,118,110,0.5)] bg-[rgba(15,118,110,0.12)]"
                  : "border-border bg-card/40 hover:border-[rgba(15,118,110,0.3)]"
              }`}
              key={option.id}
              onClick={() => setMode(option.id)}
              type="button"
            >
              <span className="text-[#5eead4]">{option.icon}</span>
              <span className="font-medium">{option.title}</span>
              <span className="text-[12px] text-muted-foreground">
                {option.body}
              </span>
            </button>
          ))}
        </section>
      )}

      {step === 1 && (
        <section
          aria-label="Choose provider"
          className="grid w-full gap-3 sm:grid-cols-2"
        >
          {[
            {
              id: "ollama" as const,
              title: "Ollama (local)",
              body: ollamaReachable
                ? "Detected on http://localhost:11434 — recommended."
                : "Install Ollama from https://ollama.ai to run offline.",
            },
            {
              id: "gateway" as const,
              title: "Vercel AI Gateway",
              body: "Routes to multiple cloud models. Auto-provisioned on Vercel.",
            },
          ].map((option) => (
            <button
              aria-pressed={provider === option.id}
              className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors ${
                provider === option.id
                  ? "border-[rgba(15,118,110,0.5)] bg-[rgba(15,118,110,0.12)]"
                  : "border-border bg-card/40 hover:border-[rgba(15,118,110,0.3)]"
              }`}
              key={option.id}
              onClick={() => setProvider(option.id)}
              type="button"
            >
              <span className="font-medium">{option.title}</span>
              <span className="text-[12px] text-muted-foreground">
                {option.body}
              </span>
              {provider === option.id && (
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#5eead4]">
                  <CheckIcon className="size-3" /> Selected
                </span>
              )}
            </button>
          ))}
        </section>
      )}

      {step === 2 && (
        <section
          aria-label="Burgess Principle"
          className="w-full rounded-2xl border border-[rgba(15,118,110,0.35)] bg-[linear-gradient(135deg,rgba(15,118,110,0.16),rgba(214,188,143,0.08))] p-6 text-center"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#5eead4]">
            The Burgess Principle · UK00004343685
          </div>
          <p className="mt-3 text-base leading-relaxed text-foreground">
            Was a human judicial mind applied to the specific facts of this
            specific case?
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Every output Iris produces must be attributable, reviewable, and
            accountable. If a decision was made about you by automation alone,
            you have the right to ask for human review — and Iris will help you
            ask, calmly and clearly.
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Lewis Burgess
          </p>
          <div className="mt-5 text-[11px] text-muted-foreground">
            Continuing in {seconds}s…
          </div>
        </section>
      )}

      <div className="flex w-full items-center justify-between">
        <button
          className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
          type="button"
        >
          Back
        </button>
        <button
          className="rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-medium text-white"
          onClick={() => {
            if (step === 2) {
              finish();
            } else {
              setStep((s) => (s + 1) as Step);
            }
          }}
          type="button"
        >
          {step === 2 ? "Enter Iris" : "Next"}
        </button>
      </div>
    </div>
  );
}
