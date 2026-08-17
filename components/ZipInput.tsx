"use client";

type ZipInputProps = {
  value: string;
  onChange: (value: string) => void;
  status: "idle" | "valid" | "not-found";
};

export default function ZipInput({ value, onChange, status }: ZipInputProps) {
  return (
    <div className="w-full sm:w-48">
      <label htmlFor="zip-input" className="mb-1.5 block text-sm font-medium text-ink-muted">
        ZIP code
      </label>
      <input
        id="zip-input"
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={5}
        placeholder="90630"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
        className={`h-12 w-full rounded-[10px] border-2 bg-surface px-4 text-[15px] text-ink outline-none focus:ring-2 focus:ring-[color:var(--accent-ring)] focus:ring-offset-2 focus:ring-offset-bg ${
          status === "not-found" ? "border-error" : "border-line"
        }`}
      />
      {status === "not-found" && (
        <p className="mt-1.5 text-sm text-error">We couldn&rsquo;t find that ZIP code.</p>
      )}
    </div>
  );
}
