<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Models\AboutStat;
use App\Models\Client;
use App\Models\ContactChannel;
use App\Models\ContactMessage;
use App\Models\Faq;
use App\Models\FaqCategory;
use App\Models\HeroMetric;
use App\Models\Locale;
use App\Models\Media;
use App\Models\NavigationMenu;
use App\Models\PainPoint;
use App\Models\ProcessStep;
use App\Models\Project;
use App\Models\ProjectCategory;
use App\Models\SeoSetting;
use App\Models\Service;
use App\Models\ServiceStat;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\SocialLink;
use App\Models\Technology;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * One place to see, restore and permanently remove every soft-deleted record.
 * Each module keeps its own permission set; force delete stays Super Admin only
 * through the `*.force_delete` permission.
 */
class TrashController extends BaseApiController
{
    /**
     * @return array<string, array{label: string, model: class-string, permission: string, title: callable}>
     */
    protected function registry(): array
    {
        $translated = fn (string $attribute, string $fallback = 'id') => fn ($model) => $model->translate()?->getAttribute($attribute)
            ?? ($fallback === 'id' ? $model->id : $model->getAttribute($fallback));

        return [
            'projects' => ['label' => 'Projects', 'model' => Project::class, 'permission' => 'projects', 'title' => $translated('title', 'slug')],
            'project_categories' => ['label' => 'Project categories', 'model' => ProjectCategory::class, 'permission' => 'project_categories', 'title' => $translated('name', 'slug')],
            'technologies' => ['label' => 'Technologies', 'model' => Technology::class, 'permission' => 'technologies', 'title' => fn ($model) => $model->name],
            'services' => ['label' => 'Services', 'model' => Service::class, 'permission' => 'services', 'title' => $translated('title')],
            'service_stats' => ['label' => 'Service stats', 'model' => ServiceStat::class, 'permission' => 'services', 'title' => $translated('label', 'value')],
            'testimonials' => ['label' => 'Testimonials', 'model' => Testimonial::class, 'permission' => 'testimonials', 'title' => $translated('name')],
            'faqs' => ['label' => 'FAQ questions', 'model' => Faq::class, 'permission' => 'faqs', 'title' => $translated('question')],
            'faq_categories' => ['label' => 'FAQ categories', 'model' => FaqCategory::class, 'permission' => 'faqs', 'title' => $translated('name', 'slug')],
            'clients' => ['label' => 'Clients & brands', 'model' => Client::class, 'permission' => 'clients', 'title' => fn ($model) => $model->name],
            'skill_categories' => ['label' => 'Skill categories', 'model' => SkillCategory::class, 'permission' => 'skills', 'title' => $translated('name')],
            'skills' => ['label' => 'Skills', 'model' => Skill::class, 'permission' => 'skills', 'title' => fn ($model) => $model->name],
            'pain_points' => ['label' => 'Pain points', 'model' => PainPoint::class, 'permission' => 'pain_points', 'title' => $translated('title')],
            'process_steps' => ['label' => 'Process steps', 'model' => ProcessStep::class, 'permission' => 'process_steps', 'title' => $translated('title')],
            'hero_metrics' => ['label' => 'Hero metrics', 'model' => HeroMetric::class, 'permission' => 'hero_sections', 'title' => $translated('label', 'value')],
            'about_stats' => ['label' => 'About stats', 'model' => AboutStat::class, 'permission' => 'about_sections', 'title' => $translated('label', 'value')],
            'navigation_menus' => ['label' => 'Navigation menu', 'model' => NavigationMenu::class, 'permission' => 'navigation_menus', 'title' => $translated('label', 'url')],
            'contact_channels' => ['label' => 'Contact channels', 'model' => ContactChannel::class, 'permission' => 'contact_channels', 'title' => $translated('label', 'value')],
            'social_links' => ['label' => 'Social links', 'model' => SocialLink::class, 'permission' => 'contact_channels', 'title' => fn ($model) => $model->platform],
            'seo_settings' => ['label' => 'SEO settings', 'model' => SeoSetting::class, 'permission' => 'seo_settings', 'title' => fn ($model) => $model->page_key],
            'media' => ['label' => 'Media library', 'model' => Media::class, 'permission' => 'media', 'title' => fn ($model) => $model->original_name],
            'contact_messages' => ['label' => 'Inbox messages', 'model' => ContactMessage::class, 'permission' => 'contact_messages', 'title' => fn ($model) => $model->name.' · '.$model->email],
            'locales' => ['label' => 'Locales', 'model' => Locale::class, 'permission' => 'locales', 'title' => fn ($model) => $model->name],
            'users' => ['label' => 'Users', 'model' => User::class, 'permission' => 'users', 'title' => fn ($model) => $model->name],
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $module = $request->string('module')->value();
        $items = [];
        $counts = [];

        foreach ($this->registry() as $key => $definition) {
            if (! $user->hasPermission("{$definition['permission']}.view")) {
                continue;
            }

            $query = $definition['model']::onlyTrashed();

            if (in_array(\App\Models\Concerns\HasTranslations::class, class_uses_recursive($definition['model']), true)) {
                $query->with('translations');
            }

            $records = $query->latest('deleted_at')->limit(200)->get();
            $counts[$key] = ['module' => $key, 'label' => $definition['label'], 'count' => $records->count()];

            if ($module !== '' && $module !== $key) {
                continue;
            }

            foreach ($records as $record) {
                $items[] = [
                    'id' => $record->id,
                    'module' => $key,
                    'module_label' => $definition['label'],
                    'title' => (string) ($definition['title']($record) ?? $record->id),
                    'deleted_at' => $record->deleted_at?->toIso8601String(),
                    'can_restore' => $user->hasPermission("{$definition['permission']}.restore"),
                    'can_force_delete' => $user->hasPermission("{$definition['permission']}.force_delete"),
                ];
            }
        }

        usort($items, fn ($a, $b) => strcmp((string) $b['deleted_at'], (string) $a['deleted_at']));

        return $this->respondSuccess([
            'items' => $items,
            'modules' => array_values($counts),
        ], 'Trash retrieved successfully.');
    }

    public function restore(Request $request, string $module, string $id): JsonResponse
    {
        $definition = $this->definition($module);

        if ($definition === null) {
            return $this->respondError('Unknown trash module.', 404);
        }

        if (! $request->user()->hasPermission("{$definition['permission']}.restore")) {
            return $this->respondError('You do not have permission to perform this action.', 403);
        }

        $definition['model']::onlyTrashed()->findOrFail($id)->restore();

        return $this->respondSuccess(null, 'Item restored successfully.');
    }

    public function forceDestroy(Request $request, string $module, string $id): JsonResponse
    {
        $definition = $this->definition($module);

        if ($definition === null) {
            return $this->respondError('Unknown trash module.', 404);
        }

        if (! $request->user()->hasPermission("{$definition['permission']}.force_delete")) {
            return $this->respondError('You do not have permission to perform this action.', 403);
        }

        $definition['model']::withTrashed()->findOrFail($id)->forceDelete();

        return $this->respondSuccess(null, 'Item permanently deleted successfully.');
    }

    protected function definition(string $module): ?array
    {
        return $this->registry()[$module] ?? null;
    }
}
