<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Collects cache tags touched during a request and notifies the Next.js
 * on-demand revalidation endpoint once, after the response is sent.
 */
class RevalidateFrontend
{
    /** @var array<int, string> */
    protected static array $tags = [];

    protected static bool $registered = false;

    /**
     * @param  array<int, string>  $tags
     */
    public static function queue(array $tags): void
    {
        if ($tags === [] || ! config('frontend.revalidate_url')) {
            return;
        }

        static::$tags = array_values(array_unique([...static::$tags, ...$tags]));

        if (! static::$registered) {
            static::$registered = true;
            app()->terminating(fn () => static::flush());
        }
    }

    public static function flush(): void
    {
        $tags = static::$tags;
        static::$tags = [];
        static::$registered = false;

        if ($tags === []) {
            return;
        }

        try {
            $response = Http::withHeaders([
                'X-Revalidate-Secret' => (string) config('frontend.revalidate_secret'),
            ])->timeout(5)->post((string) config('frontend.revalidate_url'), ['tags' => $tags]);

            if ($response->failed()) {
                Log::warning('Frontend revalidation rejected.', [
                    'tags' => $tags,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $exception) {
            Log::warning('Frontend revalidation failed.', [
                'tags' => $tags,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
