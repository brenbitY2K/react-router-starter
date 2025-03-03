import { Input } from "@www/ui/input";
import { Textarea } from "@www/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@www/ui/select";
import { Button } from "@www/ui/button";
import { ErrorList } from "./forms.js";
import { toast } from "sonner";

export enum TeamInviteComponentAction {
  SEND_EMAIL_INVITE = "sendEmailInvite",
  TOGGLE_SHAREABLE_INVITE = "toggleShareableInvite",
}

export function SendEmailInviteFormContent({
  errors,
}: {
  errors: string[] | undefined;
}) {
  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="w-full">
        <Textarea
          name="emails"
          placeholder="email1@example.com, email2@example.com"
        />
        {errors !== undefined && <ErrorList errors={errors} />}
      </div>
      <Select defaultValue="member" name="role">
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="member">
              <span className="font-bold">Member</span>
              <span className="text-muted-foreground">
                {" "}
                - Full access with limited permissions
              </span>
            </SelectItem>
            <SelectItem value="admin">
              <span className="font-bold">Admin</span>
              <span className="text-muted-foreground">
                {" "}
                - Full administrative access
              </span>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export function ShareableInviteLinkCopier({ link }: { link: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard.");
  };

  return (
    <>
      <Input readOnly type="text" value={link} />
      <Button onClick={copyToClipboard} className="flex-shrink-0" type="button">
        Copy
      </Button>
    </>
  );
}
