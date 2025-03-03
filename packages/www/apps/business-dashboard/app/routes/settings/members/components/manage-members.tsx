import { Avatar, AvatarFallback, AvatarImage } from "@www/ui/avatar";
import { Button } from "@www/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@www/ui/select";
import { Input } from "@www/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@www/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@www/ui/dialog";
import { Ellipsis } from "lucide-react";
import { Form, useFetcher, useLoaderData, useSubmit } from "react-router";
import { convertTeamToPresentationalView } from "~/utils/team.js";
import { useEffect, useState } from "react";
import { type LoaderData } from "~/utils/loaders.js";
import { SettingsMemberRouteIntent, type loader } from "../members-route.js";
import {
  isFormValidationActionError,
  isSuccessResponse,
} from "~/utils/response.js";
import {
  SendEmailInviteFormContent,
  ShareableInviteLinkCopier,
} from "~/components/team-invite.js";
import { type sendEmailInvite } from "../actions/send-email-invite.js";
import { toast } from "sonner";
import { useFilteredMembers, useFilteredPendingMembers } from "./utils.js";
import { generateImageFallbackText } from "~/utils/images.js";

export function ManageMembers() {
  const loaderData = useLoaderData<typeof loader>();
  const [memberFilter, setMemberFilter] = useState<MemberFilter>("all");
  const [memberSearch, setMemberSearch] = useState("");

  return (
    <>
      <div className="space-y-4">
        {loaderData.canViewerManageMembers && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Manage members</h3>
            <p className="text-muted-foreground">
              You can add members or administrators.
            </p>
          </div>
        )}
        <MemberSearchAndInvite
          memberSearch={memberSearch}
          memberFilter={memberFilter}
          onMemberFilterChange={setMemberFilter}
          onMemberSearchChange={setMemberSearch}
        />
        <MemberList memberFilter={memberFilter} memberSearch={memberSearch} />
      </div>
    </>
  );
}

function convertFilterToText(filter: MemberFilter, quantity: number) {
  if (filter === "all") {
    return quantity === 1 ? "active member" : "active members";
  } else if (filter === "admin") {
    return quantity === 1 ? "admin" : "admins";
  } else if (filter === "member") {
    return quantity === 1 ? "member" : "members";
  } else {
    return quantity === 1 ? "pending member" : "pending members";
  }
}

