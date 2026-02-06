export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  plotNumber?: string | null;
  roomNumber?: string | null;
  price: number;
  size: number;
  status: 'Available' | 'Reserved' | 'Sold';
  type: 'Property Rentals' | 'Commercial Rentals' | 'Agricultural' | 'Land For Sale' | 'Car Rentals' | 'Other';
  imageUrl: string;
  imageUrls?: string[];
  layoutImageUrl?: string;
  features: string[];
  financingMethods?: string[];
  companyId: string;
}

export interface Application {
  id: string;
  propertyId: string;
  userId: string | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantAddress: string;
  offerAmount: number;
  financingMethod: string;
  intendedUse: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  dateApplied: string;
  documents: {
    idDocument?: string;
    proofOfFunds?: string;
    [key: string]: any;
  };
  companyId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Client' | 'Admin' | 'SuperAdmin';
  status: 'Active' | 'Inactive';
  registeredDate: string;
  companyId: string | null;
  companyIds?: string[];
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  description: string;
  primaryColor: string;
  status: 'Active' | 'Pending' | 'Inactive';
  registeredDate: string;
  subscriptionPlan?: string;
  maxPlots?: number;
  contactEmail: string;
  contactPhone: string;
  address: string;
}
