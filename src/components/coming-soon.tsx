import { FileQuestion } from "lucide-react";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#b7cec7] bg-white/50 px-6 py-16 text-center">
      <FileQuestion className="mx-auto size-8 text-[#7a9a93]" />
      <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-[#0f2a32]">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#5f7a76]">
        {description}
      </p>
      <p className="mt-6 text-xs uppercase tracking-[0.16em] text-[#7a9a93]">
        Coming soon
      </p>
    </div>
  );
}
