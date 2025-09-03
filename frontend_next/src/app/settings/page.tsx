
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/post/image-uploader';
import { useCurrentUser, currentUserQueryKey } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { updateMyProfile, changeMyPassword } from '@/services/auth-api';
import type { ChangePasswordRequestData, CurrentUser } from '@/types';
import { Loader2 } from 'lucide-react';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useTranslation } from '@/hooks/use-translation';

export default function SettingsPage() {
  const currentUserFromHook = useCurrentUser();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [isPrivacySubmitting, setIsPrivacySubmitting] = useState(false);
  const isFetchingCurrentUser = useIsFetching({ queryKey: currentUserQueryKey });
  const { t } = useTranslation();

  const profileFormSchema = z.object({
    fullName: z.string().optional(),
    username: z.string().min(3, t('page.settings.error_usernameMinLength')).max(50, t('page.settings.error_usernameMaxLength')).optional(),
    email: z.string().email(t('page.settings.error_invalidEmail')).optional(),
    bio: z.string().max(500, t('page.settings.error_bioMaxLength')).optional(),
  });

  const passwordFormSchema = z.object({
    oldPassword: z.string().min(1, t('page.settings.error_oldPasswordRequired')),
    newPassword: z.string().min(8, t('page.settings.error_newPasswordMinLength')),
    confirmNewPassword: z.string().min(8, t('page.settings.error_newPasswordMinLength')),
  }).refine(data => data.newPassword === data.confirmNewPassword, {
    message: t('page.settings.error_passwordsDontMatch'),
    path: ["confirmNewPassword"],
  });

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      bio: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (!isFetchingCurrentUser && currentUserFromHook === null) {
      router.push('/login?redirect=/settings');
    }
  }, [currentUserFromHook, isFetchingCurrentUser, router]);

  useEffect(() => {
    if (currentUserFromHook) {
      profileForm.reset({
        fullName: currentUserFromHook.full_name || "",
        username: currentUserFromHook.username || "",
        email: currentUserFromHook.email || "",
        bio: currentUserFromHook.bio || "",
      });
      setIsPrivateAccount(!!currentUserFromHook.is_private);
    }
  }, [currentUserFromHook, profileForm]);

  if (isFetchingCurrentUser || currentUserFromHook === undefined) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-center text-muted-foreground">{t('page.settings.loading')}</p>
      </div>
    );
  }

  if (currentUserFromHook === null) {
    return null;
  }

  const currentUser: CurrentUser = currentUserFromHook;

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    const formData = new FormData();
    if (values.username && values.username !== currentUser.username) formData.append('username', values.username);
    if (values.email && values.email !== currentUser.email) formData.append('email', values.email);
    if (values.fullName !== undefined && values.fullName !== currentUser.full_name) formData.append('full_name', values.fullName || '');
    if (values.bio !== undefined && values.bio !== currentUser.bio) formData.append('bio', values.bio || '');
    
    if (profilePictureFile) {
      formData.append('profile_picture', profilePictureFile);
    }
    
    let hasData = false;
    formData.forEach(() => { hasData = true; });
    if (!hasData) {
      toast({ title: t('page.settings.profile_toast_noChanges_title'), description: t('page.settings.profile_toast_noChanges_description') });
      return;
    }

    const { user, error } = await updateMyProfile(currentUser.id, formData);
    if (user) {
      toast({ title: t('page.settings.profile_toast_updated_title'), description: t('page.settings.profile_toast_updated_description') });
      queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      setProfilePictureFile(null); 
      const imageUploaderInput = document.getElementById('image-upload-input') as HTMLInputElement;
      if (imageUploaderInput) imageUploaderInput.value = '';
    } else {
      toast({ title: t('page.settings.profile_toast_updateFailed_title'), description: error?.detail as string || t('page.settings.profile_toast_updateFailed_description'), variant: "destructive" });
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    const { message, error } = await changeMyPassword({
      old_password: values.oldPassword,
      new_password: values.newPassword,
    });

    if (message) {
      toast({ title: t('page.settings.account_toast_passwordChanged_title'), description: message });
      passwordForm.reset();
      setIsPasswordDialogOpen(false);
    } else {
      toast({ title: t('page.settings.account_toast_passwordChangeFailed_title'), description: error?.detail as string || t('page.settings.account_toast_passwordChangeFailed_description'), variant: "destructive" });
    }
  };

  const handlePrivateAccountToggle = async (checked: boolean) => {
    setIsPrivacySubmitting(true);
    setIsPrivateAccount(checked); // Optimistic update

    const formData = new FormData();
    formData.append('is_private', String(checked));

    try {
      const { user, error } = await updateMyProfile(currentUser.id, formData);
      if (user) {
        toast({ 
          title: t('page.settings.account_privateAccount_toast_updated_title'), 
          description: checked ? t('page.settings.account_privateAccount_toast_updated_description_private') : t('page.settings.account_privateAccount_toast_updated_description_public')
        });
        queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      } else {
        setIsPrivateAccount(!checked); // Revert optimistic update
        toast({ 
          title: t('page.settings.account_privateAccount_toast_updateFailed_title'), 
          description: error?.detail as string || t('page.settings.account_privateAccount_toast_updateFailed_description'), 
          variant: "destructive" 
        });
      }
    } catch (err) {
      setIsPrivateAccount(!checked); // Revert optimistic update
      toast({ 
        title: t('page.settings.account_privateAccount_toast_updateFailed_title'), 
        description: (err as Error).message || t('page.settings.account_privateAccount_toast_updateFailed_description'), 
        variant: "destructive" 
      });
    } finally {
      setIsPrivacySubmitting(false);
    }
  };
  
  return (
    <div className="space-y-8 max-w-2xl mx-auto py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('page.settings.title')}</h1>
        <p className="text-muted-foreground">{t('page.settings.description')}</p>
      </header>
      <Separator />

      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{t('page.settings.profile_title')}</CardTitle>
            <CardDescription>{t('page.settings.profile_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="profilePicture">{t('page.settings.profile_pictureLabel')}</Label>
              <ImageUploader 
                onFileSelect={setProfilePictureFile} 
                initialPreviewUrl={currentUser.profile_picture || undefined}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="fullName">{t('page.settings.profile_fullNameLabel')}</Label>
                <Input id="fullName" {...profileForm.register("fullName")} />
                {profileForm.formState.errors.fullName && <p className="text-xs text-destructive">{profileForm.formState.errors.fullName.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="username">{t('page.settings.profile_usernameLabel')}</Label>
                <Input id="username" {...profileForm.register("username")} />
                {profileForm.formState.errors.username && <p className="text-xs text-destructive">{profileForm.formState.errors.username.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
                <Label htmlFor="email">{t('page.settings.profile_emailLabel')}</Label>
                <Input id="email" type="email" {...profileForm.register("email")} />
                {profileForm.formState.errors.email && <p className="text-xs text-destructive">{profileForm.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="bio">{t('page.settings.profile_bioLabel')}</Label>
              <Textarea id="bio" {...profileForm.register("bio")} rows={3} />
              {profileForm.formState.errors.bio && <p className="text-xs text-destructive">{profileForm.formState.errors.bio.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('page.settings.profile_saveButton')}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>{t('page.settings.account_title')}</CardTitle>
          <CardDescription>{t('page.settings.account_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">{t('page.settings.account_changePasswordButton')}</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <DialogHeader>
                  <DialogTitle>{t('page.settings.account_changePasswordDialog_title')}</DialogTitle>
                  <DialogDescription>
                    {t('page.settings.account_changePasswordDialog_description')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-1">
                    <Label htmlFor="oldPassword">{t('page.settings.account_oldPasswordLabel')}</Label>
                    <Input id="oldPassword" type="password" {...passwordForm.register("oldPassword")} />
                    {passwordForm.formState.errors.oldPassword && <p className="text-xs text-destructive">{passwordForm.formState.errors.oldPassword.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newPassword">{t('page.settings.account_newPasswordLabel')}</Label>
                    <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} />
                     {passwordForm.formState.errors.newPassword && <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmNewPassword">{t('page.settings.account_confirmNewPasswordLabel')}</Label>
                    <Input id="confirmNewPassword" type="password" {...passwordForm.register("confirmNewPassword")} />
                    {passwordForm.formState.errors.confirmNewPassword && <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmNewPassword.message}</p>}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                     <Button type="button" variant="outline">{t('common.cancel')}</Button>
                  </DialogClose>
                  <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('page.settings.account_saveNewPasswordButton')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="privateAccount" className="font-medium">{t('page.settings.account_privateAccountLabel')}</Label>
              <p className="text-xs text-muted-foreground">
                {isPrivateAccount 
                  ? t('page.settings.account_privateAccount_description_active') 
                  : t('page.settings.account_privateAccount_description_public')
                }
              </p>
            </div>
            <div className="flex items-center">
              {isPrivacySubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />}
              <Switch 
                id="privateAccount" 
                aria-label="Toggle private account" 
                checked={isPrivateAccount}
                onCheckedChange={handlePrivateAccountToggle}
                disabled={isPrivacySubmitting}
              />
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
