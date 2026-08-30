<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\AuthEvent;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\UserResource;
use App\Support\AuthActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends BaseApiController
{
    /** The authenticated user, their roles and the flat list of permission slugs. */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles');

        return $this->respondSuccess([
            'user' => new UserResource($user),
            'permissions' => $user->permissionSlugs(),
        ], 'Session retrieved successfully.');
    }

    /** Revoke the token used for the current request. */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        AuthActivityLogger::record(AuthEvent::LoggedOut, $request, $user, [
            'token_id' => $user->currentAccessToken()?->getKey(),
        ]);

        $user->currentAccessToken()?->delete();

        return $this->respondSuccess(null, 'Signed out successfully.');
    }

    /** Revoke every token belonging to the authenticated user. */
    public function destroyAll(Request $request): JsonResponse
    {
        $user = $request->user();

        $revoked = $user->tokens()->count();
        $user->tokens()->delete();

        AuthActivityLogger::record(AuthEvent::LoggedOutEverywhere, $request, $user, [
            'revoked_tokens' => $revoked,
        ]);

        return $this->respondSuccess(
            ['revoked_tokens' => $revoked],
            'Signed out from all devices successfully.'
        );
    }
}
