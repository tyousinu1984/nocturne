// The shared shape every locale dictionary (en/ja/zh) must satisfy. Keeping
// this as one type — rather than letting each locale file freely declare
// its own shape — is what makes a missing/renamed key a compile error
// instead of a silent runtime fallback to English.
export type Dictionary = {
  nav: {
    home: string;
    cast: string;
    schedule: string;
    ranking: string;
    system: string;
    access: string;
    reviews: string;
    blog: string;
    faq: string;
    contact: string;
  };
  quickLinks: { number: string; title: string; sub: string; slug: string; href: string }[];
  header: {
    openToday: string;
    openMenu: string;
    closeMenu: string;
    quickGuideAria: string;
    primaryNavAria: string;
    mobileNavAria: string;
  };
  brand: { sub: string };
  ageGate: {
    overline: string;
    logoSub: string;
    declinedTitle: string;
    declinedBody: string;
    return: string;
    welcomeTitle: string;
    welcomeBody: string;
    enter: string;
    exit: string;
    note: string;
    ariaLabel: string;
  };
  hero: {
    kicker: string;
    headlineLine1: string;
    headlineLine2: string;
    description: string;
    viewAllCast: string;
    ariaLabel: string;
    badgeYear: string;
    badgeNew: string;
    badgeLineup: string;
  };
  ticker: { nowOnline: string };
  notice: { updatedToday: string; title: string; body: string; cta: string; month: string };
  sections: {
    directory: { eyebrow: string; title: string; note: string };
    ranking: { eyebrow: string; title: string; note: string };
    systemGuide: { eyebrow: string; title: string; note: string };
    reviews: { eyebrow: string; title: string; note: string };
    journal: { eyebrow: string; title: string; note: string };
    related: { eyebrow: string; title: string };
    profileSchedule: { eyebrow: string; note: string };
  };
  directory: {
    searchPlaceholder: string;
    searchSrLabel: string;
    areaLabel: string;
    statusLabel: string;
    districtFilterAria: string;
    statusFilterAria: string;
    profilesSuffix: string;
    lastUpdate: string;
    noProfileFound: string;
    resetFilters: string;
    showMoreCast: string;
  };
  filters: {
    districts: Record<"All" | "Aoyama" | "Ginza" | "Daikanyama", string>;
    statuses: Record<"All" | "Tonight" | "This week" | "Private", string>;
  };
  card: { openProfile: string; readProfile: string; portraitAlt: string };
  systemGuideSteps: { number: string; title: string; copy: string }[];
  reviewsData: { title: string; body: string; date: string }[];
  journalStories: { category: string; date: string; title: string }[];
  footer: {
    districts: { name: string; note: string }[];
    groupDirectory: string;
    groupGuide: string;
    groupInformation: string;
    linkAllCast: string;
    linkSchedule: string;
    linkRanking: string;
    linkFirstGuide: string;
    linkReviews: string;
    linkBlog: string;
    infoLines: string[];
    copyright: string;
    disclaimer: string;
  };
  profile: {
    breadcrumbHome: string;
    breadcrumbCast: string;
    castMessage: string;
    areaLabel: string;
    languageLabel: string;
    styleLabel: string;
    returnToDirectory: string;
    photoLabelPrefix: string;
    galleryEyebrow: string;
    galleryTitle: string;
    updateLabelPrefix: string;
    blogEyebrow: string;
    blogPost1Title: string;
    blogPost2Title: string;
    blogBody: string;
    reviewsEyebrow: string;
    reviewsTitle: string;
  };
  scheduleState: {
    checkingTitle: string;
    checkingBody: string;
    unavailableTitle: string;
    unavailableBody: string;
    noShiftsTitle: string;
    noShiftsBody: string;
  };
  // Shared vocabulary reused across all 12 artists (data.ts keeps the raw
  // English union-typed values as keys into these, rather than each artist
  // repeating its own translated copy).
  tierLabels: Record<"Muse" | "Signature" | "New", string>;
  statsLabels: Record<"Practice" | "Format" | "Mood" | "Tempo", string>;
  scheduleDayStates: Record<"Studio" | "Salon" | "Archive" | "Off", string>;
  weekdayAbbrev: Record<"THU" | "FRI" | "SAT" | "SUN" | "MON", string>;
  languageNames: Record<"Japanese" | "English" | "Korean" | "French" | "Mandarin" | "Spanish", string>;
  // Discipline tags: ~34 distinct values across 12 artists, shared
  // vocabulary rather than per-artist copy. A loose Record (not an exact
  // union) keeps the type manageable; localizeArtist() falls back to the
  // raw English value for anything not present, so a missed key degrades
  // gracefully instead of breaking the build.
  disciplineNames: Record<string, string>;
  // Per-artist editorial copy — unlike everything above, this is genuinely
  // one translation per artist, not a shared template (see data.ts).
  artists: Record<string, { role: string; shortNote: string; biography: string }>;
  meta: {
    homeTitle: string;
    homeDescription: string;
    profileNotFound: string;
    adminTitle: string;
    adminDescription: string;
    staffTitle: string;
    staffDescription: string;
  };
  admin: {
    brandSub: string;
    environmentBanner: string;
    nav: Array<{ id: string; number: string; label: string; hint: string }>;
    sidebarNoteTitle: string;
    sidebarNoteBody: string;
    topbarEyebrow: string;
    authenticatedOperatorLabel: string;
    siteAccessCodeSuffix: string;
    simulatedRoleLabel: string;
    roleOptionEditor: string;
    roleOptionReviewer: string;
    revisionStatus: { draft: string; pending: string; approved: string };
    publicationStatus: {
      "baseline-live": string;
      "revision-live": string;
      "rolled-back": string;
      "taken-down": string;
    };
    auditSeed: [{ action: string; detail: string }, { action: string; detail: string }];
    notices: {
      onlyEditorCanSave: string;
      draftSaved: string;
      onlyEditorCanSubmit: string;
      submissionBlocked: string;
      submitterCannotApprove: string;
      reviewerAndPendingRequired: string;
      snapshotUnavailable: string;
      takedownClosedSession: string;
      approveBeforePublication: string;
      rollbackRequiresPublication: string;
      takedownRequiresReviewer: string;
    };
    audit: {
      draftSavedAction: string;
      submittedAction: string;
      approvalBlockedAction: string;
      approvedAction: string;
      repostBlockedAction: string;
      publishedAction: string;
      rollbackAction: string;
      takedownAction: string;
    };
    content: {
      profileRevisionEyebrow: string;
      revisionBadge: string;
      publicNameLabel: string;
      publicRoleLabel: string;
      publicBiographyLabel: string;
      mediaSetEyebrow: string;
      suppliedPhotosLabel: string;
      selectCoverHint: string;
      photoLabelPrefix: string;
      currentCover: string;
      setAsCover: string;
      saveDraft: string;
      submitForReview: string;
    };
    release: {
      reviewReleaseEyebrow: string;
      controlledPublicationTitle: string;
      lockedSnapshotLabel: string;
      revisionBadgePrefix: string;
      currentPublicLabel: string;
      hiddenLabel: string;
      profileHiddenNote: string;
      previousPointerLabel: string;
      noneLabel: string;
      availableAsPointerNote: string;
      noPriorPublicationNote: string;
      submittedByLabel: string;
      approvalRequiresDifferentIdentity: string;
      stepDraftCreated: string;
      stepGovernancePassed: string;
      stepIndependentApproval: string;
      stepProbePublication: string;
      approveRevision: string;
      publishProbe: string;
      rollback: string;
      emergencyTakedown: string;
    };
    governance: {
      publicationGateEyebrow: string;
      rightsSafetyTitle: string;
      blockingItemsSuffix: string;
      checks: { adultVerified: string; websiteUsage: string; exifClean: string };
      requiredBeforeSubmission: string;
      rightsEvidenceLabel: string;
      rightsEvidencePlaceholder: string;
      rightsEvidenceNote: string;
      publicationBlocked: string;
      readyForReview: string;
      readyForReviewNote: string;
      issues: {
        adultIncomplete: string;
        websiteUsageMissing: string;
        exifNotClean: string;
        rightsReferenceMissing: string;
      };
    };
    queue: {
      summaryActiveRevision: string;
      summaryActiveRevisionDetail: string;
      summaryRightsGaps: string;
      summaryRightsGapsPending: string;
      summaryRightsGapsClear: string;
      summaryCurrentPublic: string;
      summaryCurrentPublicDetail: string;
      summaryPublishFailures: string;
      summaryPublishFailuresDetail: string;
      tableHeadPriority: string;
      tableHeadObject: string;
      tableHeadReason: string;
      tableHeadStatus: string;
      tableHeadAction: string;
      priorityReason: string;
      openRevision: string;
      sliceEyebrow: string;
      sliceTitle: string;
      sliceBody: string;
    };
    preview: {
      defaultLabel: string;
      defaultBadge: string;
      tonightGinza: string;
      untitledProfile: string;
      rolePending: string;
      biographyPending: string;
      contactPreviewOnly: string;
      simulatedNote: string;
    };
    auditPanel: {
      sessionOnlyRecord: string;
      simulatedTimeline: string;
      resetsOnRefresh: string;
    };
    access: {
      eyebrow: string;
      title: string;
      activeAccountsSuffix: string;
      castScopeTitle: string;
      castScopeBody: string;
      adminScopeTitle: string;
      adminScopeBody: string;
      sessionControlTitle: string;
      sessionControlBody: string;
      oneTimeCodeLabel: string;
      oneTimeCodeNote: string;
      savedIt: string;
      attentionRequired: string;
      retryLoad: string;
      loadingIdentities: string;
      noAccount: string;
      sessionVersionLabel: string;
      lastLoginLabel: string;
      never: string;
      accountIdLabel: string;
      noSignInIdentity: string;
      createAccount: string;
      creating: string;
      resetAccessCode: string;
      resetting: string;
      disable: string;
      enable: string;
      recentEvents: string;
      noEventsYet: string;
      accessError: string;
      accessCommandBlocked: string;
      accountsLoadFailed: string;
      accountCommandFailed: string;
      actionLabels: { create: string; rotate_credential: string; enable: string; disable: string };
    };
    attendance: {
      myAttendance: string;
      attendanceControl: string;
      newDraft: string;
      signedInCast: string;
      authorizedOperator: string;
      stepDraft: string;
      stepReview: string;
      stepApproved: string;
      stepPublic: string;
      castProfileLabel: string;
      serviceDateLabel: string;
      startTimeLabel: string;
      endTimeLabel: string;
      privateNoteLabel: string;
      privateNotePlaceholder: string;
      rejectionReasonLabel: string;
      cancellationReasonLabel: string;
      reasonPlaceholder: string;
      reviewNote: string;
      attentionRequired: string;
      retryLoad: string;
      createDraft: string;
      creating: string;
      saveChanges: string;
      saveDraft: string;
      saving: string;
      submitForReview: string;
      submitting: string;
      rejectWithNote: string;
      rejecting: string;
      approve: string;
      approving: string;
      publishToProfile: string;
      publishing: string;
      saveLiveChanges: string;
      cancelPublicShift: string;
      cancelling: string;
      newAttendance: string;
      publicProjectionLabel: string;
      weeklyScheduleSuffix: string;
      publicProjectionNote: string;
      myRecords: string;
      allSchedules: string;
      refresh: string;
      loadingAttendance: string;
      noRecordsYet: string;
      appendOnlyEvents: string;
      selectRecordToViewHistory: string;
      checkingProjection: string;
      loadingService: string;
      checking: string;
      summary: {
        drafts: string;
        draftsNote: string;
        waitingReview: string;
        waitingReviewNote: string;
        approved: string;
        approvedNote: string;
        public: string;
        publicNote: string;
      };
      statusLabels: {
        draft: string;
        pending: string;
        approved: string;
        published: string;
        rejected: string;
        cancelled: string;
      };
      adminUpdateLabel: string;
      newAttendanceNotice: string;
      attendanceCouldNotLoad: string;
      attendanceCommandFailed: string;
      commandBlocked: string;
      attendanceAccessLabel: string;
      actionLabels: {
        create: string;
        save_draft: string;
        submit: string;
        approve: string;
        reject: string;
        publish: string;
        cancel: string;
      };
    };
  };
  staffPortal: {
    checkingSession: string;
    myAttendanceHeading: string;
    privateAccessTitle: string;
    intro: string;
    castProfileLabel: string;
    accessCodeLabel: string;
    signIn: string;
    signingIn: string;
    disableNote: string;
    signOut: string;
    signedIn: string;
    signedOutLabel: string;
    portalLabel: string;
    manageNotice: string;
    signedOutNotice: string;
    signInFailed: string;
  };
};
