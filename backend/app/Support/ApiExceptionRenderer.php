<?php

namespace App\Support;

use App\Exceptions\AuthenticationFailedException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class ApiExceptionRenderer
{
    public static function render(Throwable $e, Request $request): ?JsonResponse
    {
        if (! $request->is('api/*') && ! $request->expectsJson()) {
            return null;
        }

        // Laravel already carries a prepared response on these; let the framework use it.
        if ($e instanceof HttpResponseException) {
            return null;
        }

        return match (true) {
            $e instanceof AuthenticationFailedException => $e->render($request),
            $e instanceof ValidationException => ApiResponse::error(
                $request->query('locale') === 'id'
                    ? 'Data yang dikirim tidak valid.'
                    : 'The given data was invalid.',
                422,
                $e->errors()
            ),
            $e instanceof AuthenticationException => ApiResponse::error('Unauthenticated.', 401),
            $e instanceof AuthorizationException => ApiResponse::error(
                $e->getMessage() !== '' ? $e->getMessage() : 'This action is unauthorized.',
                403
            ),
            $e instanceof ModelNotFoundException, $e instanceof NotFoundHttpException => ApiResponse::error(
                'The requested resource was not found.',
                404
            ),
            $e instanceof HttpExceptionInterface => ApiResponse::error(
                $e->getMessage() !== '' ? $e->getMessage() : 'Request could not be processed.',
                $e->getStatusCode()
            ),
            default => ApiResponse::error(
                config('app.debug') ? $e->getMessage() : 'Internal server error.',
                500,
                config('app.debug') ? ['exception' => class_basename($e), 'file' => $e->getFile().':'.$e->getLine()] : []
            ),
        };
    }
}
