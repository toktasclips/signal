"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadModal } from "@/components/leads/lead-modal";

export function PipelineHeaderActions() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setModalOpen(true)}>
        <Plus className="h-4 w-4" />
        New Lead
      </Button>
      <LeadModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
