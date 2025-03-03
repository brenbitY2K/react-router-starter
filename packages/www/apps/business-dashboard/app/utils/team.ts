export function convertTeamToPresentationalView(role: string) {
  if (!role) return role;
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function createDefaultTeamNameFromCustomerName(name: string): string {
  const firstName = name.trim().split(" ")[0];
  return `${firstName}${firstName.endsWith("s") ? "'" : "'s"} Team`;
}
