import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="space-y-4 max-w-md">
        <span className="inline-block text-4xl font-mono font-bold text-[var(--color-brand-blue)]">
          404
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The requested page or document view does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary" size="md">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
