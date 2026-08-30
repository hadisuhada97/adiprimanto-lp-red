<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\AbstractPaginator;

abstract class BaseApiController extends Controller
{
    protected function respondSuccess(mixed $data = null, string $message = 'Request processed successfully.', int $status = 200): JsonResponse
    {
        return ApiResponse::success($data, $message, $status);
    }

    protected function respondCreated(mixed $data = null, string $message = 'Resource created successfully.'): JsonResponse
    {
        return ApiResponse::created($data, $message);
    }

    protected function respondError(string $message, int $status = 400, array $errors = []): JsonResponse
    {
        return ApiResponse::error($message, $status, $errors);
    }

    protected function respondPaginated(AbstractPaginator|ResourceCollection $paginator, string $message = 'Request processed successfully.'): JsonResponse
    {
        return ApiResponse::paginated($paginator, $message);
    }

    protected function perPage(int $default = 15, int $max = 100): int
    {
        return min((int) request()->integer('per_page', $default) ?: $default, $max);
    }
}
