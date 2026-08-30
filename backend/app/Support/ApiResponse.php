<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\AbstractPaginator;

class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'Request processed successfully.', int $status = 200, array $meta = []): JsonResponse
    {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => self::normalize($data, $meta),
        ];

        if ($meta !== []) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $status);
    }

    public static function created(mixed $data = null, string $message = 'Resource created successfully.'): JsonResponse
    {
        return self::success($data, $message, 201);
    }

    public static function error(string $message = 'Something went wrong.', int $status = 400, array $errors = []): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== []) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }

    public static function paginated(AbstractPaginator|ResourceCollection $paginator, string $message = 'Request processed successfully.'): JsonResponse
    {
        $resolved = $paginator instanceof ResourceCollection
            ? $paginator->resource
            : $paginator;

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $paginator instanceof ResourceCollection
                ? $paginator->collection
                : $resolved->items(),
            'meta' => [
                'current_page' => $resolved->currentPage(),
                'per_page' => $resolved->perPage(),
                'total' => $resolved->total(),
                'last_page' => $resolved->lastPage(),
                'from' => $resolved->firstItem(),
                'to' => $resolved->lastItem(),
            ],
        ]);
    }

    protected static function normalize(mixed $data, array &$meta): mixed
    {
        if ($data instanceof AbstractPaginator) {
            $meta = [
                'current_page' => $data->currentPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
                'last_page' => $data->lastPage(),
            ];

            return $data->items();
        }

        return $data;
    }
}
