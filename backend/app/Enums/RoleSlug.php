<?php

namespace App\Enums;

enum RoleSlug: string
{
    case SuperAdmin = 'super-admin';
    case Admin = 'admin';
    case Editor = 'editor';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin => 'Admin',
            self::Editor => 'Editor',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Full access to every module, including users, roles and permanent deletion.',
            self::Admin => 'Full access to content modules and inbox, without user or role management.',
            self::Editor => 'Can create and update content, but cannot delete or publish.',
        };
    }
}
