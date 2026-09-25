"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useVendorState, type VendorUser } from "@/lib/vendor-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

export function VendorUserForm() {
  const {
    vendorUsers,
    addVendorUser,
    updateVendorUser,
    removeVendorUser,
  } = useVendorState();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  function startEdit(user: VendorUser) {
    setEditingId(user.id);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    });
    setError(null);
    setMessage(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("First name, last name, and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };
    const duplicate = vendorUsers.some(
      (u) =>
        u.email.toLowerCase() === payload.email.toLowerCase() &&
        u.id !== editingId,
    );
    if (duplicate) {
      setError("A vendor user with that email already exists.");
      return;
    }
    setError(null);
    if (editingId) {
      updateVendorUser({ id: editingId, ...payload });
      setMessage("Vendor user updated.");
    } else {
      addVendorUser(payload);
      setMessage("Vendor user added.");
    }
    resetForm();
  }

  const users = vendorUsers;

  return (
    <section className="rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)]">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold text-[#0f2a32]">
          Vendor user access
        </h2>
        <p className="mt-1 text-sm text-[#5f7a76]">
          Add contacts who can sign in. Update or remove them after they are
          loaded.
        </p>
      </div>

      {users.length === 0 ? (
        <p className="mb-4 rounded-md border border-dashed border-[#b7cec7] px-3 py-3 text-sm text-[#5f7a76]">
          No vendor users yet.
        </p>
      ) : (
        <ul className="mb-5 divide-y divide-[#dce8e4] rounded-lg border border-[#dce8e4]">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-[#17343a]">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-sm text-[#5f7a76]">{user.email}</p>
                {user.phone ? (
                  <p className="text-xs text-[#5f7a76]">{user.phone}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(user)}
                >
                  <Pencil />
                  Update
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    removeVendorUser(user.id);
                    if (editingId === user.id) resetForm();
                    setMessage("Vendor user removed.");
                  }}
                >
                  <Trash2 />
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            autoComplete="family-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">
            Phone <span className="text-[#5f7a76]">(optional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit">
            {editingId ? "Save changes" : "Add vendor user"}
          </Button>
          {editingId ? (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {message && !error ? (
            <p className="text-sm text-[#1a6b63]">{message}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
