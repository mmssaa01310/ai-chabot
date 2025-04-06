'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { toast } from '@/components/toast';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { LanguageSelector } from '@/components/language-selector';
import { login, type LoginActionState } from '../actions';
import { v4 as uuidv4 } from 'uuid'; 

import { useLocale } from 'next-intl';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();

  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    { status: 'idle' },
  );

  useEffect(() => {
    if (state.status === 'failed') {
      toast({ type: 'error', description: t('auth.invalidCredentials') });
    } else if (state.status === 'invalid_data') {
      toast({ type: 'error', description: t('auth.invalidData') });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      router.push(`/${locale}/chat`);
    }
  }, [state.status, t, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md flex flex-col gap-4">
        <div className="flex justify-end">
          <LanguageSelector />
        </div>
        <div className="overflow-hidden rounded-2xl flex flex-col gap-12">
          <div className="flex flex-col items-center justify-center gap-2 text-center sm:px-16">
            <h3 className="text-xl font-semibold dark:text-zinc-50">
              {t('auth.signIn')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {t('auth.signInDescription')}
            </p>
          </div>
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton isSuccessful={isSuccessful}>
              {t('auth.signIn')}
            </SubmitButton>
            <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
              {t('auth.noAccount')}{' '}
              <Link
                href="/register"
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              >
                {t('auth.signUp')}
              </Link>
              {' ' + t('auth.forFree')}
            </p>
          </AuthForm>
        </div>
      </div>
    </div>
  );
}
