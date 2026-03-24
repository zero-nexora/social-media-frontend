import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, Home, UserPlus } from "lucide-react";
import { useNotificationStore } from "../../stores/notification-store";
import { useAuth } from "../../hooks/use-auth";
import { UserAvatar } from "../shared/user-avatar";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "../ui/popover";
import { Input } from "../ui/input";
import { useDebounce } from "../../hooks/use-debounce";
import { usersApi } from "../../services/api-services";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { Logo } from "../shared/logo";
import { NotificationDropdown } from "../notification/notification-dropdown";

function NavBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Badge
      variant="destructive"
      className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
    >
      {count > 9 ? "9+" : count}
    </Badge>
  );
}

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, friendRequestCount } = useNotificationStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: searchResults = [] } = useQuery({
    queryKey: ["user-search", debouncedQuery],
    queryFn: () => usersApi.search(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur-sm border-b flex items-center px-4 gap-3">
      <Logo />

      <div className="flex-1 max-w-xs">
        <Popover
          open={searchOpen && debouncedQuery.length > 0}
          onOpenChange={setSearchOpen}
        >
          <PopoverAnchor asChild>
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchOpen(false);
                  setSearchQuery("");
                }
              }}
              className="rounded-full bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary text-sm"
            />
          </PopoverAnchor>
          <PopoverContent className="p-1 w-72" align="start">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2.5">
                Không tìm thấy kết quả
              </p>
            ) : (
              searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    navigate(`/profile/${u.username}`);
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-muted text-sm transition-colors"
                >
                  <UserAvatar user={u} size="sm" />
                  <span className="font-medium">{u.username}</span>
                </button>
              ))
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <Link
          to="/feed"
          className={cn(
            "p-2 rounded-full hover:bg-muted transition-colors",
            isActive("/feed") ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Home size={21} />
        </Link>

        <Link
          to="/friends"
          className="relative p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
        >
          <UserPlus size={21} />
          <NavBadge count={friendRequestCount} />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
              <Bell size={21} />
              <NavBadge count={unreadCount} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <NotificationDropdown />
          </DropdownMenuContent>
        </DropdownMenu>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full ml-1 ring-2 ring-transparent hover:ring-border transition-all">
                <UserAvatar user={user} size="sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => navigate(`/profile/${user.username}`)}
              >
                Trang cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                Cài đặt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};
