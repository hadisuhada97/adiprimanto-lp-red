<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Admin\AdminUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->with('roles')
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%'.$request->string('search').'%';

                $query->where(fn ($inner) => $inner->where('name', 'like', $term)->orWhere('email', 'like', $term));
            })
            ->orderBy('name')
            ->get();

        return $this->respondSuccess(UserResource::collection($users), 'Users retrieved successfully.');
    }

    public function store(AdminUserRequest $request): JsonResponse
    {
        $data = $request->safe()->all();

        $user = DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'is_active' => $data['is_active'] ?? true,
                'is_two_factor_enabled' => $data['is_two_factor_enabled'] ?? true,
                'email_verified_at' => now(),
            ]);

            $user->roles()->sync($data['role_ids']);

            return $user;
        });

        return $this->respondCreated(
            new UserResource($user->load('roles')),
            'User created successfully.'
        );
    }

    public function update(AdminUserRequest $request, string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);
        $data = $request->safe()->all();

        DB::transaction(function () use ($user, $data) {
            $attributes = collect($data)
                ->only(['name', 'email', 'is_active', 'is_two_factor_enabled'])
                ->all();

            $passwordChanged = filled($data['password'] ?? null);

            if ($passwordChanged) {
                $attributes['password'] = Hash::make($data['password']);
            }

            $user->update($attributes);

            if (isset($data['role_ids'])) {
                $user->roles()->sync($data['role_ids']);
            }

            // A new password or a deactivated account must invalidate every existing session.
            if ($passwordChanged || ($data['is_active'] ?? true) === false) {
                $user->tokens()->delete();
            }
        });

        return $this->respondSuccess(
            new UserResource($user->fresh('roles')),
            'User updated successfully.'
        );
    }

    public function toggleActive(Request $request, string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        if ($user->id === $request->user()->id) {
            return $this->respondError('You cannot deactivate your own account.', 422);
        }

        $user->update(['is_active' => ! $user->is_active]);

        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        return $this->respondSuccess(
            ['is_active' => $user->is_active],
            $user->is_active ? 'User activated successfully.' : 'User deactivated successfully.'
        );
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        if ($user->id === $request->user()->id) {
            return $this->respondError('You cannot delete your own account.', 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return $this->respondSuccess(null, 'User moved to trash successfully.');
    }

    public function restore(string $id): JsonResponse
    {
        User::onlyTrashed()->findOrFail($id)->restore();

        return $this->respondSuccess(null, 'User restored successfully.');
    }
}
