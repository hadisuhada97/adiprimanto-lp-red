<?php

namespace App\Notifications;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewContactMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public ContactMessage $message)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('New lead: '.($this->message->subject ?? $this->message->name))
            ->greeting('New message from the website')
            ->line('Name: '.$this->message->name)
            ->line('Email: '.$this->message->email)
            ->line('Phone: '.($this->message->phone ?? '—'))
            ->line('Subject: '.($this->message->subject ?? '—'))
            ->line('---')
            ->line($this->message->message)
            ->line('Received at '.$this->message->created_at?->toDayDateTimeString());
    }
}
