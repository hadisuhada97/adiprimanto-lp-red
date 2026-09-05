import {
  Activity,
  BadgeCheck,
  Building2,
  CircleDollarSign,
  Contact,
  FileText,
  Globe,
  Image as ImageIcon,
  Inbox,
  Languages,
  LayoutDashboard,
  Link2,
  ListOrdered,
  MessageCircleQuestion,
  MessageSquareQuote,
  Navigation,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  badge?: "inbox";
  children?: { label: string; href: string; permission?: string }[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAVIGATION: NavGroup[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Hero Section", href: "/admin/hero", icon: Sparkles, permission: "hero_sections.view" },
      { label: "About", href: "/admin/about", icon: UserRound, permission: "about_sections.view" },
      { label: "Skills & Tech Stack", href: "/admin/skills", icon: Wrench, permission: "skills.view" },
      { label: "Pain Points", href: "/admin/pain-points", icon: TriangleAlert, permission: "pain_points.view" },
      { label: "Services", href: "/admin/services", icon: CircleDollarSign, permission: "services.view" },
      {
        label: "Portfolio",
        href: "/admin/portfolio",
        icon: FileText,
        permission: "projects.view",
        children: [
          { label: "Projects", href: "/admin/portfolio/projects", permission: "projects.view" },
          { label: "Categories", href: "/admin/portfolio/categories", permission: "project_categories.view" },
          { label: "Technologies", href: "/admin/portfolio/technologies", permission: "technologies.view" },
        ],
      },
      { label: "Process Steps", href: "/admin/process-steps", icon: ListOrdered, permission: "process_steps.view" },
      { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote, permission: "testimonials.view" },
      {
        label: "FAQ",
        href: "/admin/faq",
        icon: MessageCircleQuestion,
        permission: "faqs.view",
        children: [
          { label: "Questions", href: "/admin/faq/questions", permission: "faqs.view" },
          { label: "Categories", href: "/admin/faq/categories", permission: "faqs.view" },
        ],
      },
      { label: "Clients & Brands", href: "/admin/clients", icon: Building2, permission: "clients.view" },
    ],
  },
  {
    title: "Engagement",
    items: [
      { label: "Inbox", href: "/admin/inbox", icon: Inbox, permission: "contact_messages.view", badge: "inbox" },
      { label: "Media Library", href: "/admin/media", icon: ImageIcon, permission: "media.view" },
    ],
  },
  {
    title: "Appearance",
    items: [
      { label: "Navigation Menu", href: "/admin/navigation", icon: Navigation, permission: "navigation_menus.view" },
      { label: "Contact Channels", href: "/admin/contact-channels", icon: Contact, permission: "contact_channels.view" },
      { label: "Social Links", href: "/admin/social-links", icon: Link2, permission: "contact_channels.view" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "General", href: "/admin/settings/general", icon: Settings, permission: "settings.view" },
      { label: "SEO", href: "/admin/settings/seo", icon: Search, permission: "seo_settings.view" },
      { label: "Localization", href: "/admin/settings/localization", icon: Languages, permission: "locales.view" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, permission: "users.view" },
      { label: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck, permission: "roles.view" },
      { label: "Activity Log", href: "/admin/activity-log", icon: Activity, permission: "activity_logs.view" },
      { label: "Trash", href: "/admin/trash", icon: Trash2, permission: "projects.restore" },
    ],
  },
];

/** Every route the shell knows about, used by the placeholder page and the breadcrumb. */
export const ROUTE_TITLES: Record<string, { title: string; group: string; icon: LucideIcon }> =
  NAVIGATION.reduce(
    (accumulator, group) => {
      group.items.forEach((item) => {
        accumulator[item.href] = { title: item.label, group: group.title, icon: item.icon };

        item.children?.forEach((child) => {
          accumulator[child.href] = {
            title: `${item.label} · ${child.label}`,
            group: group.title,
            icon: item.icon,
          };
        });
      });

      return accumulator;
    },
    {} as Record<string, { title: string; group: string; icon: LucideIcon }>,
  );

export const PHASE_BY_ROUTE: Record<string, string> = {};

/** Permission required to open each admin route, used by the shell guard. */
export const ROUTE_PERMISSIONS: Record<string, string> = NAVIGATION.reduce(
  (accumulator, group) => {
    group.items.forEach((item) => {
      if (item.permission) accumulator[item.href] = item.permission;

      item.children?.forEach((child) => {
        if (child.permission) accumulator[child.href] = child.permission;
      });
    });

    return accumulator;
  },
  {} as Record<string, string>,
);

export const KNOWN_ADMIN_ROUTES = Object.keys(ROUTE_TITLES);

export const BADGE_ICON = BadgeCheck;
export const GLOBE_ICON = Globe;
