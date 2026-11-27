import {
  Danger,
  DirectInbox,
  Eye,
  EyeSlash,
  InfoCircle,
  SecuritySafe,
} from 'iconsax-react';
import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import userAuth from '../hooks/userAuth';

type AuthMode = 'signin' | 'signup' | 'reset';

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

const getInputClasses = (hasError: boolean, hasToggle: boolean) =>
  `w-full min-w-0 rounded-lg border px-4 py-3 text-sm text-dark outline-none transition placeholder:text-gray-500 focus:ring-2 ${
    hasToggle ? 'pr-12 pl-12' : 'pl-12'
  } ${
    hasError
      ? 'border-red-500 bg-red-50/40 focus:border-red-600 focus:ring-red-200'
      : 'border-gray-300 bg-white focus:border-[#8d56f4] focus:ring-[#8d56f4]/30'
  }`;

const buttonClasses =
  'flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d56f4] focus-visible:ring-offset-2';

const actionClasses =
  'rounded font-semibold text-[#6d3bc7] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d56f4] focus-visible:ring-offset-2';

const FieldError = ({ id, message }: { id: string; message?: string }) => {
  if (!message) {
    return null;
  }

  return (
    <p
      id={id}
      className='flex items-start gap-1.5 break-words text-sm font-medium text-red-700'
    >
      <span className='sr-only'>Error: </span>
      <Danger size={16} color='#b91c1c' aria-hidden='true' />
      <span>{message}</span>
    </p>
  );
};

