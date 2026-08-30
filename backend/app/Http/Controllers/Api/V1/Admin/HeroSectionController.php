<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\HeroSectionRequest;
use App\Http\Resources\HeroSectionResource;
use App\Models\HeroSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HeroSectionController extends BaseApiController
{
    protected array $relations = ['translations', 'profile', 'cv'];

    public function show(): JsonResponse
    {
        return $this->respondSuccess(
            new HeroSectionResource(HeroSection::singleton()->load($this->relations)),
            'Hero section retrieved successfully.'
        );
    }

    public function update(HeroSectionRequest $request): JsonResponse
    {
        $hero = HeroSection::singleton();

        DB::transaction(function () use ($request, $hero) {
            $hero->update($request->sectionAttributes());

            if ($request->has('translations')) {
                $hero->syncTranslations($request->translations());
            }
        });

        return $this->respondSuccess(
            new HeroSectionResource($hero->fresh($this->relations)),
            'Hero section saved successfully.'
        );
    }
}
