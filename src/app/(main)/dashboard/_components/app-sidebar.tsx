"use client";

import { Dna, Settings2, UserRoundCheck, Users, UserX } from "lucide-react";

import { NavItems } from "./nav-items";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Session } from "next-auth";

const navItems = [
  {
    name: "Quản lý tài khoản",
    url: "/users",
    icon: Users,
  },
  {
    name: "Quản lý tài khoản bị xóa",
    url: "/recovery",
    icon: UserX,
  },
  {
    name: "Quản lý vai trò",
    url: "/roles",
    icon: UserRoundCheck,
  },
];

export function AppSidebar({
  session,
  ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session }) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Dna className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">BDGAD</span>
                  <span className="truncate text-xs">
                    Biomedical Data Warehouse for Genomic Analysis and Diagnosis
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavItems items={navItems} />
      </SidebarContent>
    </Sidebar>
  );
}
