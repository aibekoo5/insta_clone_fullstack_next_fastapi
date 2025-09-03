
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Logo } from '@/components/shared/logo';
import { useToast } from '@/hooks/use-toast';
import { requestPasswordReset } from '@/services/auth-api';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';


const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { handleSubmit, formState: { isSubmitting, isSubmitSuccessful } } = form;

  const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    const { message, error } = await requestPasswordReset(values);

    if (message) {
      toast({
        title: 'Request Sent',
        description: message, // "If the email exists, a reset link has been sent."
      });
    } else if (error) {
      toast({
        title: 'Error',
        description: typeof error.detail === 'string' ? error.detail : "Could not process request.",
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
            imgAlt={`${APP_NAME} Logo`}
          />
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            {isSubmitSuccessful 
              ? "Check your email for a password reset link."
              : "Enter your email address and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>
        {!isSubmitSuccessful ? (
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="grid gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} className="bg-background focus:bg-background"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </CardContent>
            </form>
          </Form>
        ) : (
          <CardContent>
            <p className="text-center text-muted-foreground">
              If an account with that email exists, a password reset link has been sent.
              Please check your inbox (and spam folder).
            </p>
          </CardContent>
        )}
        <CardFooter className="text-center text-sm">
          <Link href="/login" className="underline text-primary hover:text-primary/80 flex items-center justify-center w-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Log in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
