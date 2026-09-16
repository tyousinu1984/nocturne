# Nocturne Project Rules

## Scope

This project is the public website and internal operations tooling for an
event-staffing company that dispatches promotional models/companions to
trade shows, exhibitions and product launches. Corporate clients browse
available models and submit booking inquiries; models register their own
availability; staff review inquiries and manage schedules.

The project name and brand ("Nocturne Tokyo") is a placeholder inherited
from an earlier, unrelated version of this codebase and will be replaced
once a final company name is chosen — do not treat it as meaningful
branding.

## History

This codebase was originally built (by a different contributor, before this
project changed hands) as a UI reference-rebuild of a public adult-video
catalogue interface, styled after a real nightlife/adult-entertainment
directory. That framing no longer applies. Content and components inherited
from that phase — nightlife district labels, tier names like "Muse", an age
gate, a "now online" ticker, a popularity ranking — are being removed or
rewritten as part of the ongoing rebrand to the actual business described
above. If you encounter leftover copy, imagery, or components that still
read as nightlife/adult-entertainment styled, flag it rather than assuming
it's intentional.

## Content boundaries

1. No explicit sexual content of any kind — this was never in scope even
   under the old framing, and has no relevance to the current business.
2. Model profile photos are currently placeholder images inherited from the
   old version of this project; they will be replaced once real model
   material is supplied. Don't treat the current photos as final or as
   real endorsements of anyone depicted.
3. Model names, bios and availability are demo/placeholder data until real
   model records are supplied.

## Development boundary

1. Confirm the target branch with the project owner before starting work;
   don't self-create or assume a branch.
2. Don't deploy, publish, modify DNS, or touch production services without
   a separate explicit request.
3. Real booking inquiries are handled as a simple submit-and-follow-up form
   (client submits event details, staff follow up manually) — do not build
   real-time calendar locking, online payment, or automated contract
   generation without an explicit request; those are out of scope for now.
4. Validate responsive behavior, keyboard access, reduced motion, build, and
   local runtime before handoff.
