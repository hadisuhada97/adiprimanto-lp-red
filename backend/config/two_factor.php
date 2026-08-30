<?php

return [

    'code_length' => (int) env('TWO_FACTOR_CODE_LENGTH', 6),

    'code_ttl' => (int) env('TWO_FACTOR_CODE_TTL', 600),

    'max_attempts' => (int) env('TWO_FACTOR_MAX_ATTEMPTS', 5),

    'resend_limit' => (int) env('TWO_FACTOR_RESEND_LIMIT', 3),

    'resend_cooldown_seconds' => 60,

    'login' => [
        'max_attempts' => (int) env('LOGIN_MAX_ATTEMPTS', 5),
        'lockout_minutes' => (int) env('LOGIN_LOCKOUT_MINUTES', 15),
    ],

];
