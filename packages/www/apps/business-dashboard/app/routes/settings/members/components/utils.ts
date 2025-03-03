import { useFetchers } from "react-router";
import { SettingsMemberRouteIntent } from "../members-route.js";
import { type TeamRole } from "~/utils/permissions/core.server.js";
import type { Member, MemberFilter, PendingMember } from "./manage-members.js";

type PendingFetcher = ReturnType<typeof useFetchers>[number] & {
  formData: FormData;
};

export function useFilteredMembers(
  members: Member[],
  memberFilter: MemberFilter,
  memberSearchQuery: string,
) {
  let filteredMembers = members;
  filteredMembers = useFilteredMembersWithPendingRemoveMemberData(members);
  filteredMembers =
    useFilteredMembersWithPendingChangeMemberRoleData(filteredMembers);

  filteredMembers =
    memberFilter === "member" || memberFilter === "admin"
      ? filteredMembers.filter((member) => member.role === memberFilter)
      : filteredMembers;

  if (memberSearchQuery.length > 0) {
    filteredMembers = filteredMembers.filter(
      (member) =>
        member.email.includes(memberSearchQuery) ||
        member.name.includes(memberSearchQuery),
    );
  }

  return filteredMembers;
}

export function useFilteredPendingMembers(
  pendingMembers: PendingMember[],
  memberSearchQuery: string,
) {
  let filteredPendingMembers = pendingMembers;
  filteredPendingMembers =
    useFilteredPendingMembersWithPendingCancelEmailInviteData(pendingMembers);

  if (memberSearchQuery.length > 0) {
    filteredPendingMembers = filteredPendingMembers.filter((member) =>
      member.email.includes(memberSearchQuery),
    );
  }
  return filteredPendingMembers;
}

function usePendingChangeMemberRoleData() {
  const fetchers = useFetchers()
    .filter((fetcher): fetcher is PendingFetcher => {
      if (!fetcher.formData) return false;

      return (
        fetcher.formData.get("intent") ===
        SettingsMemberRouteIntent.CHANGE_MEMBER_ROLE
      );
    })
    .map((fetcher) => {
      const customerId = String(fetcher.formData.get("customerId"));
      const role = String(fetcher.formData.get("role")) as TeamRole;

      return { customerId, role };
    });

  const customerRoleMap = new Map<string, TeamRole>();
  fetchers.forEach(({ customerId, role }) => {
    customerRoleMap.set(customerId, role);
  });

  return customerRoleMap;
}

function useFilteredMembersWithPendingChangeMemberRoleData(
  filteredMembers: Member[],
) {
  const map = usePendingChangeMemberRoleData();

  if (map.size === 0) return filteredMembers;

  return filteredMembers.map((member) => {
    const roleFromMap = map.get(member.customerId);
    return roleFromMap !== undefined
      ? { ...member, role: roleFromMap }
      : member;
  });
}

function usePendingRemoveMemberData() {
  return useFetchers()
    .filter((fetcher): fetcher is PendingFetcher => {
      if (!fetcher.formData) return false;

      return (
        fetcher.formData.get("intent") ===
        SettingsMemberRouteIntent.REMOVE_MEMBER
      );
    })
    .map((fetcher) => {
      const customerId = String(fetcher.formData.get("customerId"));

      return customerId;
    });
}

function useFilteredMembersWithPendingRemoveMemberData(
  filteredMembers: Member[],
) {
  const removeCustomerIds = usePendingRemoveMemberData();

  if (removeCustomerIds.length === 0) return filteredMembers;

  return filteredMembers.filter(
    (member) => !removeCustomerIds.includes(member.customerId),
  );
}

function usePendingCancelEmailInviteData() {
  return useFetchers()
    .filter((fetcher) => {
      if (!fetcher.formData) return false;

      return (
        fetcher.formData.get("intent") ===
        SettingsMemberRouteIntent.CANCEL_EMAIL_INVITE
      );
    })
    .map((fetcher) => {
      const code = String(fetcher.formData?.get("code"));
      return code;
    });
}

function useFilteredPendingMembersWithPendingCancelEmailInviteData(
  filteredPendingMembers: PendingMember[],
) {
  const deletedCodes = usePendingCancelEmailInviteData();

  if (deletedCodes.length === 0) return filteredPendingMembers;

  return filteredPendingMembers.filter(
    (member) => !deletedCodes.includes(member.code),
  );
}
