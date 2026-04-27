"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import type { TeamMember, TeamResponse } from "@/lib/types";
import { PERMISSION_FLAGS, type PermissionKey } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2, UserPlus, Clock } from "lucide-react";

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  ViewAllApplications: "View all applications",
  AssignApplications:  "Assign applications",
  ExportApplications:  "Export applications",
  ManageAllListings:   "Manage all listings",
};

const PERMISSION_KEYS = Object.keys(PERMISSION_FLAGS) as PermissionKey[];

function hasPermission(permissions: number, key: PermissionKey) {
  return (permissions & PERMISSION_FLAGS[key]) !== 0;
}

function togglePermission(permissions: number, key: PermissionKey) {
  return permissions ^ PERMISSION_FLAGS[key];
}

function PermissionCheckboxes({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {PERMISSION_KEYS.map((key) => (
        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-primary"
            checked={hasPermission(value, key)}
            onChange={() => onChange(togglePermission(value, key))}
            disabled={disabled}
          />
          <span className="text-foreground">{PERMISSION_LABELS[key]}</span>
        </label>
      ))}
    </div>
  );
}

export default function TeamPage() {
  const locale = useLocale();
  const router = useRouter();

  const [token, setToken] = useState("");
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePerms, setInvitePerms] = useState(0);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteDone, setInviteDone] = useState(false);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [memberPerms, setMemberPerms] = useState<Record<string, number>>({});

  useEffect(() => {
    const t = localStorage.getItem("ns_token") ?? "";
    if (!t) { router.replace(`/${locale}/login`); return; }
    setToken(t);
    api.team.getTeam(t)
      .then((data) => {
        setTeam(data);
        const perms: Record<string, number> = {};
        data.members.forEach((m) => { perms[m.id] = m.permissions; });
        setMemberPerms(perms);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [locale, router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) { setInviteError("Name is required."); return; }
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) { setInviteError("Enter a valid email address."); return; }
    setInviteSubmitting(true);
    setInviteError("");
    try {
      await api.team.invite({ name: inviteName, email: inviteEmail, permissions: invitePerms }, token);
      setInviteDone(true);
      setInviteName("");
      setInviteEmail("");
      setInvitePerms(0);
      const refreshed = await api.team.getTeam(token);
      setTeam(refreshed);
      const perms: Record<string, number> = {};
      refreshed.members.forEach((m) => { perms[m.id] = m.permissions; });
      setMemberPerms(perms);
      setTimeout(() => setInviteDone(false), 4000);
    } catch (err) {
      setInviteError(err instanceof Error ? JSON.parse(err.message).error ?? err.message : "Failed to send invite.");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleSavePermissions = async (member: TeamMember) => {
    setSavingId(member.id);
    try {
      await api.team.updatePermissions(member.id, memberPerms[member.id] ?? 0, token);
      setTeam((prev) => prev ? {
        ...prev,
        members: prev.members.map((m) =>
          m.id === member.id ? { ...m, permissions: memberPerms[member.id] ?? 0 } : m
        ),
      } : prev);
    } catch {
      alert("Failed to update permissions. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (member: TeamMember) => {
    if (!window.confirm(`Remove ${member.name} from your team? They will lose access immediately.`)) return;
    setRemovingId(member.id);
    try {
      await api.team.removeMember(member.id, token);
      setTeam((prev) => prev ? {
        ...prev,
        members: prev.members.filter((m) => m.id !== member.id),
        activeCount: prev.activeCount - (member.isActive ? 1 : 0),
      } : prev);
    } catch {
      alert("Failed to remove team member. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const quotaLabel = team
    ? team.quota === null
      ? `${team.activeCount} recruiter${team.activeCount !== 1 ? "s" : ""} (unlimited)`
      : `${team.activeCount} of ${team.quota} recruiter seat${team.quota !== 1 ? "s" : ""} used`
    : "";

  const atQuota = team ? (team.quota !== null && team.activeCount >= team.quota) : false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={`/${locale}/dashboard`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Team</h1>
          {team && (
            <p className="mt-1 text-sm text-muted-foreground">{quotaLabel}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Team members */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Members</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : team && team.members.length > 0 ? (
              <div className="space-y-4">
                {team.members.map((member) => {
                  const changed = memberPerms[member.id] !== member.permissions;
                  return (
                    <div key={member.id} className="rounded-lg border border-border p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground text-sm">{member.name}</span>
                            {member.pendingInvite && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">
                                <Clock className="h-3 w-3" />
                                Pending
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{member.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemove(member)}
                          disabled={removingId === member.id}
                          className="shrink-0 rounded-md p-1.5 text-destructive/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <PermissionCheckboxes
                        value={memberPerms[member.id] ?? 0}
                        onChange={(v) => setMemberPerms((prev) => ({ ...prev, [member.id]: v }))}
                        disabled={savingId === member.id}
                      />

                      {changed && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleSavePermissions(member)}
                            disabled={savingId === member.id}
                          >
                            {savingId === member.id ? "Saving…" : "Save permissions"}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recruiters yet. Invite one below.</p>
            )}
          </CardContent>
        </Card>

        {/* Invite form */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Invite Recruiter
            </h2>

            {atQuota ? (
              <p className="text-sm text-muted-foreground">
                You've reached your plan's recruiter limit. Upgrade your plan to add more team members.
              </p>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Full name</label>
                    <Input
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Work email</label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="jane@yourorg.ca"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Permissions</label>
                  <PermissionCheckboxes value={invitePerms} onChange={setInvitePerms} />
                </div>

                {inviteError && (
                  <p className="text-sm text-destructive">{inviteError}</p>
                )}

                {inviteDone && (
                  <p className="text-sm text-green-600">Invite sent! They'll receive an email to set up their account.</p>
                )}

                <Button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {inviteSubmitting ? "Sending…" : "Send Invite"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
