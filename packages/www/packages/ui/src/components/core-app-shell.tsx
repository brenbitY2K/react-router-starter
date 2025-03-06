import { PanelLeft } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent } from "./ui/sheet.js";

export function CoreApplicationShell({
  sideNavConent,
  mainContent,
}: {
  sideNavConent: React.ReactNode;
  mainContent: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-10 lg:flex lg:w-80 lg:flex-col">
        <div className="border-border flex grow flex-col gap-y-5 overflow-y-auto p-3">
          <nav className="flex flex-1 flex-col">{sideNavConent}</nav>
        </div>
      </div>
      <div className="w-full lg:pl-80">
        <TopNav sideNavConent={sideNavConent} />
        <main className="bg-base-200 min-h-[calc(100vh-2.5rem)] flex-1 overflow-auto lg:m-2 lg:max-h-[calc(100vh-1rem)] lg:min-h-[calc(100vh-1rem)] lg:w-[calc(100%-1rem)] lg:rounded-sm lg:border">
          <div className="flex min-h-full w-full items-center justify-center">
            {mainContent}
          </div>
        </main>
      </div>
    </div>
  );
}

export function TopNav({ sideNavConent }: { sideNavConent: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="border-border bg-base-200 sticky top-0 z-10 flex h-10 shrink-0 items-center gap-x-4 border-b px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
      <button
        className="text-foreground -m-2.5 p-2.5"
        onClick={() => {
          setSidebarOpen(true);
        }}
        type="button"
      >
        <span className="sr-only">Open sidebar</span>
        <PanelLeft aria-hidden="true" className="size-4" />
      </button>
      <Sheet onOpenChange={setSidebarOpen} open={sidebarOpen}>
        <SheetContent side="left" className="bg-base-100 w-4/5 sm:w-[350px]">
          <div className="bg-base-100 mt-6 flex grow flex-col gap-y-5 overflow-y-auto px-0 pb-4">
            <nav className="flex flex-1 flex-col">{sideNavConent}</nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function LeftSheetButton() {
  return <></>;
}
