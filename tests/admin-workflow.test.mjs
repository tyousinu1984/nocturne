import assert from "node:assert/strict";
import test from "node:test";
import {
  canApproveRevision,
  canEditDraft,
  canPublishRevision,
  clearPublicPointer,
  publishPointers,
  rollbackPointers,
} from "../app/admin/workflow.ts";

const revision04 = {
  revisionId: "04",
  displayName: "Yuna",
  roleLine: "Fashion archivist",
  biography: "Baseline public biography.",
  cover: "/photos-preview/yuna-01.jpg",
};

const revision05 = {
  revisionId: "05",
  displayName: "Yuna QA",
  roleLine: "Fashion archivist",
  biography: "Locked review snapshot.",
  cover: "/photos-preview/yuna-02.jpg",
};

test("only editor-01 can edit an unlocked draft", () => {
  assert.equal(canEditDraft("draft", "editor-01"), true);
  assert.equal(canEditDraft("pending", "editor-01"), false);
  assert.equal(canEditDraft("approved", "editor-01"), false);
  assert.equal(canEditDraft("draft", "reviewer-01"), false);
});

test("the submitting identity cannot approve its own revision", () => {
  assert.equal(
    canApproveRevision({
      actorId: "editor-01",
      hasSnapshot: true,
      revisionStatus: "pending",
      submittedBy: "editor-01",
    }),
    false,
  );
  assert.equal(
    canApproveRevision({
      actorId: "reviewer-01",
      hasSnapshot: true,
      revisionStatus: "pending",
      submittedBy: "editor-01",
    }),
    true,
  );
});

test("publish and rollback swap exact public pointers", () => {
  const published = publishPointers(revision04, revision05);
  assert.equal(published.currentPublicSnapshot.revisionId, "05");
  assert.equal(published.previousPublicSnapshot?.revisionId, "04");

  const rolledBack = rollbackPointers(
    published.currentPublicSnapshot,
    published.previousPublicSnapshot,
  );
  assert.equal(rolledBack.currentPublicSnapshot.revisionId, "04");
  assert.equal(rolledBack.previousPublicSnapshot.revisionId, "05");
});

test("emergency takedown clears the public pointer and blocks republishing", () => {
  const takenDown = clearPublicPointer(revision05);
  assert.equal(takenDown.hiddenRevisionId, "05");
  assert.equal(takenDown.currentPublicSnapshot, null);

  assert.equal(
    canPublishRevision({
      actorId: "reviewer-01",
      approvedBy: "reviewer-01",
      hasSnapshot: true,
      publicationStatus: "taken-down",
      revisionStatus: "approved",
    }),
    false,
  );
});
