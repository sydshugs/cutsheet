// ComingSoon.tsx — Placeholder component for features in development

import { type LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: 480,
          animation: "fadeIn 0.4s ease-out forwards",
        }}
      >
        {/* Icon circle */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={32} color="#6366f1" />
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#f4f4f5",
            marginTop: 20,
            marginBottom: 0,
          }}
        >
          {title}
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 14,
            color: "#71717a",
            lineHeight: 1.6,
            marginTop: 12,
            maxWidth: 360,
          }}
        >
          {description}
        </p>

        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            borderRadius: 9999,
            padding: "4px 16px",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            color: "#818cf8",
            fontSize: 12,
            marginTop: 16,
          }}
        >
          Coming soon
        </div>
      </div>
    </div>
  );
}
