import { DirectInbox, SecuritySafe } from 'iconsax-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import userAuth from '../hooks/userAuth';

type FormData = {
  email: string;
  password: string;
};
const login = () => {
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm<FormData>();
  const [login, setLogin] = useState(false);
  const { signIn, signUp } = userAuth();
  const onSubmit: SubmitHandler<FormData> = async ({ email, password }) => {
    if (login) {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
  };

  return (
    <div className='h-screen'>
      <h1 className='bg-clip-text font-bold text-xl p-6 text-transparent bg-gradient-to-r from-[#ea4996] to-[#8d56f4]'>
        Mavies
      </h1>
      <div className='grid content-center place-content-center text-dark mt-10'>
        <form
          className='bg-white space-y-6 rounded-lg p-6'
          onSubmit={handleSubmit(onSubmit)}
        >
          <p className='font-bold text-lg text-center'>WELCOME</p>

          <div className='login-input'>
            <DirectInbox size='20' color='#34275d' />
            <input
              type='email'
              {...register('email', {
                required: 'Required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'invalid email address',
                },
              })}
              placeholder='you@yours.com'
              className=' outline-none placeholder:font-medium text-sm'
            />
          </div>
          <span className='text-red'>
            {errors.email && errors.email.message}
          </span>

          <div className='login-input'>
            <SecuritySafe size='20' color='#34275d' />
            <input
              type='password'
              {...register('password', {
                required: 'Password is required',
              })}
              placeholder='Your password'
              className='outline-none placeholder:font-medium text-sm'
            />
          </div>
          <span className='text-red'>
            {errors.password && errors.password.message}
          </span>
          <div className='grid place-content-end text-sm'>
            <Link href={'/'}>Forgot password?</Link>
          </div>
          <div className='grid place-content-center '>
            <button
              type='submit'
              className=' font-semibold hover:text-dark text-base rounded-2xl bg-main-background text-white hover:bg-white py-2 px-10'
              onClick={() => setLogin(true)}
            >
              Login
            </button>
          </div>
          <div className='text-xs'>
            No Account? Click here to{' '}
            <span>
              <button
                className='hover:underline decoration-primary text-sm'
                type='submit'
                onClick={() => setLogin(false)}
              >
                Create Account
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default login;
