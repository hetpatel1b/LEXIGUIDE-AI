import type { Metadata } from "next";
import { ActionCenterWorkspace } from "@/features/action-center";

export const metadata: Metadata = {
  title: "Action Center — Review, Upcoming & Discuss | LexiGuide AI",
  description:
    "Turn contract findings into clear next steps. Review critical clauses, monitor upcoming milestones, and prepare questions for legal professionals.",
};

export default function ActionCenterPage() {
  return <ActionCenterWorkspace />;
}
