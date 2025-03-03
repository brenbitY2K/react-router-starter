import { cn } from "@www/ui/utils";
import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  CalendarIcon,
  UploadIcon,
  PieChartIcon,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "#", icon: HomeIcon, current: true },
  { name: "Teams", href: "/teams", icon: UsersIcon, current: false },
  { name: "Projects", href: "#", icon: FolderIcon, current: false },
  { name: "Calendar", href: "#", icon: CalendarIcon, current: false },
  { name: "Documents", href: "#", icon: UploadIcon, current: false },
  { name: "Reports", href: "#", icon: PieChartIcon, current: false },
];

export function SideNavContent() {
  return (
    <div>
      <ul className="flex flex-1 flex-col gap-y-7 lg:pt-8">
        <li>
          <ul className="mx-0 space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <a
                  className={cn(
                    item.current
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:text-primary hover:bg-accent",
                    "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                  )}
                  href={item.href}
                >
                  <item.icon
                    aria-hidden="true"
                    className={cn(
                      item.current
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-primary",
                      "h-6 w-6 shrink-0",
                    )}
                  />
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </div>
  );
}