export function MemberList({
  memberFilter,
  memberSearch,
}: {
  memberFilter: MemberFilter;
  memberSearch: string;
}) {
  const loaderData = useLoaderData<typeof loader>();
  const allMembers = loaderData.members;

  const filteredMembers = useFilteredMembers(
    allMembers,
    memberFilter,
    memberSearch,
  );

  const filteredPendingMembers = useFilteredPendingMembers(
    loaderData.pendingMembers,
    memberSearch,
  );

  const activeMembersNumberMessage = `${filteredMembers.length} ${convertFilterToText(
    memberFilter,
    filteredMembers.length,
  )}`;

  const pendingMembersNumberMessage = `${filteredPendingMembers.length} ${convertFilterToText(
    memberFilter,
    filteredPendingMembers.length,
  )}`;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {memberFilter === "pending"
          ? filteredPendingMembers.length > 0
            ? pendingMembersNumberMessage
            : null
          : filteredMembers.length > 0
            ? activeMembersNumberMessage
            : null}
      </h3>
      {memberFilter === "pending" ? (
        filteredPendingMembers.length > 0 ? (
          filteredPendingMembers.map((member) => (
            <div key={member.email} className="flex items-center">
              <div className="flex w-1/2 items-center space-x-4">
                <Avatar>
                  <AvatarFallback>
                    {generateImageFallbackText(member.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-muted-foreground text-sm">
                    {member.email}
                  </div>
                </div>
              </div>
              <div className="flex w-1/4 items-center justify-center space-x-2">
                <div className="text-sm">
                  {convertTeamToPresentationalView(member.role)}
                </div>
              </div>
              <div className="flex w-1/4 items-center justify-end">
                <PendingMemberDropDownControls pendingMember={member} />
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">
              There are no {convertFilterToText(memberFilter, 2)} in this team.
            </p>
          </div>
        )
      ) : filteredMembers.length > 0 ? (
        filteredMembers.map((member) => (
          <div key={member.email} className="flex items-center">
            <div className="flex w-1/2 items-center space-x-4">
              <Avatar>
                <AvatarImage src={member.imageUrl ?? undefined} />
                <AvatarFallback>
                  {generateImageFallbackText(member.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-muted-foreground text-sm">{member.email}</p>
              </div>
            </div>
            <div className="flex w-1/4 items-center justify-center space-x-2">
              <p className="text-sm">
                {convertTeamToPresentationalView(member.role)}
              </p>
            </div>
            <div className="flex w-1/4 items-center justify-end">
              <MemberDropDownControls member={member} />
            </div>
          </div>
        ))
      ) : (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">
            There are no {convertFilterToText(memberFilter, 2)} in this team.
          </p>
        </div>
      )}
    </div>
  );
}

export type Member = LoaderData<typeof loader>["members"][0];

export function MemberDropDownControls({ member }: { member: Member }) {
  const loaderData = useLoaderData<typeof loader>();

  const currentMemberIsTheViewer =
    loaderData.currentCustomerId === member.customerId;

  // Owner shouldn't be able to leave or change their own role. This
  // should go through an ownership transfer instead
  const disabledIfMemberIsOwner = member.role === "owner";

  const disabledIfCurrentViewerCantManageOtherMembers =
    !loaderData.canViewerManageMembers && !currentMemberIsTheViewer;

  const ellipsisDisabled =
    disabledIfCurrentViewerCantManageOtherMembers || disabledIfMemberIsOwner;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={ellipsisDisabled}>
        <Ellipsis
          className={`size-4 ${ellipsisDisabled ? "text-muted-foreground" : "text-foreground"}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {currentMemberIsTheViewer ? (
          <SelfMemberDropDown />
        ) : (
          <OtherMemberDropDown member={member} />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type PendingMember = LoaderData<typeof loader>["pendingMembers"][0];

export function PendingMemberDropDownControls({
  pendingMember,
}: {
  pendingMember: PendingMember;
}) {
  const loaderData = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const ellipsisDisabled = !loaderData.canViewerManageMembers;

  function copyToClipboard() {
    navigator.clipboard.writeText(pendingMember.inviteLink);
    toast.success("Invite link copied to clipboard.");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={ellipsisDisabled}>
        <Ellipsis
          className={`size-4 ${ellipsisDisabled ? "text-muted-foreground" : "text-foreground"}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              Cancel invitation
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Are you sure you want to cancel the invitation to{" "}
                {pendingMember.email}?
              </DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Their invitation link will be invalidated. You can resend a new
              one at any point.
            </DialogDescription>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
              <Form
                method="POST"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(e.currentTarget, { navigate: false });
                }}
              >
                <input type="hidden" name="code" value={pendingMember.code} />
                <input
                  type="hidden"
                  name="intent"
                  value={SettingsMemberRouteIntent.CANCEL_EMAIL_INVITE}
                />
                <DialogTrigger asChild>
                  <Button type="submit">Confirm</Button>
                </DialogTrigger>
              </Form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <DropdownMenuItem onClick={copyToClipboard}>
          Copy invite link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OtherMemberDropDown({ member }: { member: Member }) {
  const [selectedMemberForDialog, setSelectedMemberForDialog] =
    useState<Member | null>(null);
  const roleToChangeTo = member.role === "admin" ? "member" : "admin";

  const submit = useSubmit();

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setSelectedMemberForDialog(member);
            }}
          >
            Change {member.name} to {roleToChangeTo}
          </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to change {selectedMemberForDialog?.name} to{" "}
              {roleToChangeTo}?
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            They will have full access to your team.
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
            <Form
              method="POST"
              onSubmit={(e) => {
                e.preventDefault();
                submit(e.currentTarget, { navigate: false });
              }}
            >
              <input
                type="hidden"
                name="customerId"
                value={member.customerId}
              />
              <input type="hidden" name="role" value={roleToChangeTo} />
              <input
                type="hidden"
                name="intent"
                value={SettingsMemberRouteIntent.CHANGE_MEMBER_ROLE}
              />
              <DialogTrigger asChild>
                <Button type="submit">Confirm</Button>
              </DialogTrigger>
            </Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setSelectedMemberForDialog(member);
            }}
          >
            Remove user
          </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to remove {selectedMemberForDialog?.name}?
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            They will no longer be able to access this team.
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
            <Form
              method="POST"
              onSubmit={(e) => {
                e.preventDefault();
                submit(e.currentTarget, { navigate: false });
              }}
            >
              <input
                type="hidden"
                name="customerId"
                value={selectedMemberForDialog?.customerId}
              />
              <input
                type="hidden"
                name="intent"
                value={SettingsMemberRouteIntent.REMOVE_MEMBER}
              />
              <DialogTrigger asChild>
                <Button type="submit">Remove</Button>
              </DialogTrigger>
            </Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SelfMemberDropDown() {
  const fetcher = useFetcher();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
          }}
        >
          Leave team
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to leave this team?</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          You will no longer have access to this team.
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <fetcher.Form method="POST">
            <DialogTrigger asChild>
              <Button
                type="submit"
                name="intent"
                value={SettingsMemberRouteIntent.LEAVE_TEAM}
              >
                Leave
              </Button>
            </DialogTrigger>
          </fetcher.Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type MemberFilter = "all" | "admin" | "member" | "pending";

export function MemberSearchAndInvite({
  memberFilter,
  memberSearch,
  onMemberFilterChange,
  onMemberSearchChange,
}: {
  memberSearch: string;
  memberFilter: MemberFilter;
  onMemberSearchChange: (value: string) => void;
  onMemberFilterChange: (value: MemberFilter) => void;
}) {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="flex w-full items-center justify-between space-x-2">
      <div className="flex flex-grow items-center space-x-2">
        <Input
          type="text"
          value={memberSearch}
          onChange={(event) => onMemberSearchChange(event.target.value)}
          placeholder="Search by name or email"
          className="w-full min-w-[200px] max-w-[300px]"
        />
        <div className="flex-shrink-0">
          <Select
            name="filter"
            value={memberFilter}
            onValueChange={onMemberFilterChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="member">Members</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {loaderData.canViewerManageMembers && <InvitePeopleDialogAndButton />}
    </div>
  );
}

export function InvitePeopleDialogAndButton() {
  const fetcher = useFetcher<typeof sendEmailInvite>();
  const loaderData = useLoaderData<typeof loader>();
  const [mode, setMode] = useState<"link" | "email">("email");
  const [openDialog, setOpenDialog] = useState(false);

  const formLoading = fetcher.state !== "idle";

  useEffect(() => {
    const data = fetcher.data;
    if (isSuccessResponse(data)) {
      if (data.success) {
        setOpenDialog(false);
      }
    }
  }, [fetcher.data]);

  return (
    <Dialog open={openDialog} onOpenChange={(value) => setOpenDialog(value)}>
      <DialogTrigger asChild>
        <Button>Invite people</Button>
      </DialogTrigger>
      <DialogContent className="p-7 sm:max-w-md md:max-w-xl">
        <fetcher.Form method="POST">
          <DialogHeader>
            <DialogTitle className="text-md">
              {mode === "link" ? "Invite link" : "Invite with email"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {mode === "link"
                ? "Share this link with others you'd like to join your team."
                : "Invite others to your team via email. Enter emails in a comma separated list."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex items-center space-x-3">
            {mode === "link" ? (
              loaderData.inviteLink !== null ? (
                <ShareableInviteLinkCopier link={loaderData.inviteLink} />
              ) : (
                <p className="text-muted-foreground text-center">
                  This team has disabled shareable links. Please invite with
                  email instead.
                </p>
              )
            ) : (
              <SendEmailInviteFormContent
                errors={
                  isFormValidationActionError(fetcher.data)
                    ? fetcher.data.formValidationError.emails?._errors
                    : undefined
                }
              />
            )}
          </div>
          <DialogFooter className="mt-8 sm:justify-between">
            <Button
              className="text-primary"
              variant="ghost"
              type="button"
              onClick={() => setMode(mode === "link" ? "email" : "link")}
            >
              {mode === "link" ? "Invite with email" : "Invite with link"}
            </Button>
            {mode === "email" && (
              <Button
                type="submit"
                name="intent"
                value={SettingsMemberRouteIntent.SEND_EMAIL_INVITE}
                loading={formLoading}
              >
                Send invites
              </Button>
            )}
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
