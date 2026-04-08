"use client";

import {
  FileTextIcon,
  MoonIcon,
  PenSquareIcon,
  SearchIcon,
  ShieldCheckIcon,
  SunIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog
      description="Search commands and navigate Iris"
      onOpenChange={setOpen}
      open={open}
      title="Command Palette"
    >
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Chat">
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <PenSquareIcon className="size-4" />
            <span>New chat</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                const textarea = document.querySelector("textarea");
                textarea?.focus();
              })
            }
          >
            <SearchIcon className="size-4" />
            <span>Focus input</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/templates"))}
          >
            <FileTextIcon className="size-4" />
            <span>Letter templates</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/federation"))}
          >
            <ShieldCheckIcon className="size-4" />
            <span>Federation providers</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Appearance">
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              )
            }
          >
            {resolvedTheme === "dark" ? (
              <SunIcon className="size-4" />
            ) : (
              <MoonIcon className="size-4" />
            )}
            <span>
              Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
