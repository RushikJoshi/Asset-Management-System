export const APPROVAL_PENDING = "Pending";
export const APPROVAL_APPROVED = "Approved";
export const APPROVAL_REJECTED = "Rejected";

export const isRequestFullyApproved = (request) =>
  request?.managerApproval === APPROVAL_APPROVED &&
  request?.adminApproval === APPROVAL_APPROVED;

export const isRequestRejected = (request) =>
  request?.managerApproval === APPROVAL_REJECTED ||
  request?.adminApproval === APPROVAL_REJECTED ||
  request?.requestStatus === APPROVAL_REJECTED;

export const hasAnyApproval = (request) =>
  request?.managerApproval === APPROVAL_APPROVED ||
  request?.adminApproval === APPROVAL_APPROVED;

export const hasFinalDecision = (request) =>
  request?.managerApproval === APPROVAL_APPROVED ||
  request?.managerApproval === APPROVAL_REJECTED ||
  request?.adminApproval === APPROVAL_APPROVED ||
  request?.adminApproval === APPROVAL_REJECTED ||
  request?.requestStatus === APPROVAL_APPROVED ||
  request?.requestStatus === APPROVAL_REJECTED;

export const computeRequestStatus = (managerApproval, adminApproval) => {
  if (
    managerApproval === APPROVAL_REJECTED ||
    adminApproval === APPROVAL_REJECTED
  ) {
    return APPROVAL_REJECTED;
  }
  if (
    managerApproval === APPROVAL_APPROVED &&
    adminApproval === APPROVAL_APPROVED
  ) {
    return APPROVAL_APPROVED;
  }
  return APPROVAL_PENDING;
};

export const canManagerApprove = (role) =>
  ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(role);

export const canAdminApprove = (role) =>
  ["SUPER_ADMIN", "ADMIN", "IT_STAFF"].includes(role);

/** Next approval step for the signed-in user, or null if none. */
export const getNextApprovalStep = (request, role) => {
  if (!request || isRequestFullyApproved(request) || isRequestRejected(request)) {
    return null;
  }

  if (
    request.managerApproval !== APPROVAL_APPROVED &&
    canManagerApprove(role)
  ) {
    return {
      field: "managerApproval",
      label: "Approve (Manager)",
      stepName: "Manager",
    };
  }

  if (
    request.managerApproval === APPROVAL_APPROVED &&
    request.adminApproval !== APPROVAL_APPROVED &&
    canAdminApprove(role)
  ) {
    return {
      field: "adminApproval",
      label: "Approve (IT/Admin)",
      stepName: "IT/Admin",
    };
  }

  return null;
};

export const canDeleteRequest = (request) =>
  !hasFinalDecision(request);

export const canEditRequest = (request) => !isRequestFullyApproved(request);

export const buildApprovalPayload = (request, approvalField) => {
  const managerApproval =
    approvalField === "managerApproval"
      ? APPROVAL_APPROVED
      : request.managerApproval || APPROVAL_PENDING;
  const adminApproval =
    approvalField === "adminApproval"
      ? APPROVAL_APPROVED
      : request.adminApproval || APPROVAL_PENDING;

  return {
    managerApproval,
    adminApproval,
    requestStatus: computeRequestStatus(managerApproval, adminApproval),
  };
};

export const buildRejectionPayload = (request, approvalField) => {
  const managerApproval =
    approvalField === "managerApproval"
      ? APPROVAL_REJECTED
      : request.managerApproval || APPROVAL_PENDING;
  const adminApproval =
    approvalField === "adminApproval"
      ? APPROVAL_REJECTED
      : request.adminApproval || APPROVAL_PENDING;

  return {
    managerApproval,
    adminApproval,
    requestStatus: computeRequestStatus(managerApproval, adminApproval),
  };
};
