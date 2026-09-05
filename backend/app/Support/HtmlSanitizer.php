<?php

namespace App\Support;

use HTMLPurifier;
use HTMLPurifier_Config;

/**
 * Server-side allowlist sanitisation for rich text fields (FAQ answers, bio
 * paragraphs, project content). Stored XSS is the threat being closed here.
 */
class HtmlSanitizer
{
    protected static ?HTMLPurifier $purifier = null;

    public static function clean(string $html): string
    {
        if (trim($html) === '') {
            return $html;
        }

        return static::purifier()->purify($html);
    }

    protected static function purifier(): HTMLPurifier
    {
        if (static::$purifier instanceof HTMLPurifier) {
            return static::$purifier;
        }

        $cachePath = storage_path('framework/cache/purifier');

        if (! is_dir($cachePath)) {
            mkdir($cachePath, 0775, true);
        }

        $config = HTMLPurifier_Config::createDefault();
        $config->set('Cache.SerializerPath', storage_path('framework/cache/purifier'));
        $config->set('HTML.Allowed', 'p,br,strong,b,em,i,u,s,ul,ol,li,blockquote,code,pre,h2,h3,h4,span[class],a[href|title|target|rel]');
        $config->set('HTML.TargetBlank', true);
        $config->set('AutoFormat.RemoveEmpty', true);
        $config->set('URI.AllowedSchemes', ['http' => true, 'https' => true, 'mailto' => true]);

        return static::$purifier = new HTMLPurifier($config);
    }
}
