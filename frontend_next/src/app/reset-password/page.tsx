'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { confirmPasswordReset } from '@/services/auth-api';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Logo } from '@/components/shared/logo';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { handleSubmit, formState: { isSubmitting } } = form;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (!urlToken) {
      setError("Invalid or missing password reset token.");
      toast({
        title: "Error",
        description: "Invalid or missing password reset token.",
        variant: "destructive",
      });
    } else {
      setToken(urlToken);
    }
    setLoading(false);
  }, [toast]);

  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    if (!token) {
      toast({ title: "Error", description: "No reset token found.", variant: "destructive" });
      return;
    }

    const { message, error: apiError } = await confirmPasswordReset({
      token,
      new_password: values.newPassword,
    });

    if (message) {
      toast({
        title: 'Password Reset Successful',
        description: message + " You can now log in with your new password.",
      });
      router.push('/login');
    } else if (apiError) {
      toast({
        title: 'Password Reset Failed',
        description: typeof apiError.detail === 'string' ? apiError.detail : "Could not reset password.",
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader className="text-center space-y-1">
            <Logo
              size="medium"
              className="mx-auto mb-4"
              imageUrl="http://localhost:8000/static/logo/Lifegram.png"
              text="Lifegram"
              imgAlt="Admin Panel Logo"
            />
            <CardTitle className="text-2xl text-destructive">Invalid Link</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center space-y-1">
          <Logo size="large" className="mx-auto mb-4" />
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} className="bg-background focus:bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} className="bg-background focus:bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set New Password
              </Button>
            </CardContent>
          </form>
        </Form>

        <CardFooter className="text-center text-sm">
          <Link href="/login" className="underline text-primary hover:text-primary/80 flex items-center justify-center w-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Log in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
