"use client";

import clsx from "clsx";

const ROLE_META: Record<
  string,
  { label: string; className: string; title?: string }
> = {
  agent: {
    label: "AI Agent",
    className: "badge-agent",
    title: "Autonomous agent — can spend within policy on Paylane",
  },
  "api-seller": {
    label: "API Seller",
    className: "badge-api",
    title: "Sells metered APIs on Paylane",
  },
  freelancer: { label: "Freelancer", className: "badge-muted" },
  developer: { label: "Developer", className: "badge-muted" },
  designer: { label: "Designer", className: "badge-muted" },
  writer: { label: "Writer", className: "badge-muted" },
  client: { label: "Client", className: "badge-muted" },
};

function roleLabel(tag: string) {
  return ROLE_META[tag]?.label ?? tag.replace(/-/g, " ");
}

function roleClass(tag: string) {
  return ROLE_META[tag]?.className ?? "badge-muted";
}

function roleTitle(tag: string) {
  return ROLE_META[tag]?.title;
}

export function RoleBadges({
  roleTags,
  agentConfigured,
  size = "sm",
  max = 4,
}: {
  roleTags: string[];
  /** User has an active AgentPolicy (Mode B spend). */
  agentConfigured?: boolean;
  size?: "sm" | "xs";
  max?: number;
}) {
  const tags = roleTags.slice(0, max);
  const hasAgentTag = roleTags.includes("agent");

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className={clsx("badge", roleClass(tag), size === "xs" && "text-[10px] px-2 py-0")}
          title={roleTitle(tag)}
        >
          {tag === "agent" && <AgentIcon />}
          {roleLabel(tag)}
        </span>
      ))}
      {agentConfigured && hasAgentTag && (
        <span
          className={clsx("badge badge-agent-live", size === "xs" && "text-[10px] px-2 py-0")}
          title="Agent policy configured — autonomous spend enabled"
        >
          <AgentIcon />
          Autonomous
        </span>
      )}
    </div>
  );
}

function AgentIcon() {
  return (
    <svg
      className="mr-0.5 inline h-3 w-3 opacity-90"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 1a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2V2a1 1 0 1 1 2 0V3h2V2a1 1 0 0 1 1-1zM5 5v6h6V5H5zm2 2h2v2H7V7z" />
    </svg>
  );
}
