<?php

namespace App\Enums;

enum ModuleKey: string
{
    case Dashboard = 'dashboard';
    case Media = 'media';
    case Settings = 'settings';
    case SeoSettings = 'seo_settings';
    case NavigationMenus = 'navigation_menus';
    case HeroSections = 'hero_sections';
    case AboutSections = 'about_sections';
    case Clients = 'clients';
    case Skills = 'skills';
    case PainPoints = 'pain_points';
    case Services = 'services';
    case Projects = 'projects';
    case ProjectCategories = 'project_categories';
    case Technologies = 'technologies';
    case ProcessSteps = 'process_steps';
    case Testimonials = 'testimonials';
    case Faqs = 'faqs';
    case ContactChannels = 'contact_channels';
    case ContactMessages = 'contact_messages';
    case Locales = 'locales';
    case Users = 'users';
    case Roles = 'roles';
    case ActivityLogs = 'activity_logs';

    public static function values(): array
    {
        return array_map(fn (self $case) => $case->value, self::cases());
    }

    public function label(): string
    {
        return ucwords(str_replace('_', ' ', $this->value));
    }

    /** Actions that make sense for this module. */
    public function actions(): array
    {
        return match ($this) {
            self::Dashboard => [PermissionAction::View],
            self::ActivityLogs => [PermissionAction::View],
            self::ContactMessages => [
                PermissionAction::View, PermissionAction::Update,
                PermissionAction::Delete, PermissionAction::Restore, PermissionAction::ForceDelete,
            ],
            self::Projects => PermissionAction::cases(),
            default => [
                PermissionAction::View, PermissionAction::Create, PermissionAction::Update,
                PermissionAction::Delete, PermissionAction::Restore, PermissionAction::ForceDelete,
            ],
        };
    }
}
