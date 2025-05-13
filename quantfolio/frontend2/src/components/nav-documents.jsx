"use client"

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { IconDots } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_VISIBLE_ITEMS = 5;

export function NavDocuments({ items, isLoading, onShowMore }) {
  const location = useLocation();

  const handleShowMore = useCallback(() => {
    if (onShowMore) {
      onShowMore();
    }
  }, [onShowMore]);

  const visibleItems = useMemo(() => {
    if (!items?.length) return [];
    return items.slice(0, MAX_VISIBLE_ITEMS);
  }, [items]);

  const hasMoreItems = useMemo(() => {
    return items?.length > MAX_VISIBLE_ITEMS;
  }, [items]);

  if (isLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>History</SidebarGroupLabel>
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
      </SidebarGroup>
    );
  }

  if (!items?.length) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>History</SidebarGroupLabel>
        <SidebarMenu>
          <div className="px-4 py-2 text-sm text-muted-foreground">
            No recent documents
          </div>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>History</SidebarGroupLabel>
      <SidebarMenu>
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <SidebarMenuItem key={item.name}>
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
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
        {hasMoreItems && (
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleShowMore}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              aria-label="Show more documents"
            >
              <IconDots className="h-5 w-5" />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

NavDocuments.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
    })
  ),
  isLoading: PropTypes.bool,
  onShowMore: PropTypes.func,
};

NavDocuments.defaultProps = {
  items: [],
  isLoading: false,
  onShowMore: null,
};
