<?php

namespace App\Console\Commands;

use App\Support\ContentSnapshot;
use Illuminate\Console\Command;

class ExportContentSnapshot extends Command
{
    protected $signature = 'content:export-snapshot {--file=database/data/legacy-content.json}';

    protected $description = 'Write every content module to a portable JSON snapshot.';

    public function handle(): int
    {
        $path = base_path($this->option('file'));

        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0775, true);
        }

        $snapshot = ContentSnapshot::export();

        file_put_contents(
            $path,
            json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n"
        );

        $this->table(
            ['Module', 'Records'],
            collect($snapshot)->map(fn (array $records, string $module) => [$module, count($records)])->values()
        );

        $this->info("Snapshot written to {$path}");

        return self::SUCCESS;
    }
}
