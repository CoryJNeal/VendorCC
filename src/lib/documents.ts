export type DocStatus =
  | "missing"
  | "uploaded"
  | "signed_off"
  | "reuploaded";

export type DocumentTypeId =
  | "intake"
  | "compliance_manual"
  | "new_vendor_setup"
  | "pfas_letter"
  | "web_confidentiality"
  | "tax_documents";

export type DocumentDefinition = {
  id: DocumentTypeId;
  label: string;
  description: string;
  isCompliance: boolean;
};

export const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  {
    id: "intake",
    label: "Intake Form",
    description: "Internal intake form copy for this vendor",
    isCompliance: false,
  },
  {
    id: "compliance_manual",
    label: "Compliance Manual",
    description: "Vendor compliance requirements",
    isCompliance: true,
  },
  {
    id: "new_vendor_setup",
    label: "New Vendor Setup Form",
    description: "Setup packet for onboarding",
    isCompliance: true,
  },
  {
    id: "pfas_letter",
    label: "PFAS Letter",
    description: "PFAS disclosure attestation",
    isCompliance: true,
  },
  {
    id: "web_confidentiality",
    label: "Web Confidentiality",
    description: "Web and data confidentiality agreement",
    isCompliance: true,
  },
  {
    id: "tax_documents",
    label: "Tax Documents",
    description: "W-9 / tax paperwork",
    isCompliance: true,
  },
];

export const COMPLIANCE_DOCS = DOCUMENT_DEFINITIONS.filter((d) => d.isCompliance);

export const DOC_STATUSES: DocStatus[] = [
  "missing",
  "uploaded",
  "signed_off",
  "reuploaded",
];

export type StoredDocument = {
  id: DocumentTypeId;
  status: DocStatus;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  updatedAt: string | null;
};

export function emptyDocument(id: DocumentTypeId): StoredDocument {
  return {
    id,
    status: "missing",
    fileName: null,
    fileSize: null,
    mimeType: null,
    updatedAt: null,
  };
}

export function makeSampleFile(label: string) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const body = [
    label,
    "Vendor: Footwear Vendor",
    "Generated for Vendor Command Center demo",
    `Created: ${new Date().toISOString()}`,
    "",
    "This is a sample document so uploads can be demonstrated without a local file.",
  ].join("\n");
  return new File([body], `${slug}.txt`, { type: "text/plain" });
}

export function statusLabel(status: DocStatus) {
  switch (status) {
    case "missing":
      return "Missing";
    case "uploaded":
      return "Uploaded by Ops";
    case "signed_off":
      return "Signed Off";
    case "reuploaded":
      return "Reuploaded by Vendor";
  }
}
