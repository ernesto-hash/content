import { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionTo,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="glass border border-white/10 rounded-2xl p-8 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-foreground/70">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-2 text-sm text-foreground/60">{description}</p>}

      {actionLabel && actionTo && (
        <div className="mt-6">
          <Link
            to={actionTo}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-semibold hover:opacity-90 transition-all"
          >
            {actionLabel}
          </Link>
        </div>
      )}
    </div>
  );
}