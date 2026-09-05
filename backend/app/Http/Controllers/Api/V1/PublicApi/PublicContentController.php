<?php

namespace App\Http\Controllers\Api\V1\PublicApi;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\AboutSectionResource;
use App\Http\Resources\AboutStatResource;
use App\Http\Resources\ClientResource;
use App\Http\Resources\ContactChannelResource;
use App\Http\Resources\FaqCategoryResource;
use App\Http\Resources\FaqResource;
use App\Http\Resources\HeroMetricResource;
use App\Http\Resources\HeroSectionResource;
use App\Http\Resources\NavigationMenuResource;
use App\Http\Resources\PainPointResource;
use App\Http\Resources\ProcessStepResource;
use App\Http\Resources\SeoSettingResource;
use App\Http\Resources\ServiceResource;
use App\Http\Resources\ServiceStatResource;
use App\Http\Resources\SkillCategoryResource;
use App\Http\Resources\SocialLinkResource;
use App\Http\Resources\TestimonialResource;
use App\Models\AboutSection;
use App\Models\AboutStat;
use App\Models\Client;
use App\Models\ContactChannel;
use App\Models\Faq;
use App\Models\FaqCategory;
use App\Models\HeroMetric;
use App\Models\HeroSection;
use App\Models\Locale;
use App\Models\Media;
use App\Models\NavigationMenu;
use App\Models\PainPoint;
use App\Models\ProcessStep;
use App\Models\SeoSetting;
use App\Models\SkillCategory;
use App\Models\SocialLink;
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

    public function skills(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        $categories = SkillCategory::query()
            ->active()
            ->with(['translations', 'skills' => fn ($query) => $query->active()->ordered()])
            ->ordered()
            ->get();

        return $this->respondSuccess(
            SkillCategoryResource::collection($categories),
            'Skills retrieved successfully.'
        );
    }

    public function painPoints(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        return $this->respondSuccess(
            PainPointResource::collection(
                PainPoint::query()->active()->with('translations')->ordered()->get()
            ),
            'Pain points retrieved successfully.'
        );
    }

    public function processSteps(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        return $this->respondSuccess(
            ProcessStepResource::collection(
                ProcessStep::query()->active()->with('translations')->ordered()->get()
            ),
            'Process steps retrieved successfully.'
        );
    }

    public function clients(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        return $this->respondSuccess(
            ClientResource::collection(
                Client::query()->active()->with(['translations', 'logo'])->ordered()->get()
            ),
            'Clients retrieved successfully.'
        );
    }

    public function navigation(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        $items = NavigationMenu::query()
            ->active()
            ->whereNull('parent_id')
            ->with(['translations', 'children' => fn ($query) => $query->active()->with('translations')->ordered()])
            ->ordered()
            ->get();

        return $this->respondSuccess([
            'header' => NavigationMenuResource::collection($items->where('location', 'header')->values()),
            'footer' => NavigationMenuResource::collection($items->where('location', 'footer')->values()),
        ], 'Navigation retrieved successfully.');
    }

    public function contact(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        return $this->respondSuccess([
            'channels' => ContactChannelResource::collection(
                ContactChannel::query()->active()->with('translations')->ordered()->get()
            ),
            'social_links' => SocialLinkResource::collection(
                SocialLink::query()->active()->ordered()->get()
            ),
        ], 'Contact information retrieved successfully.');
    }

    public function seo(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        $query = SeoSetting::query()->active()->with(['translations', 'ogImage'])->ordered();

        if ($request->filled('page_key')) {
            $entry = $query->where('page_key', $request->string('page_key'))->first();

            return $this->respondSuccess(
                $entry === null ? null : new SeoSettingResource($entry),
                'SEO entry retrieved successfully.'
            );
        }

        return $this->respondSuccess(
            SeoSettingResource::collection($query->get()),
            'SEO entries retrieved successfully.'
        );
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

    public function landing(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        $hero = HeroSection::query()->with(['translations', 'profile', 'cv'])->first();
        $about = AboutSection::query()->with(['translations', 'photo'])->first();

        $faqs = Faq::query()->active()->with(['translations', 'category.translations'])->ordered()->get();
        $faqCategories = FaqCategory::query()->active()->with('translations')->ordered()->get();

        return $this->respondSuccess([
            'hero' => [
                'hero' => $hero === null ? null : new HeroSectionResource($hero),
                'metrics' => HeroMetricResource::collection(
                    HeroMetric::query()->active()->with('translations')->ordered()->get()
                ),
            ],
            'about' => [
                'about' => $about === null ? null : new AboutSectionResource($about),
                'stats' => AboutStatResource::collection(
                    AboutStat::query()->active()->with('translations')->ordered()->get()
                ),
            ],
            'services' => [
                'services' => ServiceResource::collection(
                    Service::query()->active()->with('translations')->ordered()->get()
                ),
                'stats' => ServiceStatResource::collection(
                    ServiceStat::query()->active()->with('translations')->ordered()->get()
                ),
            ],
            'testimonials' => TestimonialResource::collection(
                Testimonial::query()->active()->with(['translations', 'avatar', 'screenshot'])->ordered()->get()
            ),
            'faqs' => [
                'categories' => FaqCategoryResource::collection($faqCategories),
                'faqs' => FaqResource::collection($faqs),
            ],
            'skills' => SkillCategoryResource::collection(
                SkillCategory::query()->active()
                    ->with(['translations', 'skills' => fn ($query) => $query->active()->ordered()])
                    ->ordered()->get()
            ),
            'pain_points' => PainPointResource::collection(
                PainPoint::query()->active()->with('translations')->ordered()->get()
            ),
            'process_steps' => ProcessStepResource::collection(
                ProcessStep::query()->active()->with('translations')->ordered()->get()
            ),
            'clients' => ClientResource::collection(
                Client::query()->active()->with(['translations', 'logo'])->ordered()->get()
            ),
        ], 'Landing content retrieved successfully.');
    }

    protected function resolveLocale(Request $request): string
    {
        $locale = $request->query('locale', $request->header('Accept-Language'));

        return in_array($locale, ['id', 'en'], true) ? $locale : Locale::defaultCode();
    }
}
