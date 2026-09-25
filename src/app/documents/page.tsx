import { DocumentsLibrary } from "@/components/documents-library";
import { CRM_VENDOR } from "@/lib/seed-data";

export default function DocumentsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#5f7a76]">
          Documents
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#0f2a32]">
          Uploaded documents
        </h1>
        <p className="max-w-2xl text-sm text-[#5f7a76]">
          All files on file for {CRM_VENDOR.name}, starting with the intake
          form when present.
        </p>
      </header>
      <DocumentsLibrary />
    </div>
  );
}
