import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { hasAccess } from "@/lib/constants";
import {
  LayoutDashboard, FileText, Users, FolderOpen, BarChart3,
  Settings, LogOut, CreditCard, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { title: "Records", url: "/records", icon: FileText, key: "records" },
  { title: "Analytics", url: "/analytics", icon: BarChart3, key: "analytics" },
  { title: "By User", url: "/analytics/by-user", icon: Users, key: "analytics-by-user" },
  { title: "By Category", url: "/analytics/category-expenses", icon: FolderOpen, key: "analytics-category" },
  { title: "Users", url: "/users", icon: Users, key: "users" },
  { title: "Categories", url: "/categories", icon: FolderOpen, key: "categories" },
  { title: "Settings", url: "/settings", icon: Settings, key: "settings" },
];

export function AppSidebar() {
  const { role, logout, user } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();

  const visibleItems = navItems.filter((item) => role && hasAccess(role, item.key));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar-background">
      <div className="flex h-14 items-center border-b border-border px-4">
        <CreditCard className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && <span className="ml-2 text-lg font-bold text-foreground tracking-tight">FinanceHQ</span>}
      </div>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      activeClassName="bg-secondary text-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive flex-1" title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-muted-foreground">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
