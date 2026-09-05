<?php

namespace App\Support;

use App\Models\AboutSection;
use App\Models\AboutStat;
use App\Models\Client;
use App\Models\ContactChannel;
use App\Models\Faq;
use App\Models\FaqCategory;
use App\Models\HeroMetric;
use App\Models\HeroSection;
use App\Models\NavigationMenu;
use App\Models\PainPoint;
use App\Models\ProcessStep;
use App\Models\Project;
use App\Models\ProjectCategory;
use App\Models\SeoSetting;
use App\Models\Service;
use App\Models\ServiceStat;
use App\Models\Setting;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\SocialLink;
use App\Models\Technology;
use App\Models\Testimonial;
use Illuminate\Database\Eloquent\Model;

/**
 * Portable description of every content module, shared by
 * `content:export-snapshot` and `content:import-legacy`.
 *
 * - `key`: columns that identify a record across environments
 * - `translationKey`: translated attribute used when there is no natural column key
 * - `singleton`: one row per site (hero/about)
 * - `belongs`: foreign keys exported as the parent's natural key
 * - `many`: many-to-many relations exported as a list of natural keys
 * - `skip`: columns that are environment specific (media ids)
 */
class ContentSnapshot
{
    public const DROP = ['id', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at'];

    /** Modules in dependency order — parents before children. */
    public const MODULES = [
        'hero' => ['model' => HeroSection::class, 'singleton' => true, 'skip' => ['profile_media_id', 'cv_media_id']],
        'hero_metrics' => ['model' => HeroMetric::class, 'key' => ['value']],
        'about' => ['model' => AboutSection::class, 'singleton' => true, 'skip' => ['photo_media_id']],
        'about_stats' => ['model' => AboutStat::class, 'key' => ['value']],
        'skill_categories' => ['model' => SkillCategory::class, 'key' => ['eyebrow']],
        'skills' => [
            'model' => Skill::class,
            'key' => ['name'],
            'belongs' => ['skill_category_id' => [SkillCategory::class, 'eyebrow']],
        ],
        'pain_points' => ['model' => PainPoint::class, 'translationKey' => 'title'],
        'services' => ['model' => Service::class, 'translationKey' => 'title'],
        'service_stats' => ['model' => ServiceStat::class, 'key' => ['value']],
        'process_steps' => ['model' => ProcessStep::class, 'key' => ['step_number']],
        'project_categories' => ['model' => ProjectCategory::class, 'key' => ['slug']],
        'technologies' => ['model' => Technology::class, 'key' => ['slug']],
        'projects' => [
            'model' => Project::class,
            'key' => ['slug'],
            'skip' => ['cover_media_id'],
            'belongs' => ['project_category_id' => [ProjectCategory::class, 'slug']],
            'many' => ['technologies' => [Technology::class, 'slug']],
        ],
        'testimonials' => [
            'model' => Testimonial::class,
            'translationKey' => 'name',
            'skip' => ['avatar_media_id', 'screenshot_media_id'],
        ],
        'faq_categories' => ['model' => FaqCategory::class, 'key' => ['slug']],
        'faqs' => [
            'model' => Faq::class,
            'translationKey' => 'question',
            'belongs' => ['faq_category_id' => [FaqCategory::class, 'slug']],
        ],
        'clients' => ['model' => Client::class, 'key' => ['name'], 'skip' => ['logo_media_id']],
        'navigation_menus' => ['model' => NavigationMenu::class, 'key' => ['location', 'anchor', 'url'], 'skip' => ['parent_id']],
        'contact_channels' => ['model' => ContactChannel::class, 'key' => ['type', 'value']],
        'social_links' => ['model' => SocialLink::class, 'key' => ['platform']],
        'seo_settings' => ['model' => SeoSetting::class, 'key' => ['page_key'], 'skip' => ['og_image_media_id']],
        'settings' => ['model' => Setting::class, 'key' => ['group', 'key']],
    ];

    /** @return array<string, array<int, array<string, mixed>>> */
    public static function export(): array
    {
        $snapshot = [];

        foreach (self::MODULES as $module => $definition) {
            $snapshot[$module] = $definition['model']::query()
                ->orderBy('sort_order')
                ->orderBy('created_at')
                ->get()
                ->map(fn (Model $record) => self::exportRecord($record, $definition))
                ->all();
        }

        return $snapshot;
    }

    /** @return array<string, mixed> */
    protected static function exportRecord(Model $record, array $definition): array
    {
        $drop = array_merge(self::DROP, $definition['skip'] ?? [], array_keys($definition['belongs'] ?? []));
        $entry = ['attributes' => array_diff_key($record->attributesToArray(), array_flip($drop))];

        if (method_exists($record, 'translations')) {
            $translations = [];

            foreach ($record->translations as $translation) {
                $translations[$translation->locale] = array_diff_key(
                    $translation->attributesToArray(),
                    array_flip(array_merge(self::DROP, ['locale'], self::foreignKeys($translation)))
                );
            }

            if ($translations !== []) {
                $entry['translations'] = $translations;
            }
        }

        foreach ($definition['belongs'] ?? [] as $column => [$relatedModel, $relatedKey]) {
            $parent = $relatedModel::query()->find($record->getAttribute($column));
            $entry['belongs'][$column] = $parent?->getAttribute($relatedKey);
        }

        foreach ($definition['many'] ?? [] as $relation => [, $relatedKey]) {
            $entry['many'][$relation] = $record->{$relation}->pluck($relatedKey)->all();
        }

        return $entry;
    }

    /** Columns on a translation row that point back at the parent record. */
    protected static function foreignKeys(Model $translation): array
    {
        return array_values(array_filter(
            array_keys($translation->getAttributes()),
            fn (string $column) => str_ends_with($column, '_id')
        ));
    }
}
