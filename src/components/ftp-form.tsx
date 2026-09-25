"use client";

import { useEffect, useState } from "react";
import { useVendorState, type FtpCredentials } from "@/lib/vendor-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FtpForm() {
  const { ftp, saveFtp, hydrated } = useVendorState();
  const [form, setForm] = useState<FtpCredentials>(ftp);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (hydrated) setForm(ftp);
  }, [hydrated, ftp]);

  function update<K extends keyof FtpCredentials>(
    key: K,
    value: FtpCredentials[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveFtp({
      host: form.host.trim(),
      username: form.username.trim(),
      password: form.password,
    });
    setSaved(true);
  }

  return (
    <section className="max-w-xl rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)]">
      <div className="mb-5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#0f2a32]">
          FTP Access
        </h1>
        <p className="mt-2 text-sm text-[#5f7a76]">
          Manually record FTP credentials for Footwear Vendor file exchange.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ftp-host">Host</Label>
          <Input
            id="ftp-host"
            value={form.host}
            placeholder="ftp.example.com"
            onChange={(e) => update("host", e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ftp-username">Username</Label>
          <Input
            id="ftp-username"
            value={form.username}
            placeholder="vendor.ftp"
            onChange={(e) => update("username", e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ftp-password">Password</Label>
          <Input
            id="ftp-password"
            type="password"
            value={form.password}
            placeholder="••••••••"
            onChange={(e) => update("password", e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <Button type="submit">Save FTP credentials</Button>
          {saved ? (
            <p className="text-sm text-[#1a6b63]">Credentials saved locally.</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
