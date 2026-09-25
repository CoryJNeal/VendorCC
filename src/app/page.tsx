import { BrandFields } from "@/components/brand-fields";
import {
  DocumentChecklist,
  IntakeUpload,
} from "@/components/document-checklist";
import { KpiCards } from "@/components/kpi-cards";
import { TopStylesChart } from "@/components/top-styles-chart";
import { VendorUserForm } from "@/components/vendor-user-form";
import { CRM_VENDOR } from "@/lib/seed-data";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#5f7a76]">
          Dashboard
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#0f2a32]">
          {CRM_VENDOR.name}
        </h1>
        <p className="max-w-2xl text-sm text-[#5f7a76]">
          Performance snapshot and onboarding workspace for the vendor record
          pulled from {CRM_VENDOR.source}.
        </p>
      </header>

      <KpiCards />
      <TopStylesChart />

      <div className="grid gap-6 lg:grid-cols-2">
        <BrandFields />
        <VendorUserForm />
      </div>

      <IntakeUpload />
      <DocumentChecklist />
    </div>
  );
}
