"use client";

import {
  ClipboardListIcon,
  EyeIcon,
  FileTextIcon,
  PanelLeftIcon,
  PenSquareIcon,
  ShieldCheckIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/chat/sidebar-history";
import { SidebarUserNav } from "@/components/chat/sidebar-user-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { SparklesIcon } from "./icons";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  // Fetch aggregate governance status from federation providers
  const [governanceLabel, setGovernanceLabel] = useState<
    "SOVEREIGN" | "NULL" | "NO_PROVIDERS"
  >("NO_PROVIDERS");

  const refreshGovernance = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/federation/register`
      );
      if (!res.ok) {
        return;
      }
      const providers: { governanceStatus: string }[] = await res.json();
      if (providers.length === 0) {
        setGovernanceLabel("NO_PROVIDERS");
        return;
      }
      const allSovereign = providers.every(
        (p) => p.governanceStatus === "SOVEREIGN"
      );
      setGovernanceLabel(allSovereign ? "SOVEREIGN" : "NULL");
    } catch {
      // Governance badge is non-critical; log in dev for debugging
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to fetch governance status");
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshGovernance();
    }
  }, [user, refreshGovernance]);

  const handleDeleteAll = () => {
    setShowDeleteAllDialog(false);
    router.replace("/");
    mutate(unstable_serialize(getChatHistoryPaginationKey), [], {
      revalidate: false,
    });

    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
      method: "DELETE",
    });

    toast.success("All chats deleted");
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pb-0 pt-3">
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-row items-center justify-between">
              <div className="group/logo relative flex items-center justify-center">
                <SidebarMenuButton
                  asChild
                  className="size-8 !px-0 items-center justify-center group-data-[collapsible=icon]:group-hover/logo:opacity-0"
                  tooltip="Iris"
                >
                  <Link href="/" onClick={() => setOpenMobile(false)}>
                    <div className="flex size-6 items-center justify-center rounded-md text-[#7c3aed]">
                      <SparklesIcon size={14} />
                    </div>
                  </Link>
                </SidebarMenuButton>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      className="pointer-events-none absolute inset-0 size-8 opacity-0 group-data-[collapsible=icon]:pointer-events-auto group-data-[collapsible=icon]:group-hover/logo:opacity-100"
                      onClick={() => toggleSidebar()}
                    >
                      <PanelLeftIcon className="size-4" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent className="hidden md:block" side="right">
                    Open sidebar
                  </TooltipContent>
                </Tooltip>
              </div>
              <span
                className="text-[13px] font-semibold tracking-[0.2em] uppercase text-[#e4e4e7] group-data-[collapsible=icon]:hidden"
                style={{
                  fontFamily:
                    "var(--font-geist-mono), 'JetBrains Mono', monospace",
                }}
              >
                IRIS
              </span>
              <div className="group-data-[collapsible=icon]:hidden">
                <SidebarTrigger className="text-sidebar-foreground/40 transition-colors duration-150 hover:text-sidebar-foreground" />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="pt-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="h-8 rounded-lg border border-[rgba(124,58,237,0.2)] bg-[rgba(124,58,237,0.05)] text-[13px] text-[#a1a1aa] transition-colors duration-150 hover:bg-[rgba(124,58,237,0.1)] hover:text-[#e4e4e7]"
                    onClick={() => {
                      setOpenMobile(false);
                      router.push("/");
                    }}
                    tooltip="New Chat"
                  >
                    <PenSquareIcon className="size-4" />
                    <span className="font-medium">New chat</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="rounded-lg text-sidebar-foreground/40 transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setShowDeleteAllDialog(true)}
                      tooltip="Delete All Chats"
                    >
                      <TrashIcon className="size-4" />
                      <span className="text-[13px]">Delete all</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="rounded-lg text-sidebar-foreground/60 transition-colors duration-150 hover:text-sidebar-foreground"
                      tooltip="Review Queue"
                    >
                      <Link href="/review" onClick={() => setOpenMobile(false)}>
                        <EyeIcon className="size-4" />
                        <span className="text-[13px]">Review queue</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="rounded-lg text-sidebar-foreground/60 transition-colors duration-150 hover:text-sidebar-foreground"
                      tooltip="Federation Providers"
                    >
                      <Link
                        href="/federation"
                        onClick={() => setOpenMobile(false)}
                      >
                        <ShieldCheckIcon className="size-4" />
                        <span className="text-[13px]">Providers</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="rounded-lg text-sidebar-foreground/60 transition-colors duration-150 hover:text-sidebar-foreground"
                      tooltip="Letter Templates"
                    >
                      <Link
                        href="/templates"
                        onClick={() => setOpenMobile(false)}
                      >
                        <FileTextIcon className="size-4" />
                        <span className="text-[13px]">Templates</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="rounded-lg text-sidebar-foreground/60 transition-colors duration-150 hover:text-sidebar-foreground"
                      tooltip="Audit Log"
                    >
                      <Link href="/audit" onClick={() => setOpenMobile(false)}>
                        <ClipboardListIcon className="size-4" />
                        <span className="text-[13px]">Audit log</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarHistory user={user} />
        </SidebarContent>
        <SidebarFooter
          className="border-t pt-2 pb-3"
          style={{ borderColor: "#27272a" }}
        >
          <div
            aria-live="polite"
            className="flex h-8 items-center gap-2 rounded-lg border px-2 text-[11px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:border-0"
            role="status"
            style={{ background: "var(--surface-1)", borderColor: "#27272a" }}
          >
            <div className="flex size-4 shrink-0 items-center justify-center">
              <div
                className={`size-1.5 rounded-full ${
                  governanceLabel === "SOVEREIGN"
                    ? "bg-sovereign shadow-[0_0_6px_var(--sovereign)]"
                    : governanceLabel === "NULL"
                      ? "bg-null-review shadow-[0_0_6px_var(--null-review)]"
                      : "bg-muted-foreground/30"
                }`}
              />
            </div>
            <span className="font-medium uppercase tracking-wider text-muted-foreground/50 group-data-[collapsible=icon]:hidden">
              {governanceLabel === "SOVEREIGN"
                ? "Sovereign"
                : governanceLabel === "NULL"
                  ? "Null"
                  : "No providers"}
            </span>
          </div>
          {user && <SidebarUserNav user={user} />}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <AlertDialog
        onOpenChange={setShowDeleteAllDialog}
        open={showDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              your chats and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
