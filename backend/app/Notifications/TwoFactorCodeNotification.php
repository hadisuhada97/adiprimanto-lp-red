<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TwoFactorCodeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected string $code,
        protected ?string $ipAddress = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $minutes = (int) ceil((int) config('two_factor.code_ttl') / 60);

        return (new MailMessage)
            ->subject('Your '.config('app.name').' verification code')
            ->greeting("Hello {$notifiable->name},")
            ->line('Use the verification code below to finish signing in to the admin panel.')
            ->line('**'.$this->code.'**')
            ->line("This code expires in {$minutes} minutes and can only be used once.")
            ->line($this->ipAddress !== null
                ? "Requested from IP address {$this->ipAddress}."
                : 'Requested from an unknown IP address.')
            ->line('If you did not try to sign in, change your password immediately.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'channel' => 'email',
            'ip_address' => $this->ipAddress,
        ];
    }
}
