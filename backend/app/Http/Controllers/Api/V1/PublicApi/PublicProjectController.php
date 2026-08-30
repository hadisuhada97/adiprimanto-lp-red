<?php

namespace App\Http\Controllers\Api\V1\PublicApi;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\ProjectCategoryResource;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Models\ProjectCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicProjectController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        $projects = Project::query()
            ->published()
            ->with(['translations', 'category.translations', 'cover', 'technologies'])
            ->when($request->filled('category'), fn ($query) => $query->whereHas(
                'category',
                fn ($inner) => $inner->where('slug', $request->string('category'))
            ))
            ->ordered('desc')
            ->paginate($this->perPage(12));

        return $this->respondPaginated(ProjectResource::collection($projects), 'Projects retrieved successfully.');
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        $project = Project::query()
            ->published()
            ->with(['translations', 'category.translations', 'cover', 'technologies'])
            ->where('slug', $slug)
            ->firstOrFail();

        return $this->respondSuccess(new ProjectResource($project), 'Project retrieved successfully.');
    }

    public function categories(Request $request): JsonResponse
    {
        app()->setLocale($this->resolveLocale($request));

        $categories = ProjectCategory::query()
            ->active()
            ->with('translations')
            ->withCount(['projects' => fn ($query) => $query->published()])
            ->ordered()
            ->get();

        return $this->respondSuccess(
            ProjectCategoryResource::collection($categories),
            'Project categories retrieved successfully.'
        );
    }

    protected function resolveLocale(Request $request): string
    {
        $locale = $request->query('locale', $request->header('Accept-Language'));

        return in_array($locale, ['id', 'en'], true) ? $locale : config('app.fallback_locale');
    }
}
