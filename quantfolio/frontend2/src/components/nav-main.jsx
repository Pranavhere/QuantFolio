import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function NavMain({ items, onSearch }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      if (onSearch) {
        await onSearch(searchQuery);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, onSearch]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  }, [handleSearch]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSearching}
              className={cn(
                "w-full pl-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                isSearching && "opacity-50"
              )}
              aria-label="Search navigation items"
            />
          </div>
        </form>
      </SidebarMenuItem>
      {filteredItems.map((item) => {
        const isActive = location.pathname === item.url;
        return (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              asChild
              className={cn(
                "flex items-center gap-2",
                isActive && "bg-accent"
              )}
            >
              <Link
                to={item.url}
                aria-current={isActive ? 'page' : undefined}
                className="flex items-center gap-2"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
      {filteredItems.length === 0 && searchQuery && (
        <div className="px-4 py-2 text-sm text-muted-foreground">
          No results found
        </div>
      )}
    </SidebarMenu>
  );
}

NavMain.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      description: PropTypes.string,
    })
  ).isRequired,
  onSearch: PropTypes.func,
};

NavMain.defaultProps = {
  onSearch: null,
};
