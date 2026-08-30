<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TwoFactorCode extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = ['id'];

    protected $hidden = ['code_hash'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
            'last_sent_at' => 'datetime',
            'attempts' => 'integer',
            'resend_count' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function generateCode(): string
    {
        $length = (int) config('two_factor.code_length');

        return str_pad((string) random_int(0, (10 ** $length) - 1), $length, '0', STR_PAD_LEFT);
    }

    /**
     * Invalidate any pending challenge and issue a fresh one.
     *
     * @return array{0: self, 1: string} the record and the plain code
     */
    public static function issueFor(User $user, ?string $ipAddress = null, string $channel = 'email'): array
    {
        $user->twoFactorCodes()->whereNull('consumed_at')->delete();

        $code = self::generateCode();

        $record = self::query()->create([
            'user_id' => $user->id,
            'challenge_token' => Str::random(64),
            'code_hash' => Hash::make($code),
            'channel' => $channel,
            'expires_at' => Carbon::now()->addSeconds((int) config('two_factor.code_ttl')),
            'last_sent_at' => Carbon::now(),
            'attempts' => 0,
            'resend_count' => 0,
            'ip_address' => $ipAddress,
        ]);

        return [$record, $code];
    }

    /** Replace the code on an existing challenge, keeping the challenge token stable. */
    public function rotateCode(): string
    {
        $code = self::generateCode();

        $this->forceFill([
            'code_hash' => Hash::make($code),
            'expires_at' => Carbon::now()->addSeconds((int) config('two_factor.code_ttl')),
            'last_sent_at' => Carbon::now(),
            'attempts' => 0,
            'resend_count' => $this->resend_count + 1,
        ])->save();

        return $code;
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isConsumed(): bool
    {
        return $this->consumed_at !== null;
    }

    public function hasExceededAttempts(): bool
    {
        return $this->attempts >= (int) config('two_factor.max_attempts');
    }

    public function hasExceededResendLimit(): bool
    {
        return $this->resend_count >= (int) config('two_factor.resend_limit');
    }

    public function secondsUntilResendAllowed(): int
    {
        if ($this->last_sent_at === null) {
            return 0;
        }

        $allowedAt = $this->last_sent_at->addSeconds((int) config('two_factor.resend_cooldown_seconds'));

        return (int) max(0, Carbon::now()->diffInSeconds($allowedAt, false));
    }

    public function remainingAttempts(): int
    {
        return max(0, (int) config('two_factor.max_attempts') - $this->attempts);
    }

    public function matches(string $code): bool
    {
        return Hash::check($code, $this->code_hash);
    }

    public function registerFailedAttempt(): void
    {
        $this->forceFill(['attempts' => $this->attempts + 1])->save();
    }

    public function markConsumed(): void
    {
        $this->forceFill(['consumed_at' => Carbon::now()])->save();
    }
}
