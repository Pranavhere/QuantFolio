"use client";
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function NavSecondary({
  items,
  isLoading,
  error,
  ...props
}) {
  const location = useLocation();

  const isActive = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);

  const handleKeyDown = useCallback((e, url) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = url;
    }
  }, []);

  const renderContent = useMemo(() => {
    if (isLoading) {
      return (
        <SidebarMenu>
          {[...Array(3)].map((_, index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton asChild>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-sm text-red-500" role="alert">
          {error}
        </div>
      );
    }

    if (!items?.length) {
      return (
        <div className="p-4 text-sm text-muted-foreground">
          No items available
        </div>
      );
    }

    return (
      <SidebarMenu>
        {items.map((item) => {
          const active = isActive(item.url);
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className={cn(
                  "flex items-center gap-2",
                  active && "bg-accent"
                )}
              >
                <Link
                  to={item.url}
                  className="flex items-center gap-2"
                  aria-current={active ? 'page' : undefined}
                  onKeyDown={(e) => handleKeyDown(e, item.url)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    );
  }, [items, isLoading, error, isActive, handleKeyDown]);

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        {renderContent}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

NavSecondary.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
    })
  ),
  isLoading: PropTypes.bool,
  error: PropTypes.string,
};

NavSecondary.defaultProps = {
  items: [],
  isLoading: false,
  error: null,
};
