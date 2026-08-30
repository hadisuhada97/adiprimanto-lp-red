<?php

namespace App\Enums;

enum AuthEvent: string
{
    case LoginSucceeded = 'auth.login_succeeded';
    case LoginFailed = 'auth.login_failed';
    case AccountLocked = 'auth.account_locked';
    case AccountLockedOut = 'auth.account_locked_out';
    case TwoFactorIssued = 'auth.two_factor_issued';
    case TwoFactorResent = 'auth.two_factor_resent';
    case TwoFactorVerified = 'auth.two_factor_verified';
    case TwoFactorFailed = 'auth.two_factor_failed';
    case LoggedOut = 'auth.logged_out';
    case LoggedOutEverywhere = 'auth.logged_out_everywhere';
}
