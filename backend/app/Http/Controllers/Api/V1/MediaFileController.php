<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Streams files from the public disk. The platform ingress only forwards `/api/*`
 * to this service, so uploaded media cannot be served from `/storage` directly.
 */
class MediaFileController extends BaseApiController
{
    public function show(Request $request, string $path): BinaryFileResponse
    {
        $disk = Storage::disk('public');

        if (str_contains($path, '..') || ! $disk->exists($path)) {
            throw new NotFoundHttpException('File not found.');
        }

        return response()->file($disk->path($path), [
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
