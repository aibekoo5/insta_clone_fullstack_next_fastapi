
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
import { registerUser } from '@/services/auth-api';
import type { UserCreateRequest } from '@/types';
import { Loader2 } from 'lucide-react';
import { setCurrentUserInStorage, setToken } from '@/lib/auth-utils'; // Need setToken if we auto-login

const signupSchema = z.object({
  fullName: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters.").max(50, "Username too long."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const { handleSubmit, formState: { isSubmitting } } = form;

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    const signupData: UserCreateRequest = {
      email: values.email,
      username: values.username,
      password: values.password,
      full_name: values.fullName || null,
    };

    const { user, error } = await registerUser(signupData);

    if (user) {
      toast({
        title: 'Signup Successful',
        description: "Your account has been created. Please log in.",
      });
      // The backend /auth/register returns UserOut but not a token.
      // So we redirect to login.
      // If it returned a token, we could auto-login:
      // setCurrentUserInStorage(user); 
      // setToken(returned_token_here);
      // router.push('/');
      router.push('/login');
    } else if (error) {
      toast({
        title: 'Signup Failed',
        description: typeof error.detail === 'string' ? error.detail : "An unknown error occurred.",
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <Logo 
            size="medium" 
            className="group-data-[collapsible=icon]:hidden justify-center mx-auto mb-4" 
            imageUrl="http://localhost:8000/static/logo/Lifegram.png" 
            text="Lifegram"
            imgAlt="Admin Panel Logo"
          />
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Enter your information to get started.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name (Optional)</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Your Name" {...field} className="bg-background focus:bg-background"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="your_username" {...field} className="bg-background focus:bg-background"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} className="bg-background focus:bg-background"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign Up
              </Button>
            </CardContent>
          </form>
        </Form>
        <CardFooter className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline text-primary hover:text-primary/80">
            Log in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
