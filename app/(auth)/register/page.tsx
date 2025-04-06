'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { register, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';

export default function Page() {
  const router = useRouter();
  const t = useTranslations('auth'); // 🌐 ルート全体を対象に取得

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({ type: 'error', description: t('auth.userExists') });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: t('auth.failed') });
    } else if (state.status === 'invalid_data') {
      toast({ type: 'error', description: t('auth.invalidData') });
    } else if (state.status === 'success') {
      toast({ type: 'success', description: t('auth.success') });
      setIsSuccessful(true);
      router.refresh();
    }
  }, [state, t, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            {t('auth.signUp')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t('auth.signUpDescription')}
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>
            {t('auth.signUp')}
          </SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              {t('auth.signIn')}
            </Link>
            {' ' + t('auth.instead')}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
