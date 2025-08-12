"use client";

import { ChevronsUpDown, CircleUser, LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Session } from "next-auth";

export function NavUser({ session }: { session: Session }) {
  const handleLogout = async () => {
    await signOut({ redirectTo: "/login" });
  };

  // Don't render if no user
  if (!session) {
    return null;
  }

  return (
    <div className="flex items-center gap-5 px-3 py-2 text-sm bg-white rounded-lg shadow-sm">
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={session.user.image || ""} alt={session.user.email} />
        <AvatarFallback className="rounded-lg">
          <User />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="truncate text-xs mb-1">{session.user.email}</span>
        <Badge variant="secondary" className="text-xs w-fit">
          Quản trị hệ thống
        </Badge>
      </div>
      <div
        onClick={handleLogout}
        className="border border-gray-200 hover:bg-red-100 p-2 rounded-lg cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
      </div>
    </div>
  );
}
