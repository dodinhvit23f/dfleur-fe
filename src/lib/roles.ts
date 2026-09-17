const ROLE_HOME_ROUTES: Record<string, string> = {
  ADMIN: "/admin",
  MANAGER: "/manager",
};

const DEFAULT_ROLE_ROUTE = "/user";

export function getRoleHomeRoute(roles: string[]): string {
  for (const role of roles) {
    const route = ROLE_HOME_ROUTES[role];
    if (route) return route;
  }
  return DEFAULT_ROLE_ROUTE;
}
