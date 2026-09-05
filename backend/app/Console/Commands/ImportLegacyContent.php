<?php

namespace App\Console\Commands;

use App\Support\ContentSnapshot;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Loads the legacy landing page content (originally hard-coded in
 * `frontend/app/lib/translations.ts`) into the CMS. Idempotent by default:
 * records that already exist are skipped, so it is safe to re-run.
 */
class ImportLegacyContent extends Command
{
    protected $signature = 'content:import-legacy
        {--file=database/data/legacy-content.json : Snapshot to import}
        {--only= : Comma separated module list (e.g. faqs,services)}
        {--fresh : Overwrite content that already exists}
        {--dry-run : Report what would change without writing}';

    protected $description = 'Import the legacy landing page content into the CMS (idempotent).';

    public function handle(): int
    {
        $path = base_path($this->option('file'));

        if (! is_file($path)) {
            $this->error("Snapshot not found: {$path}");

            return self::FAILURE;
        }

        $snapshot = json_decode((string) file_get_contents($path), true);

        if (! is_array($snapshot)) {
            $this->error('Snapshot is not valid JSON.');

            return self::FAILURE;
        }

        $only = array_filter(array_map('trim', explode(',', (string) $this->option('only'))));
        $dryRun = (bool) $this->option('dry-run');
        $overwrite = (bool) $this->option('fresh');
        $rows = [];

        DB::beginTransaction();

        foreach (ContentSnapshot::MODULES as $module => $definition) {
            if ($only !== [] && ! in_array($module, $only, true)) {
                continue;
            }

            $created = 0;
            $updated = 0;
            $skipped = 0;

            foreach ($snapshot[$module] ?? [] as $entry) {
                $existing = $this->findExisting($module, $definition, $entry);

                if ($existing !== null && ! $overwrite) {
                    $skipped++;

                    continue;
                }

                $existing === null ? $created++ : $updated++;

                if (! $dryRun) {
                    $this->write($definition, $entry, $existing);
                }
            }

            $rows[] = [$module, $created, $updated, $skipped];
        }

        $dryRun ? DB::rollBack() : DB::commit();

        $this->table(['Module', 'Created', 'Updated', 'Skipped'], $rows);

        $this->info($dryRun
            ? 'Dry run finished — nothing was written.'
            : 'Legacy content import finished.');

        return self::SUCCESS;
    }

    protected function findExisting(string $module, array $definition, array $entry): ?Model
    {
        $query = $definition['model']::query();

        if ($definition['singleton'] ?? false) {
            return $query->first();
        }

        if (isset($definition['translationKey'])) {
            $attribute = $definition['translationKey'];
            $value = $entry['translations']['id'][$attribute]
                ?? $entry['translations']['en'][$attribute]
                ?? null;

            if ($value === null) {
                return null;
            }

            return $query
                ->whereHas('translations', fn ($inner) => $inner->where($attribute, $value))
                ->first();
        }

        foreach ($definition['key'] ?? [] as $column) {
            $query->where($column, $entry['attributes'][$column] ?? null);
        }

        return $query->first();
    }

    protected function write(array $definition, array $entry, ?Model $existing): void
    {
        $record = $existing ?? new $definition['model'];
        $attributes = $entry['attributes'];

        foreach ($entry['belongs'] ?? [] as $column => $value) {
            [$relatedModel, $relatedKey] = $definition['belongs'][$column];
            $attributes[$column] = $value === null
                ? null
                : $relatedModel::query()->where($relatedKey, $value)->value('id');
        }

        $record->fill($attributes)->save();

        if (isset($entry['translations']) && method_exists($record, 'syncTranslations')) {
            $record->syncTranslations($entry['translations']);
        }

        foreach ($entry['many'] ?? [] as $relation => $values) {
            [$relatedModel, $relatedKey] = $definition['many'][$relation];
            $ids = $relatedModel::query()->whereIn($relatedKey, $values)->pluck('id')->all();
            $record->{$relation}()->sync($ids);
        }
    }
}
