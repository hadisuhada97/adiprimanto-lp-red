<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\LocaleRequest;
use App\Http\Requests\Admin\ReorderRequest;
use App\Http\Resources\LocaleResource;
use App\Models\AboutSection;
use App\Models\AboutStat;
use App\Models\Client;
use App\Models\ContactChannel;
use App\Models\Faq;
use App\Models\FaqCategory;
use App\Models\HeroMetric;
use App\Models\HeroSection;
use App\Models\Locale;
use App\Models\NavigationMenu;
use App\Models\PainPoint;
use App\Models\ProcessStep;
use App\Models\Project;
use App\Models\ProjectCategory;
use App\Models\SeoSetting;
use App\Models\Service;
use App\Models\ServiceStat;
use App\Models\SkillCategory;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LocaleController extends BaseApiController
{
    /** Translatable modules reported on the localization page. */
    protected const TRANSLATABLE = [
        'Hero section' => HeroSection::class,
        'Hero metrics' => HeroMetric::class,
        'About section' => AboutSection::class,
        'About stats' => AboutStat::class,
        'Skill categories' => SkillCategory::class,
        'Pain points' => PainPoint::class,
        'Services' => Service::class,
        'Service stats' => ServiceStat::class,
        'Projects' => Project::class,
        'Project categories' => ProjectCategory::class,
        'Process steps' => ProcessStep::class,
        'Testimonials' => Testimonial::class,
        'FAQ questions' => Faq::class,
        'FAQ categories' => FaqCategory::class,
        'Clients' => Client::class,
        'Navigation menu' => NavigationMenu::class,
        'Contact channels' => ContactChannel::class,
        'SEO settings' => SeoSetting::class,
    ];

    public function index(Request $request): JsonResponse
    {
        $locales = Locale::query()
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->ordered()
            ->get();

        return $this->respondSuccess(
            LocaleResource::collection($locales),
            'Locale list retrieved successfully.'
        );
    }

    public function store(LocaleRequest $request): JsonResponse
    {
        $locale = DB::transaction(function () use ($request) {
            $locale = Locale::query()->create($request->validated());

            if ($locale->is_default) {
                $this->clearOtherDefaults($locale);
            }

            return $locale;
        });

        return $this->respondCreated(new LocaleResource($locale), 'Locale created successfully.');
    }

    public function update(LocaleRequest $request, string $id): JsonResponse
    {
        $locale = Locale::query()->findOrFail($id);

        DB::transaction(function () use ($request, $locale) {
            $locale->update($request->validated());

            if ($locale->is_default) {
                $this->clearOtherDefaults($locale);
            }
        });

        return $this->respondSuccess(new LocaleResource($locale->refresh()), 'Locale updated successfully.');
    }

    public function setDefault(string $id): JsonResponse
    {
        $locale = Locale::query()->findOrFail($id);

        DB::transaction(function () use ($locale) {
            $locale->update(['is_default' => true, 'is_active' => true]);
            $this->clearOtherDefaults($locale);
        });

        return $this->respondSuccess(
            new LocaleResource($locale->refresh()),
            "“{$locale->name}” is now the default locale."
        );
    }

    public function toggleActive(string $id): JsonResponse
    {
        $locale = Locale::query()->findOrFail($id);

        if ($locale->is_default && $locale->is_active) {
            return $this->respondError('The default locale cannot be deactivated.', 422);
        }

        $locale->update(['is_active' => ! $locale->is_active]);

        return $this->respondSuccess(
            ['is_active' => $locale->is_active],
            $locale->is_active ? 'Locale activated successfully.' : 'Locale deactivated successfully.'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        $locale = Locale::query()->findOrFail($id);

        if ($locale->is_default) {
            return $this->respondError('The default locale cannot be deleted.', 422);
        }

        $locale->delete();

        return $this->respondSuccess(null, 'Locale moved to trash successfully.');
    }

    public function restore(string $id): JsonResponse
    {
        Locale::onlyTrashed()->findOrFail($id)->restore();

        return $this->respondSuccess(null, 'Locale restored successfully.');
    }

    public function forceDestroy(string $id): JsonResponse
    {
        $locale = Locale::withTrashed()->findOrFail($id);

        if ($locale->is_default) {
            return $this->respondError('The default locale cannot be deleted.', 422);
        }

        $locale->forceDelete();

        $this->purgeTranslations($locale->code);

        return $this->respondSuccess(null, 'Locale permanently deleted successfully.');
    }

    public function reorder(ReorderRequest $request): JsonResponse
    {
        Locale::applyOrder($request->items());

        return $this->respondSuccess(null, 'Locale order updated successfully.');
    }

    /** Translation coverage per module and locale. */
    public function completeness(): JsonResponse
    {
        $codes = Locale::query()->active()->ordered()->pluck('code')->all();
        $modules = [];

        foreach (self::TRANSLATABLE as $label => $model) {
            $total = $model::query()->count();
            $translated = [];

            foreach ($codes as $code) {
                $translated[$code] = $model::query()
                    ->whereHas('translations', fn ($query) => $query->where('locale', $code))
                    ->count();
            }

            $modules[] = [
                'module' => $label,
                'total' => $total,
                'translated' => $translated,
            ];
        }

        return $this->respondSuccess([
            'locales' => $codes,
            'modules' => $modules,
        ], 'Translation coverage retrieved successfully.');
    }

    protected function clearOtherDefaults(Locale $locale): void
    {
        Locale::query()->whereKeyNot($locale->id)->where('is_default', true)->update(['is_default' => false]);
    }

    /** Removes orphan translation rows left behind by a purged locale. */
    protected function purgeTranslations(string $code): void
    {
        foreach (DB::select('show tables like ?', ['%_translations']) as $row) {
            $table = array_values((array) $row)[0];
            DB::table($table)->where('locale', $code)->delete();
        }
    }
}
