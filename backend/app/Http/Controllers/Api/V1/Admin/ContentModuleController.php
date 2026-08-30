<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\ReorderRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Shared CRUD behaviour for the sortable, soft-deletable content modules
 * (skills, pain points, process steps, clients, navigation, contact channels, …).
 */
abstract class ContentModuleController extends BaseApiController
{
    /** @return class-string<Model> */
    abstract protected function modelClass(): string;

    abstract protected function resourceClass(): string;

    abstract protected function requestClass(): string;

    /** Eager loaded relations. */
    protected array $relations = ['translations'];

    /** Relation counts to include. */
    protected array $withCount = [];

    /** [related table, foreign key column] used to sort by the parent's own order first. */
    protected ?array $parentOrder = null;

    /** Columns applied to the ordering before the sort_order scope. */
    protected array $preOrderColumns = [];

    /** Columns on the model itself included in the search. */
    protected array $searchColumns = [];

    /** Columns on the translation model included in the search. */
    protected array $searchTranslationColumns = [];

    /** Query parameter => column, used for simple equality filters. */
    protected array $filterColumns = [];

    protected string $entityLabel = 'Record';

    public function index(Request $request): JsonResponse
    {
        $query = $this->modelClass()::query()
            ->with($this->relations)
            ->when($this->withCount !== [], fn ($builder) => $builder->withCount($this->withCount))
            ->when($request->boolean('trashed'), fn ($builder) => $builder->onlyTrashed());

        foreach ($this->filterColumns as $parameter => $column) {
            $query->when(
                $request->filled($parameter),
                fn ($builder) => $builder->where($column, $request->string($parameter))
            );
        }

        if ($request->filled('search')) {
            $term = '%'.$request->string('search').'%';

            $query->where(function ($builder) use ($term) {
                foreach ($this->searchColumns as $column) {
                    $builder->orWhere($column, 'like', $term);
                }

                if ($this->searchTranslationColumns !== []) {
                    $builder->orWhereHas('translations', function ($inner) use ($term) {
                        $inner->where(function ($group) use ($term) {
                            foreach ($this->searchTranslationColumns as $column) {
                                $group->orWhere($column, 'like', $term);
                            }
                        });
                    });
                }
            });
        }

        if ($this->parentOrder !== null) {
            [$table, $foreignKey] = $this->parentOrder;

            $query->orderBy(
                DB::table($table)
                    ->select('sort_order')
                    ->whereColumn("{$table}.id", $foreignKey)
                    ->limit(1)
            );
        }

        foreach ($this->preOrderColumns as $column) {
            $query->orderBy($column);
        }

        return $this->respondSuccess(
            $this->resourceClass()::collection($query->ordered()->get()),
            "{$this->entityLabel} list retrieved successfully."
        );
    }

    public function show(string $id): JsonResponse
    {
        $model = $this->modelClass()::query()->with($this->relations)->findOrFail($id);

        return $this->respondSuccess(
            new ($this->resourceClass())($model),
            "{$this->entityLabel} retrieved successfully."
        );
    }

    public function store(): JsonResponse
    {
        $form = app($this->requestClass());

        $model = DB::transaction(function () use ($form) {
            $model = $this->modelClass()::query()->create($form->safe()->except(['translations']));
            $this->syncTranslations($model, $form->safe()->array('translations'));

            return $model;
        });

        return $this->respondCreated(
            new ($this->resourceClass())($model->refresh()->load($this->relations)),
            "{$this->entityLabel} created successfully."
        );
    }

    public function update(string $id): JsonResponse
    {
        $form = app($this->requestClass());
        $model = $this->modelClass()::query()->findOrFail($id);

        DB::transaction(function () use ($form, $model) {
            $model->update($form->safe()->except(['translations']));

            if ($form->has('translations')) {
                $this->syncTranslations($model, $form->safe()->array('translations'));
            }
        });

        return $this->respondSuccess(
            new ($this->resourceClass())($model->fresh($this->relations)),
            "{$this->entityLabel} updated successfully."
        );
    }

    public function destroy(string $id): JsonResponse
    {
        $this->modelClass()::query()->findOrFail($id)->delete();

        return $this->respondSuccess(null, "{$this->entityLabel} moved to trash successfully.");
    }

    public function restore(string $id): JsonResponse
    {
        $this->modelClass()::onlyTrashed()->findOrFail($id)->restore();

        return $this->respondSuccess(null, "{$this->entityLabel} restored successfully.");
    }

    public function forceDestroy(string $id): JsonResponse
    {
        $this->modelClass()::withTrashed()->findOrFail($id)->forceDelete();

        return $this->respondSuccess(null, "{$this->entityLabel} permanently deleted successfully.");
    }

    public function toggleActive(string $id): JsonResponse
    {
        $model = $this->modelClass()::query()->findOrFail($id);
        $model->update(['is_active' => ! $model->is_active]);

        return $this->respondSuccess(
            ['is_active' => $model->is_active],
            $model->is_active
                ? "{$this->entityLabel} activated successfully."
                : "{$this->entityLabel} deactivated successfully."
        );
    }

    public function reorder(ReorderRequest $request): JsonResponse
    {
        $this->modelClass()::applyOrder($request->items());

        return $this->respondSuccess(null, "{$this->entityLabel} order updated successfully.");
    }

    protected function syncTranslations(Model $model, array $translations): void
    {
        if ($translations !== [] && method_exists($model, 'syncTranslations')) {
            $model->syncTranslations($translations);
        }
    }
}
