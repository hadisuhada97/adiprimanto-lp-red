<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\AboutSectionRequest;
use App\Http\Resources\AboutSectionResource;
use App\Models\AboutSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AboutSectionController extends BaseApiController
{
    protected array $relations = ['translations', 'photo'];

    public function show(): JsonResponse
    {
        return $this->respondSuccess(
            new AboutSectionResource(AboutSection::singleton()->load($this->relations)),
            'About section retrieved successfully.'
        );
    }

    public function update(AboutSectionRequest $request): JsonResponse
    {
        $about = AboutSection::singleton();

        DB::transaction(function () use ($request, $about) {
            $about->update($request->sectionAttributes());

            if ($request->has('translations')) {
                $about->syncTranslations($request->translations());
            }
        });

        return $this->respondSuccess(
            new AboutSectionResource($about->fresh($this->relations)),
            'About section saved successfully.'
        );
    }
}
