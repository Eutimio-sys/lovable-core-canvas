import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, LogOut, User } from "lucide-react";

export function WorkspaceSwitcher() {
  const { user, signOut } = useAuth();
  const { currentWorkspace, userRole } = useWorkspace();

  if (!user) return null;

  const userInitials = user.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium truncate max-w-[120px]">
                {currentWorkspace?.name || "My Workspace"}
              </p>
              <p className="text-xs text-muted-foreground">{userRole}</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm">{user.email}</span>
            <Badge variant="outline" className="w-fit mt-1">
              {userRole}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="h-4 w-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
