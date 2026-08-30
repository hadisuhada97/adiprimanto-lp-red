<?php

namespace App\Http\Controllers\Api\V1\PublicApi;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\AboutSectionResource;
use App\Http\Resources\AboutStatResource;
use App\Http\Resources\FaqCategoryResource;
use App\Http\Resources\FaqResource;
use App\Http\Resources\HeroMetricResource;
use App\Http\Resources\HeroSectionResource;
use App\Http\Resources\ServiceResource;
use App\Http\Resources\ServiceStatResource;
use App\Http\Resources\TestimonialResource;
use App\Models\AboutSection;
use App\Models\AboutStat;
use App\Models\Faq;
use App\Models\FaqCategory;
use App\Models\HeroMetric;
use App\Models\HeroSection;
use App\Models\Locale;
use App\Models\Media;
use App\Models\Service;
use App\Models\ServiceStat;
use App\Models\Setting;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicContentController extends BaseApiController
{
    public function testimonials(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        $testimonials = Testimonial::query()
            ->active()
            ->with(['translations', 'avatar', 'screenshot'])
            ->ordered()
            ->get();

        return $this->respondSuccess(
            TestimonialResource::collection($testimonials),
            'Testimonials retrieved successfully.'
        );
    }

    public function services(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        $services = Service::query()->active()->with('translations')->ordered()->get();
        $stats = ServiceStat::query()->active()->with('translations')->ordered()->get();

        return $this->respondSuccess([
            'services' => ServiceResource::collection($services),
            'stats' => ServiceStatResource::collection($stats),
        ], 'Services retrieved successfully.');
    }

    public function hero(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        $hero = HeroSection::query()->with(['translations', 'profile', 'cv'])->first();
        $metrics = HeroMetric::query()->active()->with('translations')->ordered()->get();

        return $this->respondSuccess([
            'hero' => $hero === null ? null : new HeroSectionResource($hero),
            'metrics' => HeroMetricResource::collection($metrics),
        ], 'Hero section retrieved successfully.');
    }

    public function about(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        $about = AboutSection::query()->with(['translations', 'photo'])->first();
        $stats = AboutStat::query()->active()->with('translations')->ordered()->get();

        return $this->respondSuccess([
            'about' => $about === null ? null : new AboutSectionResource($about),
            'stats' => AboutStatResource::collection($stats),
        ], 'About section retrieved successfully.');
    }

    public function faqs(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        $faqs = Faq::query()
            ->active()
            ->with(['translations', 'category.translations'])
            ->ordered()
            ->get();

        $categories = FaqCategory::query()->active()->with('translations')->ordered()->get();

        return $this->respondSuccess([
            'categories' => FaqCategoryResource::collection($categories),
            'faqs' => FaqResource::collection($faqs),
        ], 'FAQs retrieved successfully.');
    }

    public function settings(Request $request): JsonResponse
    {
        $settings = Setting::query()->where('is_public', true)->get();

        $mediaUrls = Media::query()
            ->whereIn('id', $settings->where('type', 'media')->pluck('value')->filter()->all())
            ->get()
            ->mapWithKeys(fn (Media $medium) => [$medium->id => $medium->url]);

        $values = $settings->groupBy('group')->map(
            fn ($group) => $group->mapWithKeys(fn (Setting $setting) => [
                $setting->key => $setting->type === 'media'
                    ? ($mediaUrls[$setting->value] ?? null)
                    : $setting->value,
            ])
        );

        return $this->respondSuccess($values, 'Settings retrieved successfully.');
    }

    protected function resolveLocale(Request $request): string
    {
        $locale = $request->query('locale', $request->header('Accept-Language'));

        return in_array($locale, ['id', 'en'], true) ? $locale : Locale::defaultCode();
    }
}
