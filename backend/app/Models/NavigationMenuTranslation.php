<?php

namespace App\Models;

class NavigationMenuTranslation extends BaseTranslationModel
{
    public function revalidationTags(): array
    {
        return ['navigation', 'landing'];
    }
    //
}
