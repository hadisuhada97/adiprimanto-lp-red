<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\ContactMessageUpdateRequest;
use App\Http\Resources\ContactMessageResource;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactMessageController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $messages = ContactMessage::query()
            ->with('handler')
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%'.$request->string('search').'%';

                $query->where(fn ($inner) => $inner->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('subject', 'like', $term)
                    ->orWhere('message', 'like', $term));
            })
            ->latest('created_at')
            ->paginate($this->perPage(20));

        return $this->respondPaginated(
            ContactMessageResource::collection($messages),
            'Messages retrieved successfully.'
        )->withHeaders(['X-Unread-Count' => (string) $this->unreadCount()]);
    }

    public function summary(): JsonResponse
    {
        $counts = ContactMessage::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return $this->respondSuccess([
            'unread' => $this->unreadCount(),
            'by_status' => $counts,
            'total' => (int) $counts->sum(),
        ], 'Inbox summary retrieved successfully.');
    }

    public function show(string $id): JsonResponse
    {
        $message = ContactMessage::withTrashed()->with('handler')->findOrFail($id);

        if ($message->trashed() === false && $message->read_at === null) {
            $message->update([
                'read_at' => now(),
                'status' => $message->status === 'new' ? 'read' : $message->status,
                'handled_by' => $message->handled_by ?? auth()->id(),
            ]);
        }

        return $this->respondSuccess(
            new ContactMessageResource($message->fresh('handler')),
            'Message retrieved successfully.'
        );
    }

    public function update(ContactMessageUpdateRequest $request, string $id): JsonResponse
    {
        $message = ContactMessage::query()->findOrFail($id);
        $attributes = $request->safe()->all();

        if (($attributes['status'] ?? null) === 'replied' && $message->replied_at === null) {
            $attributes['replied_at'] = now();
        }

        $attributes['handled_by'] = auth()->id();
        $message->update($attributes);

        return $this->respondSuccess(
            new ContactMessageResource($message->fresh('handler')),
            'Message updated successfully.'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        ContactMessage::query()->findOrFail($id)->delete();

        return $this->respondSuccess(null, 'Message moved to trash successfully.');
    }

    public function restore(string $id): JsonResponse
    {
        ContactMessage::onlyTrashed()->findOrFail($id)->restore();

        return $this->respondSuccess(null, 'Message restored successfully.');
    }

    public function forceDestroy(string $id): JsonResponse
    {
        ContactMessage::withTrashed()->findOrFail($id)->forceDelete();

        return $this->respondSuccess(null, 'Message permanently deleted successfully.');
    }

    protected function unreadCount(): int
    {
        return ContactMessage::query()->whereNull('read_at')->count();
    }
}
