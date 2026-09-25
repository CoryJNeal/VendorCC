"use client";

import { Download, FileText } from "lucide-react";
import {
  DOCUMENT_DEFINITIONS,
  statusLabel,
  type DocStatus,
} from "@/lib/documents";
import { useVendorState } from "@/lib/vendor-state";
import { Badge } from "@/components/ui/badge";
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

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function DocumentsLibrary() {
  const { documents, fileUrls } = useVendorState();

  const uploaded = DOCUMENT_DEFINITIONS.map((def) => ({
    def,
    doc: documents[def.id],
    url: fileUrls[def.id],
  })).filter(({ doc }) => Boolean(doc.fileName));

  if (uploaded.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#b7cec7] bg-white/50 px-6 py-16 text-center">
        <FileText className="mx-auto size-8 text-[#7a9a93]" />
        <h2 className="mt-4 font-heading text-lg font-semibold text-[#0f2a32]">
          No documents uploaded yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#5f7a76]">
          Upload the intake form and compliance documents from the Dashboard.
          They will list here for Footwear Vendor, starting with the intake
          form.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#c9ddd7] bg-white/70 p-2 shadow-[0_1px_0_rgba(15,42,50,0.04)] sm:p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>File name</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {uploaded.map(({ def, doc, url }) => (
            <TableRow key={def.id}>
              <TableCell>
                <p className="font-medium text-[#17343a]">{def.label}</p>
                <p className="text-xs text-[#5f7a76]">{def.description}</p>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(doc.status)}>
                  {statusLabel(doc.status)}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm text-[#5f7a76]">
                {doc.fileName}
              </TableCell>
              <TableCell className="text-sm text-[#5f7a76]">
                {formatWhen(doc.updatedAt)}
              </TableCell>
              <TableCell>
                {url && doc.fileName ? (
                  <a
                    href={url}
                    download={doc.fileName}
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
                  >
                    <Download className="size-3.5" />
                    Download
                  </a>
                ) : (
                  <span className="text-xs text-[#5f7a76]">Saved locally</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
