import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="space-y-4 max-w-md">
        <span className="inline-block text-4xl font-mono font-bold text-[var(--primary)]">
          404
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Page Not Found
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          The requested page or document view does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Button href="/" variant="primary" size="md">
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
