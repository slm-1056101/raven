import { useEffect, useState, type ChangeEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ArrowLeft, User, FileText, DollarSign, Upload, CheckCircle2, AlertCircle, MapPin, Square, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Progress } from '@/app/components/ui/progress';
import { useApp } from '@/app/context/AppContext';
import { notifyError, notifyInfo, notifySuccess } from '@/app/notify';
import { apiFetch } from '@/app/api';

import type { Company, Property } from '@/app/types';

interface LandAcquisitionFormProps {
  property: Property;
  company?: Company | null;
  onClose: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  propertyId: string;
  intendedUse: string;
  offerAmount: number;
  financingMethod: string;
  idDocument: File | null;
  proofOfFunds: File | null;
}

export function LandAcquisitionForm({ property, company, onClose }: LandAcquisitionFormProps) {
  const { createApplication, currentCompany, currentUser, authToken, setCurrentView } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [proofOfFundsFile, setProofOfFundsFile] = useState<File | null>(null);
  
  const { register, handleSubmit, trigger, control, setValue, formState: { errors } } = useForm<FormData>({
    shouldUnregister: false,
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      propertyId: property.id,
      financingMethod: '',
    }
  });

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.name) setValue('fullName', currentUser.name, { shouldDirty: false });
    if (currentUser.email) setValue('email', currentUser.email, { shouldDirty: false });
    if ((currentUser as any).phone) setValue('phone', (currentUser as any).phone, { shouldDirty: false });
  }, [currentUser, setValue]);

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Property', icon: FileText },
    { number: 3, title: 'Financial', icon: DollarSign },
    { number: 4, title: 'Documents', icon: Upload },
  ];

  const financingOptions = Array.isArray((property as any).financingMethods) && (property as any).financingMethods.length > 0
    ? ((property as any).financingMethods as string[])
    : ['Cash Payment', 'Mortgage/Loan', 'Mixed (Cash + Loan)', 'Installment Plan'];

  const progress = (currentStep / 4) * 100;

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const onSubmit = (data: FormData) => {
    const companyId = currentCompany?.id || property.companyId;
    if (!companyId) {
      notifyError('Missing company');
      return;
    }

    if (!data.financingMethod || data.financingMethod === 'undefined' || data.financingMethod === 'null') {
      notifyError('Financing method is required');
      return;
    }

    if (!idDocumentFile) {
      notifyError('ID Document is required');
      return;
    }

    if (!proofOfFundsFile) {
      notifyError('Proof of Funds is required');
      return;
    }

    (async () => {
      try {
        const fd = new FormData();
        fd.append('companyId', companyId);
        fd.append('propertyId', property.id);
        if (currentUser?.id) fd.append('userId', currentUser.id);
        fd.append('applicantName', data.fullName);
        fd.append('applicantEmail', data.email);
        fd.append('applicantPhone', data.phone);
        fd.append('applicantAddress', data.address);
        fd.append('offerAmount', String(data.offerAmount));
        fd.append('financingMethod', data.financingMethod);
        fd.append('intendedUse', data.intendedUse);
        fd.append('status', 'Pending');
        fd.append('idDocument', idDocumentFile);
        fd.append('proofOfFunds', proofOfFundsFile);

        if (authToken) {
          await createApplication(authToken, fd as any);
          notifySuccess('Application submitted successfully!');
          onClose();
          return;
        }

        await apiFetch('/api/public/applications/', {
          method: 'POST',
          body: fd as any,
        });
        notifySuccess('Application submitted successfully!');
        notifyInfo('Next step', 'Create an account or log in to manage your properties and applications.');
        onClose();
        setCurrentView('login');
      } catch (err: any) {
        notifyError(err?.message || 'Failed to submit application');
      }
    })();
  };

  const validateAndNext = async () => {
    let fields: (keyof FormData)[] = [];
    if (currentStep === 1) fields = ['fullName', 'email', 'phone', 'address'];
    if (currentStep === 2) fields = ['intendedUse'];
    if (currentStep === 3) fields = ['offerAmount', 'financingMethod'];

    // Browser autofill may not trigger onChange. Sync visible input values into RHF before validating.
    if (currentStep === 1) {
      const fullNameEl = document.getElementById('fullName') as HTMLInputElement | null;
      const emailEl = document.getElementById('email') as HTMLInputElement | null;
      const phoneEl = document.getElementById('phone') as HTMLInputElement | null;
      const addressEl = document.getElementById('address') as HTMLInputElement | null;

      if (fullNameEl?.value) setValue('fullName', fullNameEl.value, { shouldDirty: true });
      if (emailEl?.value) setValue('email', emailEl.value, { shouldDirty: true });
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

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, type: 'id' | 'funds') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'id') {
        setIdDocumentFile(file);
      } else {
        setProofOfFundsFile(file);
      }
    }
  };

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'inactive';
  };

  return (
    <div className="space-y-8">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {company?.logo ? (
                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                  {company.logo}
                </div>
              ) : null}
              <div className="flex flex-col">
                {company?.name ? (
                  <span className="text-sm text-gray-600">{company.name}</span>
                ) : null}
                <CardTitle>Land Acquisition Application</CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Step {currentStep} of 4 ({Math.round(progress)}%)</span>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {steps.map((step) => {
              const status = getStepStatus(step.number);
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    status === 'completed' ? 'bg-green-500 text-white' :
                    status === 'active' ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-sm font-medium ${
                    status === 'active' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Please provide your contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    {...register('fullName', { required: 'Full name is required' })}
                    placeholder="John Doe"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    {...register('phone', { required: 'Phone number is required' })}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Current Address *</Label>
                  <Input
                    id="address"
                    {...register('address', { required: 'Address is required' })}
                    placeholder="123 Main St, City, State"
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Property Selection */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Property Selection</CardTitle>
              <CardDescription>Review the selected property details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Selected Property</Label>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-4">
                    <img 
                      src={property.imageUrl} 
                      alt={property.title}
                      className="w-24 h-24 rounded object-cover"
                    />
                    <div className="flex-1 space-y-2">
                      <h3 className="font-bold text-lg">{property.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{property.location}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span>D{property.price}K</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Square className="h-4 w-4 text-gray-500" />
                          <span>{property.size.toLocaleString()} m²</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <span>{property.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intendedUse">Intended Use *</Label>
                <Textarea
                  id="intendedUse"
                  {...register('intendedUse', { required: 'Please describe your intended use' })}
                  placeholder="Describe your plans for this property..."
                  rows={4}
                />
                {errors.intendedUse && (
                  <p className="text-sm text-red-500">{errors.intendedUse.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Financial Information */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>Provide your offer and financing details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="offerAmount">Offer Amount *</Label>
                <Input
                  id="offerAmount"
                  type="number"
                  {...register('offerAmount', { 
                    required: 'Offer amount is required',
                    min: { value: 1, message: 'Offer must be greater than 0' }
                  })}
                  placeholder="850000"
                />
                <p className="text-sm text-gray-600">
                  Listed price: D{(property.price * 1000).toLocaleString()}
                </p>
                {errors.offerAmount && (
                  <p className="text-sm text-red-500">{errors.offerAmount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="financingMethod">Financing Method *</Label>
                <Controller
                  control={control}
                  name="financingMethod"
                  rules={{ required: 'Financing method is required' }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select financing method" />
                      </SelectTrigger>
                      <SelectContent>
                        {financingOptions.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.financingMethod && (
                  <p className="text-sm text-red-500">{errors.financingMethod.message}</p>
                )}
              </div>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Application Review Process</p>
                      <p className="mt-1">
                        Your application will be reviewed within 3-5 business days. You'll be notified via email once a decision is made.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Document Upload */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>Upload required documents to complete your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ID Document Upload */}
              <div className="space-y-2">
                <Label>ID Document *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  {idDocumentFile ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                      <p className="font-medium">{idDocumentFile.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIdDocumentFile(null)}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="idDocument" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="font-medium">Click to upload ID Document</p>
                      <p className="text-sm text-gray-500 mt-1">PDF, JPG, JPEG, PNG (Max 10MB)</p>
                      <input
                        id="idDocument"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, 'id')}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Proof of Funds Upload */}
              <div className="space-y-2">
                <Label>Proof of Funds *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  {proofOfFundsFile ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                      <p className="font-medium">{proofOfFundsFile.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setProofOfFundsFile(null)}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="proofOfFunds" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="font-medium">Click to upload Proof of Funds</p>
                      <p className="text-sm text-gray-500 mt-1">PDF, JPG, JPEG, PNG (Max 10MB)</p>
                      <input
                        id="proofOfFunds"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, 'funds')}
                      />
                    </label>
                  )}
                </div>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 space-y-1">
                      <p className="font-medium">Document Requirements</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>All documents must be clear and legible</li>
                        <li>Bank statements must be dated within the last 3 months</li>
                        <li>Documents will be kept confidential and secure</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? onClose : prevStep}
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>
          <Button
            type={currentStep === 4 ? 'submit' : 'button'}
            className={currentStep === 4 ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
            onClick={currentStep === 4 ? undefined : validateAndNext}
          >
            {currentStep === 4 ? 'Submit Application' : 'Next Step'}
          </Button>
        </div>
      </form>
    </div>
  );
}