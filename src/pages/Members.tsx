import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Mail, MoreVertical } from "lucide-react";

export default function Members() {
  // Mock data
  const members = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "owner", initials: "JD" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "admin", initials: "JS" },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "creator", initials: "BJ" },
  ];

  const pendingInvitations = [
    { id: "1", email: "alice@example.com", role: "publisher", sent: "2 days ago" },
  ];

  const roleColors: Record<string, string> = {
    owner: "bg-primary",
    admin: "bg-accent",
    publisher: "bg-success",
    creator: "bg-warning",
    analyst: "bg-muted",
    finance: "bg-destructive",
    guest: "bg-muted",
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Team Members
          </h1>
          <p className="text-muted-foreground">Manage workspace members and permissions</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle>Invite New Member</CardTitle>
          <CardDescription>Send an invitation to join your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input placeholder="Enter email address..." className="flex-1" />
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Members */}
      <Card>
        <CardHeader>
          <CardTitle>Current Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={roleColors[member.role]}>
                    {member.role}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({pendingInvitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">Sent {invite.sent}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{invite.role}</Badge>
                    <Button variant="ghost" size="sm">Resend</Button>
                    <Button variant="ghost" size="sm">Cancel</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Understanding different role capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { role: "Owner", permissions: "Full access to all features and settings" },
              { role: "Admin", permissions: "Manage members, billing, and workspace settings" },
              { role: "Publisher", permissions: "Create, edit, and publish content" },
              { role: "Creator", permissions: "Create and edit own content" },
              { role: "Analyst", permissions: "View analytics and reports" },
              { role: "Finance", permissions: "Manage billing and usage" },
              { role: "Guest", permissions: "View-only access" },
            ].map((item) => (
              <div key={item.role} className="p-3 border rounded-lg">
                <Badge className={roleColors[item.role.toLowerCase()]} variant="outline">
                  {item.role}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">{item.permissions}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
