"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { markLeadWon, markLeadLost } from "@/actions/pipeline";
import { PipelineColumn } from "./pipeline-column";
import { PipelineCard } from "./pipeline-card";
import { LeadModal } from "@/components/leads/lead-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Lead, LeadStatus } from "@/types";

const COLUMNS: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "offer_sent",
  "won",
  "lost",
];

interface PipelineBoardProps {
  leads: Lead[];
}

export function PipelineBoard({ leads }: PipelineBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [wonTarget, setWonTarget] = useState<Lead | null>(null);
  const [lostTarget, setLostTarget] = useState<Lead | null>(null);
  const [winNote, setWinNote] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const lead = leads.find((l) => l.id === active.id);
    if (!lead) return;

    const newStatus = over.id as LeadStatus;
    if (lead.status === newStatus) return;

    if (newStatus === "won") {
      setWonTarget(lead);
      return;
    }
    if (newStatus === "lost") {
      setLostTarget(lead);
      return;
    }

    startTransition(async () => {
      const { updateLeadStatus } = await import("@/actions/pipeline");
      await updateLeadStatus(lead.id, newStatus);
    });
  };

  const handleMarkWon = (lead: Lead) => setWonTarget(lead);
  const handleMarkLost = (lead: Lead) => setLostTarget(lead);

  const handleEdit = (lead: Lead) => {
    setEditLead(lead);
    setModalOpen(true);
  };

  const handleConfirmWon = () => {
    if (!wonTarget) return;
    startTransition(async () => {
      await markLeadWon(wonTarget.id, winNote || null);
      setWonTarget(null);
      setWinNote("");
    });
  };

  const handleConfirmLost = () => {
    if (!lostTarget) return;
    startTransition(async () => {
      await markLeadLost(lostTarget.id, lostReason || null);
      setLostTarget(null);
      setLostReason("");
    });
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto -mx-6 px-6 lg:-mx-10 lg:px-10 pb-4">
          <div className="flex gap-3 min-w-fit">
            {COLUMNS.map((status) => (
              <PipelineColumn
                key={status}
                status={status}
                leads={leads.filter((l) => l.status === status)}
                onEdit={handleEdit}
                onMarkWon={handleMarkWon}
                onMarkLost={handleMarkLost}
                activeId={activeId}
              />
            ))}
          </div>
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 180,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}
        >
          {activeLead ? (
            <PipelineCard
              lead={activeLead}
              onEdit={() => {}}
              onMarkWon={() => {}}
              onMarkLost={() => {}}
              isDragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Edit Modal */}
      <LeadModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditLead(null);
        }}
        lead={editLead}
      />

      {/* Won Dialog */}
      <Dialog
        open={!!wonTarget}
        onOpenChange={(open) => {
          if (!open) {
            setWonTarget(null);
            setWinNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Won 🎉</DialogTitle>
            <DialogDescription>
              Congratulations! Add an optional note about this win.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="space-y-1.5">
              <Label htmlFor="board-win-note">Win note (optional)</Label>
              <Textarea
                id="board-win-note"
                placeholder="What closed this deal?"
                value={winNote}
                onChange={(e) => setWinNote(e.target.value)}
                className="h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setWonTarget(null);
                setWinNote("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmWon}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Mark Won
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lost Dialog */}
      <Dialog
        open={!!lostTarget}
        onOpenChange={(open) => {
          if (!open) {
            setLostTarget(null);
            setLostReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Lost</DialogTitle>
            <DialogDescription>
              Add an optional reason for losing this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="space-y-1.5">
              <Label htmlFor="board-lost-reason">Lost reason (optional)</Label>
              <Textarea
                id="board-lost-reason"
                placeholder="Why was this deal lost?"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setLostTarget(null);
                setLostReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLost}
              disabled={isPending}
              variant="destructive"
            >
              Mark Lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
