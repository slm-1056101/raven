import { useEffect, useState, type ChangeEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { User, FileText, DollarSign, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Progress } from '@/app/components/ui/progress';
import { apiFetch } from '@/app/api';
import { useApp } from '@/app/context/AppContext';
import { notifyError, notifyInfo, notifySuccess } from '@/app/notify';

import type { Property } from '@/app/types';

interface FormData {
  fullName: string;
  surname: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  address: string;
  intendedUse: string;
  offerAmount: number;
  financingMethod: string;
  startDate?: string;
  endDate?: string;
  pickupTime?: string;
  idDocument: File | null;
}

export function PublicLandAcquisitionForm() {
  const { publicProperty, publicCompanyId, setCurrentView, setIntendedCompanyId, currentUser, authToken, setAuthToken, setCurrentUser, hydrateFromApi, refreshAll, createApplication } = useApp();
  const [currentStep, setCurrentStep] = useState(1);

  const property = publicProperty as Property | null;

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>({
    shouldUnregister: false,
    defaultValues: {
      fullName: '',
      surname: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      address: '',
      intendedUse: '',
      offerAmount: 0,
      financingMethod: '',
      startDate: '',
      endDate: '',
      pickupTime: '',
      idDocument: null,
    },
  });

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.name) setValue('fullName', currentUser.name, { shouldDirty: false });
    if (currentUser.email) setValue('email', currentUser.email, { shouldDirty: false });
    if (currentUser.email) setValue('username', currentUser.email, { shouldDirty: false });
    if ((currentUser as any).phone) setValue('phone', (currentUser as any).phone, { shouldDirty: false });
  }, [currentUser, setValue]);

  const isRentalType =
    property?.type === 'Property Rentals' ||
    property?.type === 'Commercial Rentals' ||
    property?.type === 'Car Rentals';

  const isCarRental = property?.type === 'Car Rentals';

  useEffect(() => {
    if (!property) {
      setCurrentView('landing');
    }
  }, [property, setCurrentView]);

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Property', icon: FileText },
    { number: 3, title: 'Financial', icon: DollarSign },
    { number: 4, title: 'Documents', icon: Upload },
  ];

  const progress = (currentStep / 4) * 100;

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const validateAndNext = async () => {
    let fields: (keyof FormData)[] = [];
    if (currentStep === 1) {
      fields = ['fullName', 'surname', 'username', 'phone', 'address'];
      if (!currentUser) fields.push('password');
    }
    if (currentStep === 2) fields = ['intendedUse'];
    if (currentStep === 3) fields = ['offerAmount', 'financingMethod'];

    if (currentStep === 1) {
      const fullNameEl = document.getElementById('fullName') as HTMLInputElement | null;
      const phoneEl = document.getElementById('phone') as HTMLInputElement | null;
      const addressEl = document.getElementById('address') as HTMLInputElement | null;

      if (fullNameEl?.value) setValue('fullName', fullNameEl.value, { shouldDirty: true });
      if (phoneEl?.value) setValue('phone', phoneEl.value, { shouldDirty: true });
      if (addressEl?.value) setValue('address', addressEl.value, { shouldDirty: true });
    }

    if (currentStep === 2) {
      const intendedUseEl = document.getElementById('intendedUse') as HTMLTextAreaElement | null;
      if (intendedUseEl?.value) setValue('intendedUse', intendedUseEl.value, { shouldDirty: true });
    }

    if (currentStep === 3) {
      const offerAmountEl = document.getElementById('offerAmount') as HTMLInputElement | null;
      if (offerAmountEl?.value) {
        const n = Number(offerAmountEl.value);
        if (!Number.isNaN(n)) setValue('offerAmount', n as any, { shouldDirty: true });
      }
    }

    const ok = await trigger(fields as any, { shouldFocus: true });
    if (!ok) return;
    nextStep();
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValue('idDocument', file ?? null, { shouldDirty: true, shouldValidate: false });
    if (file) clearErrors('idDocument');
  };

  const onSubmit = async (data: FormData) => {
    if (currentStep < 4) {
      await validateAndNext();
      return;
    }

    if (!property) {
      notifyError('Missing property');
      return;
    }

    if (!data.financingMethod || data.financingMethod === 'undefined' || data.financingMethod === 'null') {
      notifyError('Financing method is required');
      return;
    }

    if (!data.idDocument) {
      setError('idDocument', { type: 'required', message: 'ID Document is required' });
      return;
    }

    const normalizedEmail = (currentUser?.email || data.username || data.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      notifyError('Please enter your email');
      return;
    }

    if (!currentUser && !data.password) {
      notifyError('Please enter your password');
      return;
    }

    if (isRentalType) {
      if (!data.startDate) {
        notifyError('Start date is required');
        return;
      }
      if (!data.endDate) {
        notifyError('End date is required');
        return;
      }
    }

    if (isCarRental) {
      if (!data.pickupTime) {
        notifyError('Pickup time is required');
        return;
      }
    }

    try {
      const targetCompanyId = publicCompanyId || property.companyId;

      const precheck = await apiFetch<{ userExists: boolean; alreadyApplied: boolean }>(
        `/api/public/applications/precheck/?email=${encodeURIComponent(normalizedEmail)}&propertyId=${encodeURIComponent(
          property.id,
        )}&companyId=${encodeURIComponent(targetCompanyId)}`,
      );

      if (precheck.alreadyApplied) {
        if (targetCompanyId) setIntendedCompanyId(targetCompanyId);
        if (!currentUser) {
          notifyInfo('Already applied for the inventory, please login to track progress');
          setCurrentView('login');
          return;
        }
        notifyInfo('Already applied for the inventory, please login to track progress');
        return;
      }

      let effectiveToken: string | null = null;

      if (!currentUser && !precheck.userExists) {
        const resp = await apiFetch<{ access: string; refresh: string; user: any }>('/api/auth/signup/', {
          method: 'POST',
          body: JSON.stringify({
            name: data.fullName.trim(),
            email: normalizedEmail,
            phone: data.phone.trim(),
            password: data.password,
          }),
        });

        effectiveToken = resp.access;
        setAuthToken(resp.access);

        const me = await apiFetch<any>('/api/auth/me/', { token: resp.access });
        const all = await refreshAll(resp.access, { includeUsers: me.role !== 'Client', role: me.role });
        hydrateFromApi(all);
        setCurrentUser(me);
      } else {
        effectiveToken = authToken;
      }

      const formData = new FormData();

      formData.append('propertyId', property.id);
      formData.append('companyId', targetCompanyId);
      formData.append('applicantName', data.fullName);
      if (data.surname) formData.append('surname', data.surname);
      formData.append('applicantEmail', normalizedEmail);
      formData.append('applicantPhone', data.phone);
      formData.append('applicantAddress', data.address);
      formData.append('offerAmount', String(data.offerAmount || 0));
      formData.append('financingMethod', data.financingMethod);
      formData.append('intendedUse', data.intendedUse);

      if (isRentalType) {
        if (data.startDate) formData.append('startDate', data.startDate);
        if (data.endDate) formData.append('endDate', data.endDate);
      }

      if (isCarRental && data.pickupTime) {
        formData.append('pickupTime', data.pickupTime);
      }

      if (data.idDocument) formData.append('idDocument', data.idDocument);

      if (effectiveToken) {
        try {
          await createApplication(effectiveToken, formData as any);
        } catch {
          await apiFetch('/api/applications/', {
            token: effectiveToken,
            method: 'POST',
            body: formData,
          });
        }

        try {
          const all = await refreshAll(effectiveToken, {
            includeUsers: false,
            role: (currentUser?.role ?? 'Client') as any,
          });
          hydrateFromApi(all);
        } catch {
          // ignore
        }
      } else {
        await apiFetch('/api/public/applications/', {
          method: 'POST',
          body: formData,
        });
      }

      if (targetCompanyId) {
        setIntendedCompanyId(targetCompanyId);
      }

      if (!currentUser && precheck.userExists) {
        // Existing client -> send them to login after submitting.
        notifySuccess('Application submitted, please login to track application');
        setCurrentView('login');
        return;
      }

      notifySuccess('Application submitted');

      // New client (just signed up) OR existing logged-in user.
      setCurrentView('client');
    } catch (err: any) {
      notifyError(err?.message || 'Failed to submit application');
    }
  };

  if (!property) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Application Form</h1>
            <p className="text-sm text-gray-600">
              Complete the steps below to submit your application.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>
                Step {currentStep} of 4 ({Math.round(progress)}%)
              </CardDescription>
              <Progress value={progress} />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {steps.map((s) => {
                  const Icon = s.icon;
                  const active = s.number === currentStep;
                  const complete = s.number < currentStep;
                  return (
                    <div
                      key={s.number}
                      className={`rounded-lg border p-3 flex items-center gap-2 ${active ? 'border-blue-600' : 'border-gray-200'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${complete ? 'bg-green-100' : active ? 'bg-blue-100' : 'bg-gray-100'}`}
                      >
                        {complete ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-500'}`} />}
                      </div>
                      <div className="text-sm font-medium">{s.title}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
              <CardDescription>Complete the information below</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  if (currentStep >= 4) return;
                  const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
                  if (tag === 'textarea') return;
                  e.preventDefault();
                  validateAndNext();
                }}
              >
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Name</Label>
                      <Input id="fullName" {...register('fullName', { required: 'Name is required' })} />
                      {errors.fullName && (
                        <div className="text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.fullName.message}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="surname">Surname</Label>
                      <Input id="surname" {...register('surname', { required: 'Surname is required' })} />
                      {errors.surname && (
                        <div className="text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.surname.message}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Email</Label>
                      <Input
                        id="username"
                        type="email"
                        {...register('username', { required: currentUser ? false : 'Email is required' })}
                      />
                      {errors.username && (
                        <div className="text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.username.message}
                        </div>
                      )}
                    </div>

                    {!currentUser && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          {...register('password', { required: 'Password is required' })}
                        />
                        {errors.password && (
                          <div className="text-sm text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {errors.password.message}
                          </div>
                        )}
                      </div>
                    )}

                    <input type="hidden" {...register('email')} />

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" {...register('phone', { required: 'Phone is required' })} />
                      {errors.phone && (
                        <div className="text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.phone.message}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" {...register('address', { required: 'Address is required' })} />
                      {errors.address && (
                        <div className="text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.address.message}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4 bg-gray-50">
                      <div className="font-medium">Selected Inventory</div>
                      <div className="text-sm text-gray-700 mt-1">{property.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{property.location}</div>
                    </div>

                    {isRentalType && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            {...register('startDate', { required: 'Start date is required' })}
                          />
                          {errors.startDate && (
                            <div className="text-sm text-red-600 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              {errors.startDate.message}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            {...register('endDate', { required: 'End date is required' })}
                          />
                          {errors.endDate && (
                            <div className="text-sm text-red-600 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              {errors.endDate.message}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {isCarRental && (
                      <div className="space-y-2">
                        <Label htmlFor="pickupTime">Pickup Time</Label>
                        <Input
                          id="pickupTime"
                          placeholder="e.g. 10:00 AM"
                          {...register('pickupTime', { required: 'Pickup time is required' })}
                        />
                        {errors.pickupTime && (
                          <div className="text-sm text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {errors.pickupTime.message}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="intendedUse">Intended Use</Label>
                      <Textarea id="intendedUse" rows={4} {...register('intendedUse', { required: 'Intended use is required' })} />
                      {errors.intendedUse && (
                        <div className="text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.intendedUse.message}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="offerAmount">Offer Amount</Label>
                      <Input
                        id="offerAmount"
                        type="number"
                        {...register('offerAmount', { required: 'Offer amount is required', valueAsNumber: true })}
                      />
                      {errors.offerAmount && (
                        <div className="text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.offerAmount.message}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Financing Method</Label>
                      <Controller
                        control={control}
                        name="financingMethod"
                        rules={{ required: 'Financing method is required' }}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {isRentalType ? (
                                <>
                                  <SelectItem value="Cash">Cash</SelectItem>
                                  <SelectItem value="CreditCard">CreditCard</SelectItem>
                                  <SelectItem value="Wave">Wave</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="Cash">Cash</SelectItem>
                                  <SelectItem value="Mortgage">Mortgage</SelectItem>
                                  <SelectItem value="Bank Loan">Bank Loan</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.financingMethod && (
                        <div className="text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.financingMethod.message}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="idDocument">ID Document</Label>
                      <Input id="idDocument" type="file" onChange={handleFileUpload} />
                      {errors.idDocument && (
                        <div className="text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors.idDocument.message}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="outline" onClick={() => setCurrentView('company-landing')}>
                    Back
                  </Button>

                  <div className="flex items-center gap-2">
                    {currentStep > 1 && (
                      <Button type="button" variant="outline" onClick={prevStep}>
                        Previous
                      </Button>
                    )}
                    {currentStep < 4 ? (
                      <Button type="button" className="bg-blue-600 hover:bg-blue-700" onClick={validateAndNext}>
                        Next
                      </Button>
                    ) : (
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        Submit Application
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
