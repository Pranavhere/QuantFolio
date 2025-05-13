import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Home, Wallet, BarChart2, ShoppingCart, LogOut, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";

const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Portfolio", url: "/portfolio", icon: Wallet },
    { title: "Market", url: "/market", icon: BarChart2 },
    { title: "Trading", url: "/trading", icon: ShoppingCart },
];

const SYMBOL_REGEX = /^[A-Z]{1,5}$/;

export function AppSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const [symbol, setSymbol] = React.useState('');
    const [isSearching, setIsSearching] = React.useState(false);
    const [error, setError] = React.useState(null);

    const handleSearch = React.useCallback((e) => {
        e.preventDefault();
        setError(null);

        if (!symbol) {
            setError('Please enter a symbol');
            return;
        }

        if (!SYMBOL_REGEX.test(symbol)) {
            setError('Invalid symbol format');
            return;
        }

        setIsSearching(true);
        const searchSymbol = symbol.trim().toUpperCase();
        navigate(`/market?symbol=${searchSymbol}`, { replace: true });
        setSymbol('');
        setIsSearching(false);
    }, [symbol, navigate]);

    const handleKeyDown = React.useCallback((e) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    }, [handleSearch]);

    const isActive = React.useCallback((path) => {
        return location.pathname === path;
    }, [location.pathname]);

    return (
        <Sidebar className="border-r">
            <SidebarContent>
                <SidebarHeader className="p-4 border-b" align="center">
                    <div className="flex items-center justify-between w-full">
                        <h1 className="text-xl font-bold">QuantFolio</h1>
                        <ModeToggle />
                    </div>
                </SidebarHeader>
                <SidebarGroup>
                    <form onSubmit={handleSearch} className="p-4 space-y-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search symbol (e.g., AAPL)"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                onKeyDown={handleKeyDown}
                                disabled={isSearching}
                                className="pl-8"
                                aria-label="Search stock symbol"
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500" role="alert">
                                {error}
                            </p>
                        )}
                    </form>
                    <SidebarMenu>
                        {menuItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    className={cn(
                                        isActive(item.url) && "bg-accent"
                                    )}
                                >
                                    <Link
                                        to={item.url}
                                        className="flex items-center gap-2"
                                        aria-current={isActive(item.url) ? 'page' : undefined}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={logout}
                                className="flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}