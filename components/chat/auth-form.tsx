import Form from "next/form";

import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function AuthForm({
  action,
  children,
  defaultEmail = "",
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
}) {
  return (
    <Form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="font-normal text-[#a1a1aa]" htmlFor="email">
          Email
        </Label>
        <Input
          autoComplete="email"
          autoFocus
          className="h-10 rounded-xl border text-sm transition-all focus:border-[rgba(124,58,237,0.5)] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]"
          defaultValue={defaultEmail}
          id="email"
          name="email"
          placeholder="you@someo.ne"
          required
          style={{ background: "#16161e", borderColor: "#27272a" }}
          type="email"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="font-normal text-[#a1a1aa]" htmlFor="password">
          Password
        </Label>
        <Input
          className="h-10 rounded-xl border text-sm transition-all focus:border-[rgba(124,58,237,0.5)] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]"
          id="password"
          name="password"
          placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
          required
          style={{ background: "#16161e", borderColor: "#27272a" }}
          type="password"
        />
      </div>

      {children}
    </Form>
  );
}
