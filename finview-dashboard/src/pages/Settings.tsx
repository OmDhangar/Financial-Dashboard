import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/components/RoleBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/formatters";

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Settings" description="Your account information" />
      <Card className="bg-card border-border max-w-lg">
        <CardHeader><CardTitle className="text-foreground text-lg">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-medium text-foreground">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Role</p>
              <RoleBadge role={user.role} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Member since</p>
              <p className="text-sm text-foreground">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
