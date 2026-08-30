<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Auth\ResendTwoFactorCodeRequest;
use App\Http\Requests\Auth\VerifyTwoFactorCodeRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthenticationService;
use App\Services\TwoFactorService;
use Illuminate\Http\JsonResponse;

class TwoFactorController extends BaseApiController
{
    public function __construct(
        protected TwoFactorService $twoFactorService,
        protected AuthenticationService $authenticationService,
    ) {}

    /** Step 2 of the sign-in flow: exchange a valid OTP for an access token. */
    public function verify(VerifyTwoFactorCodeRequest $request): JsonResponse
    {
        $user = $this->twoFactorService->verifyChallenge(
            $request->string('challenge_token')->value(),
            $request->string('code')->value(),
            $request
        );

        $token = $this->authenticationService->issueAccessToken($user, $request->deviceName(), $request);

        return $this->respondSuccess([
            ...$token,
            'user' => new UserResource($user->load('roles')),
            'permissions' => $user->permissionSlugs(),
        ], 'Signed in successfully.');
    }

    /** Send a new code for the same challenge. */
    public function resend(ResendTwoFactorCodeRequest $request): JsonResponse
    {
        $challenge = $this->twoFactorService->resendChallenge(
            $request->string('challenge_token')->value(),
            $request
        );

        return $this->respondSuccess($challenge, 'A new verification code has been sent to your email address.');
    }
}
