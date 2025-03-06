import { Card, CardHeader, CardTitle } from "@www/ui/card";

import { Mail, Link as LinkIcon, Sparkles } from "lucide-react";

export default function TeamJoin() {
  return (
    <div className="bg-base-100 flex h-screen flex-col items-center justify-center">
      <Card className="bg-base-200 mt w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Join a team</CardTitle>
            <Sparkles className="text-primary h-5 w-5" />
          </div>
          <div className="mt-6 space-y-6">
            <p className="text-muted-foreground text-lg font-medium">
              Ready to join your team? You'll need an invitation from a coworker
              to get started.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-primary flex items-center gap-2 text-sm font-semibold">
                  <Mail className="h-4 w-4" />
                  Via Email Invitation
                </h3>
                <p className="text-muted-foreground text-sm">
                  Your coworker can send an invite directly to your work email
                  from their dashboard.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-primary flex items-center gap-2 text-sm font-semibold">
                  <LinkIcon className="h-4 w-4" />
                  Using a Direct Link
                </h3>
                <p className="text-muted-foreground text-sm">
                  They can also generate and share a secure invitation link with
                  you.
                </p>
              </div>
            </div>

            <p className="text-muted-foreground text-sm">
              Haven't received an invite? No worries! Just ask your team member
              to send you one.
            </p>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
