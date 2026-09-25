"use client";

import { useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import {
  COMPLIANCE_DOCS,
  DOCUMENT_DEFINITIONS,
  DOC_STATUSES,
  makeSampleFile,
  statusLabel,
  type DocumentTypeId,
  type DocStatus,
} from "@/lib/documents";
import { useVendorState } from "@/lib/vendor-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function statusVariant(status: DocStatus) {
  switch (status) {
    case "missing":
      return "outline" as const;
    case "uploaded":
      return "secondary" as const;
    case "signed_off":
      return "default" as const;
    case "reuploaded":
      return "default" as const;
  }
}

function formatBytes(size: number | null) {
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,application/pdf,image/*";

export function IntakeUpload() {
  const { documents, fileUrls, uploadDocument, removeDocument } =
    useVendorState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const doc = documents.intake;
  const meta = DOCUMENT_DEFINITIONS.find((d) => d.id === "intake")!;
  const url = fileUrls.intake;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const err = await uploadDocument("intake", file);
    setError(err);
    if (!err) setMessage(`${file.name} uploaded.`);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)]">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold text-[#0f2a32]">
          Intake form
        </h2>
        <p className="mt-1 text-sm text-[#5f7a76]">
          Upload a copy of our intake form for this vendor. It will appear in
          Documents and persist in this browser.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#17343a]">{meta.label}</p>
          <p className="mt-1 text-sm text-[#5f7a76]">
            {doc.fileName
              ? `${doc.fileName} · ${formatBytes(doc.fileSize)}`
              : "No file uploaded yet"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload />
            {doc.fileName ? "Replace file" : "Upload intake form"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => onFile(makeSampleFile(meta.label))}
          >
            Use sample file
          </Button>
          {url && doc.fileName ? (
            <a
              href={url}
              download={doc.fileName}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-transparent bg-secondary px-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              <Download className="size-4" />
              Download
            </a>
          ) : null}
          {doc.fileName ? (
            <Button
              type="button"
              variant="ghost"
              onClick={async () => {
                await removeDocument("intake");
                setMessage("Intake form removed.");
              }}
            >
              <Trash2 />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {message && !error ? (
        <p className="mt-3 text-sm text-[#1a6b63]">{message}</p>
      ) : null}
    </section>
  );
}

function DocRow({ id }: { id: DocumentTypeId }) {
  const {
    documents,
    fileUrls,
    uploadDocument,
    setDocumentStatus,
    removeDocument,
  } = useVendorState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const def = DOCUMENT_DEFINITIONS.find((d) => d.id === id)!;
  const doc = documents[id];
  const url = fileUrls[id];

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const err = await uploadDocument(id, file);
    setError(err);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <TableRow className="status-flash">
      <TableCell>
        <p className="font-medium text-[#17343a]">{def.label}</p>
        <p className="text-xs text-[#5f7a76]">{def.description}</p>
        {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <Badge variant={statusVariant(doc.status)} className="status-badge w-fit">
            {statusLabel(doc.status)}
          </Badge>
          <label className="sr-only" htmlFor={`status-${id}`}>
            Update status for {def.label}
          </label>
          <select
            id={`status-${id}`}
            className="h-8 max-w-48 rounded-lg border border-input bg-background px-2 text-xs"
            value={doc.status}
            onChange={(e) => setDocumentStatus(id, e.target.value as DocStatus)}
          >
            {DOC_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </div>
      </TableCell>
      <TableCell className="text-sm text-[#5f7a76]">
        {doc.fileName ?? "—"}
      </TableCell>
      <TableCell className="text-sm text-[#5f7a76]">
        {formatWhen(doc.updatedAt)}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload />
            {doc.fileName ? "Replace" : "Upload"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => onFile(makeSampleFile(def.label))}
          >
            Sample
          </Button>
          {url && doc.fileName ? (
            <a
              href={url}
              download={doc.fileName}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-transparent bg-secondary px-2.5 text-[0.8rem] font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              <Download className="size-3.5" />
              Download
            </a>
          ) : null}
          {doc.fileName ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => removeDocument(id)}
            >
              <Trash2 />
              Remove
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function DocumentChecklist() {
  return (
    <section className="rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)]">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold text-[#0f2a32]">
          Setup checklist
        </h2>
        <p className="mt-1 text-sm text-[#5f7a76]">
          Upload documents, update status as the vendor signs off, and replace
          files as needed. Changes stay in this browser.
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {COMPLIANCE_DOCS.map((doc) => (
              <DocRow key={doc.id} id={doc.id} />
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
