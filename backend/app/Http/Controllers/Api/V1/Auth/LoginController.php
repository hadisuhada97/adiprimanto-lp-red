<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthenticationService;
use Illuminate\Http\JsonResponse;

class LoginController extends BaseApiController
{
    public function __construct(
        protected AuthenticationService $authenticationService,
    ) {}

    /**
     * Step 1 of the sign-in flow: validate credentials and start the two-factor challenge.
     * No access token is returned until the OTP has been verified.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $result = $this->authenticationService->authenticate(
            $request->string('email')->value(),
            $request->string('password')->value(),
            $request
        );

        if ($result['requires_two_factor']) {
            return $this->respondSuccess(
                $result['challenge'] + ['requires_two_factor' => true],
                'A verification code has been sent to your email address.'
            );
        }

        $user = $result['user'];
        $token = $this->authenticationService->issueAccessToken($user, $request->deviceName(), $request);

        return $this->respondSuccess([
            'requires_two_factor' => false,
            ...$token,
            'user' => new UserResource($user->load('roles')),
            'permissions' => $user->permissionSlugs(),
        ], 'Signed in successfully.');
    }
}
