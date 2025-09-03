
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Logo } from '@/components/shared/logo';
import { useToast } from '@/hooks/use-toast';
import { loginUser } from '@/services/auth-api';
import type { LoginRequestData } from '@/types';
import { Loader2 } from 'lucide-react';
import { setCurrentUserInStorage } from '@/lib/auth-utils';
import { useTranslation } from '@/hooks/use-translation';
import { APP_NAME } from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const loginSchema = z.object({
    email: z.string().email({ message: t('page.login.error_invalidEmail') }),
    password: z.string().min(8, { message: t('page.login.error_passwordMinLength') }),
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { handleSubmit, formState: { isSubmitting } } = form;

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    const loginData: LoginRequestData = { email: values.email, password: values.password };
    const { token, error } = await loginUser(loginData);

    if (token) {
      toast({
        title: t('page.login.toast_loginSuccessful_title'),
        description: t('page.login.toast_loginSuccessful_description'),
      });
      window.location.href = '/'; 
    } else if (error) {
      toast({
        title: t('page.login.toast_loginFailed_title'),
        description: typeof error.detail === 'string' ? error.detail : t('page.login.toast_genericError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <Logo 
            size="large"
            className="justify-center mb-4"
            imageUrl="http://localhost:8000/static/logo/Lifegram.png" 
            imgAlt={`${APP_NAME} ${t('common.logoAltSuffix')}`}
            text={APP_NAME}
          />
          <CardTitle className="text-2xl">{t('page.login.title')}</CardTitle>
          <CardDescription>
            {t('page.login.description')}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('page.login.emailLabel')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} className="bg-background focus:bg-background"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                        <FormLabel>{t('page.login.passwordLabel')}</FormLabel>
                        <Link href="/forgot-password" className="ml-auto inline-block text-sm underline text-primary hover:text-primary/80">
                            {t('page.login.forgotPasswordLink')}
                        </Link>
                    </div>
                    <FormControl>
                      <Input type="password" {...field} className="bg-background focus:bg-background"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('page.login.loginButton')}
              </Button>
            </CardContent>
          </form>
        </Form>
        <CardFooter className="text-center text-sm">
          {t('page.login.noAccountPrompt')}{' '}
          <Link href="/signup" className="underline text-primary hover:text-primary/80">
            {t('page.login.signUpLink')}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
