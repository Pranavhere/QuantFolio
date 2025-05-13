import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { IconBrandGithub } from "@tabler/icons-react"

const getPageTitle = (pathname) => {
  const path = pathname.split('/')[1];
  if (!path) return 'Dashboard';
  return path.charAt(0).toUpperCase() + path.slice(1);
};

export function SiteHeader({ isLoading, error }) {
  const location = useLocation();

  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);

  return (
    <header
      className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
      role="banner"
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger 
          className="-ml-1" 
          aria-label="Toggle sidebar"
        />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">
          {isLoading ? (
            <span className="animate-pulse">Loading...</span>
          ) : error ? (
            <span className="text-red-500" role="alert">{error}</span>
          ) : (
            pageTitle
          )}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Button 
            variant="ghost" 
            asChild 
            size="sm" 
            className="hidden sm:flex"
            aria-label="View source code on GitHub"
          >
            <Link
              to="https://github.com/your-username/quantfolio"
              rel="noopener noreferrer"
              target="_blank"
              className="flex items-center gap-2 dark:text-foreground"
            >
              <IconBrandGithub className="h-4 w-4" />
              <span className="hidden md:inline">GitHub</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

SiteHeader.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.string,
};

SiteHeader.defaultProps = {
  isLoading: false,
  error: null,
};
