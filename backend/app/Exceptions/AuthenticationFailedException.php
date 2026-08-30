<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Authentication failure that already carries its own HTTP status and payload.
 */
class AuthenticationFailedException extends \RuntimeException
{
    public function __construct(
        string $message,
        protected int $status = 401,
        protected array $context = [],
    ) {
        parent::__construct($message);
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function context(): array
    {
        return $this->context;
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json(array_filter([
            'success' => false,
            'message' => $this->getMessage(),
            'data' => $this->context !== [] ? $this->context : null,
        ], fn ($value) => $value !== null), $this->status);
    }
}
