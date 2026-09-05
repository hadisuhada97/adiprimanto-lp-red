<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Handles uploads, derived image variants (WebP + thumbnail) and usage tracking
 * for the media library.
 */
class MediaService
{
    public const THUMBNAIL_WIDTH = 480;

    /** Tables and columns that reference a media record. */
    public const REFERENCES = [
        'projects' => ['label' => 'Projects', 'columns' => ['cover_media_id']],
        'clients' => ['label' => 'Clients & brands', 'columns' => ['logo_media_id']],
        'hero_sections' => ['label' => 'Hero section', 'columns' => ['profile_media_id', 'cv_media_id']],
        'about_sections' => ['label' => 'About section', 'columns' => ['photo_media_id']],
        'testimonials' => ['label' => 'Testimonials', 'columns' => ['avatar_media_id', 'screenshot_media_id']],
        'seo_settings' => ['label' => 'SEO settings', 'columns' => ['og_image_media_id']],
    ];

    public function store(UploadedFile $file, ?string $folderId, ?string $altText): Media
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $fileName = Str::uuid7()->toString().'.'.$extension;
        $path = $file->storeAs('media/'.now()->format('Y/m'), $fileName, 'public');
        $dimensions = @getimagesize($file->getRealPath());

        $media = Media::query()->create([
            'disk' => 'public',
            'folder_id' => $folderId,
            'path' => $path,
            'file_name' => $fileName,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'extension' => $extension,
            'size' => $file->getSize(),
            'width' => $dimensions[0] ?? null,
            'height' => $dimensions[1] ?? null,
            'alt_text' => $altText,
        ]);

        $this->generateVariants($media);

        return $media->refresh();
    }

    /** Creates a full-size WebP copy and a WebP thumbnail for raster images. */
    public function generateVariants(Media $media): void
    {
        if (! str_starts_with($media->mime_type, 'image/') || $media->extension === 'svg') {
            return;
        }

        $disk = Storage::disk($media->disk);
        $absolute = $disk->path($media->path);

        try {
            $source = @imagecreatefromstring((string) file_get_contents($absolute));

            if ($source === false) {
                return;
            }

            imagepalettetotruecolor($source);

            $base = preg_replace('/\.[^.]+$/', '', $media->path);
            $variants = [];

            $webpPath = $base.'.webp';
            if (imagewebp($source, $disk->path($webpPath), 82)) {
                $variants['webp'] = $webpPath;
            }

            $width = imagesx($source);
            if ($width > self::THUMBNAIL_WIDTH) {
                $thumbnail = imagescale($source, self::THUMBNAIL_WIDTH);

                if ($thumbnail !== false) {
                    $thumbnailPath = $base.'_thumb.webp';

                    if (imagewebp($thumbnail, $disk->path($thumbnailPath), 78)) {
                        $variants['thumbnail'] = $thumbnailPath;
                    }

                    imagedestroy($thumbnail);
                }
            } else {
                $variants['thumbnail'] = $variants['webp'] ?? $media->path;
            }

            imagedestroy($source);

            $media->forceFill(['variants' => $variants])->saveQuietly();
        } catch (\Throwable $exception) {
            Log::warning('Media variant generation failed.', [
                'media_id' => $media->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * Where a media record is currently referenced.
     *
     * @return array<int, array{module: string, label: string, count: int}>
     */
    public function usage(Media $media): array
    {
        $usage = [];

        foreach (self::REFERENCES as $table => $definition) {
            $query = DB::table($table)->whereNull('deleted_at');

            $query->where(function ($builder) use ($definition, $media) {
                foreach ($definition['columns'] as $column) {
                    $builder->orWhere($column, $media->id);
                }
            });

            $count = (int) $query->count();

            if ($count > 0) {
                $usage[] = ['module' => $table, 'label' => $definition['label'], 'count' => $count];
            }
        }

        $settings = (int) DB::table('settings')
            ->where('type', 'media')
            ->where('value', 'like', '%'.$media->id.'%')
            ->count();

        if ($settings > 0) {
            $usage[] = ['module' => 'settings', 'label' => 'Site settings', 'count' => $settings];
        }

        return $usage;
    }

    public function usageCount(Media $media): int
    {
        return array_sum(array_column($this->usage($media), 'count'));
    }
}