const LoginPage = () => {
  const {
    handleSubmit,
    register,
    reset: resetForm,
    setError,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ mode: 'onSubmit', reValidateMode: 'onChange' });
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    signIn,
    signUp,
    resetPassword,
    submitting,
    error,
    notice,
    clearMessages,
  } = userAuth();

  const switchMode = (nextMode: AuthMode) => {
    clearMessages();
    resetForm();
    setShowPassword(false);
    setShowConfirmPassword(false);
    setMode(nextMode);
  };

  const onSubmit: SubmitHandler<FormData> = async ({
    email,
    password,
    confirmPassword,
  }) => {
    if (submitting) {
      return;
    }

    if (mode === 'reset') {
      await resetPassword(email);
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('password', {
          type: 'minLength',
          message: 'Use at least 6 characters.',
        });
        return;
      }

      if (password !== confirmPassword) {
        setError('confirmPassword', {
          type: 'validate',
          message: 'Passwords do not match.',
        });
        return;
      }

      await signUp(email, password);
      return;
    }

    await signIn(email, password);
  };

  const isSignIn = mode === 'signin';
  const isSignUp = mode === 'signup';
  const isReset = mode === 'reset';

  const heading = isSignIn
    ? 'Welcome back'
    : isSignUp
      ? 'Create your account'
      : 'Reset your password';
  const supportingText = isSignIn
    ? 'Sign in to explore your favourite movies.'
    : isSignUp
      ? 'Discover movies and explore new favourites.'
      : 'Enter your email to receive a password reset link.';
  const submitLabel = isSignIn
    ? 'Sign in'
    : isSignUp
      ? 'Create account'
      : 'Send reset link';
  const busyLabel = isSignIn
    ? 'Signing in…'
    : isSignUp
      ? 'Creating account…'
      : 'Sending link…';

  return (
    <div className='grid min-h-screen place-items-center bg-gradient-to-r from-[#ea4996] to-[#8d56f4] px-4 py-10'>
      <div className='w-full max-w-md'>
        <h1 className='mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-2xl font-bold text-transparent'>
          Mavies
        </h1>

        <form
          noValidate
          aria-busy={submitting}
          onSubmit={handleSubmit(onSubmit)}
          className='w-full space-y-6 rounded-2xl bg-white p-6 text-dark shadow-xl sm:p-8'
        >
          <div className='space-y-2 text-center'>
            <h2 className='text-2xl font-bold'>{heading}</h2>
            <p className='text-sm text-gray-600'>{supportingText}</p>
          </div>

          {error && (
            <div
              role='alert'
              className='flex items-start gap-2 break-words rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800'
            >
              <span className='sr-only'>Error: </span>
              <Danger size={18} color='#b91c1c' aria-hidden='true' />
              <span>{error}</span>
            </div>
          )}

          {notice && !error && (
            <div
              role='status'
              className='flex items-start gap-2 break-words rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-800'
            >
              <span className='sr-only'>Success: </span>
              <InfoCircle size={18} color='#166534' aria-hidden='true' />
              <span>{notice}</span>
            </div>
          )}

          <div className='space-y-2'>
            <label htmlFor='email' className='block text-sm font-semibold'>
              Email address
            </label>
            <div className='relative'>
              <span className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2'>
                <DirectInbox size='20' color='#34275d' />
              </span>
              <input
                id='email'
                type='email'
                autoComplete='email'
                placeholder='you@yours.com'
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email', {
                  required: 'Enter your email address.',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Enter a valid email address.',
                  },
                })}
                className={getInputClasses(Boolean(errors.email), false)}
              />
            </div>
            <FieldError id='email-error' message={errors.email?.message} />
          </div>

          {!isReset && (
            <div className='space-y-2'>
              <label htmlFor='password' className='block text-sm font-semibold'>
                Password
              </label>
              <div className='relative'>
                <span className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2'>
                  <SecuritySafe size='20' color='#34275d' />
                </span>
                <input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    [
                      errors.password ? 'password-error' : '',
                      isSignUp ? 'password-requirements' : '',
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                  {...register('password', {
                    required: 'Enter your password.',
                    minLength: isSignUp
                      ? { value: 6, message: 'Use at least 6 characters.' }
                      : undefined,
                  })}
                  className={getInputClasses(Boolean(errors.password), true)}
                />
                <button
                  type='button'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  aria-controls='password'
                  onClick={() => setShowPassword((visible) => !visible)}
                  className='absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d56f4]'
                >
                  {showPassword ? (
                    <EyeSlash size='20' color='#34275d' />
                  ) : (
                    <Eye size='20' color='#34275d' />
                  )}
                </button>
              </div>
              <FieldError
                id='password-error'
                message={errors.password?.message}
              />
              {isSignUp && (
                <p id='password-requirements' className='text-xs text-gray-600'>
                  Password must be at least 6 characters.
                </p>
              )}
            </div>
          )}

          {isSignUp && (
            <div className='space-y-2'>
              <label
                htmlFor='confirm-password'
                className='block text-sm font-semibold'
              >
                Confirm password
              </label>
              <div className='relative'>
                <span className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2'>
                  <SecuritySafe size='20' color='#34275d' />
                </span>
                <input
                  id='confirm-password'
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword
                      ? 'confirm-password-error'
                      : undefined
                  }
                  {...register('confirmPassword', {
                    required: 'Confirm your password.',
                    validate: (value) =>
                      value === getValues('password') ||
                      'Passwords do not match.',
                  })}
                  className={getInputClasses(
                    Boolean(errors.confirmPassword),
                    true
                  )}
                />
                <button
                  type='button'
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirmation'
                      : 'Show confirmation'
                  }
                  aria-pressed={showConfirmPassword}
                  aria-controls='confirm-password'
                  onClick={() =>
                    setShowConfirmPassword((visible) => !visible)
                  }
                  className='absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d56f4]'
                >
                  {showConfirmPassword ? (
                    <EyeSlash size='20' color='#34275d' />
                  ) : (
                    <Eye size='20' color='#34275d' />
                  )}
                </button>
              </div>
              <FieldError
                id='confirm-password-error'
                message={errors.confirmPassword?.message}
              />
            </div>
          )}

          {isSignIn && (
            <div className='text-right'>
              <button
                type='button'
                onClick={() => switchMode('reset')}
                className={actionClasses}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button type='submit' disabled={submitting} className={buttonClasses}>
            {submitting ? busyLabel : submitLabel}
          </button>

          <div className='text-center text-sm'>
            {isSignIn && (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type='button'
                  onClick={() => switchMode('signup')}
                  className={actionClasses}
                >
                  Create account
                </button>
              </p>
            )}

            {isSignUp && (
              <p>
                Already have an account?{' '}
                <button
                  type='button'
                  onClick={() => switchMode('signin')}
                  className={actionClasses}
                >
                  Sign in
                </button>
              </p>
            )}

            {isReset && (
              <button
                type='button'
                onClick={() => switchMode('signin')}
                className={actionClasses}
              >
                Back to sign in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
