export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  size: number;
  status: 'Available' | 'Reserved' | 'Sold';
  type: 'Residential' | 'Commercial' | 'Agricultural';
  imageUrl: string;
  features: string[];
  companyId: string; // Add company ID
}

export interface Application {
  id: string;
  propertyId: string;
  userId: string;
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
    idDocument: string;
    proofOfFunds: string;
  };
  companyId: string; // Add company ID
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Client' | 'Admin' | 'SuperAdmin';
  status: 'Active' | 'Inactive';
  registeredDate: string;
  companyId: string | null; // null for SuperAdmin
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  description: string;
  primaryColor: string;
  status: 'Active' | 'Pending' | 'Inactive';
  registeredDate: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  adminUserId: string;
}

export const companies: Company[] = [
  {
    id: 'company-001',
    name: 'Delka Properties',
    logo: '🏢',
    description: 'Premier vacant land specialists focusing on waterfront and premium residential lots across the United States.',
    primaryColor: '#2563EB',
    status: 'Active',
    registeredDate: '2025-01-01',
    contactEmail: 'info@delkaproperties.com',
    contactPhone: '+1 (555) 100-0001',
    address: '123 Main Street, Miami, FL 33101',
    adminUserId: 'admin-001'
  },
  {
    id: 'company-002',
    name: 'Summit Land Group',
    logo: '⛰️',
    description: 'Specializing in mountain and agricultural land development with a focus on sustainable practices.',
    primaryColor: '#059669',
    status: 'Active',
    registeredDate: '2025-02-15',
    contactEmail: 'contact@summitland.com',
    contactPhone: '+1 (555) 200-0002',
    address: '456 Peak Avenue, Denver, CO 80201',
    adminUserId: 'admin-002'
  },
  {
    id: 'company-003',
    name: 'Coastal Realty Co',
    logo: '🌊',
    description: 'Dedicated to coastal and waterfront vacant land acquisitions along the Pacific and Atlantic coasts.',
    primaryColor: '#0891B2',
    status: 'Active',
    registeredDate: '2025-03-10',
    contactEmail: 'hello@coastalrealty.com',
    contactPhone: '+1 (555) 300-0003',
    address: '789 Ocean Drive, San Diego, CA 92101',
    adminUserId: 'admin-003'
  },
  {
    id: 'company-004',
    name: 'Urban Development Partners',
    logo: '🏙️',
    description: 'Commercial and industrial land development in major metropolitan areas.',
    primaryColor: '#7C3AED',
    status: 'Pending',
    registeredDate: '2026-01-10',
    contactEmail: 'info@urbandevpartners.com',
    contactPhone: '+1 (555) 400-0004',
    address: '321 City Center, Austin, TX 78701',
    adminUserId: 'admin-004'
  }
];

export const properties: Property[] = [
  // Delka Properties
  {
    id: 'prop-001',
    title: 'Prime Waterfront Vacant Land',
    description: 'Empty waterfront lot cleared and ready for development. This pristine vacant land offers stunning water views and direct beach access.',
    location: 'Miami, FL',
    price: 850,
    size: 3500,
    status: 'Available',
    type: 'Residential',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
    features: ['Waterfront', 'Utilities Available', 'Zoned Residential'],
    companyId: 'company-001'
  },
  {
    id: 'prop-002',
    title: 'Downtown Commercial Lot',
    description: 'Vacant commercial lot in the heart of downtown. Fully cleared empty land with excellent visibility and high traffic location, ready for development.',
    location: 'Austin, TX',
    price: 1200,
    size: 2800,
    status: 'Available',
    type: 'Commercial',
    imageUrl: 'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800&q=80',
    features: ['Prime Location', 'High Traffic', 'Corner Lot'],
    companyId: 'company-001'
  },
  {
    id: 'prop-003',
    title: 'Coastal Empty Development Plot',
    description: 'Vacant coastal land with breathtaking ocean views. This empty lot is cleared and approved for residential development.',
    location: 'Portland, OR',
    price: 920,
    size: 4100,
    status: 'Available',
    type: 'Residential',
    imageUrl: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80',
    features: ['Ocean Views', 'Approved Plans', 'Quiet Area'],
    companyId: 'company-001'
  },
  // Summit Land Group
  {
    id: 'prop-004',
    title: 'Mountain View Vacant Acreage',
    description: 'Large empty land parcel with spectacular mountain views. This vacant lot is cleared and ready for your dream home construction.',
    location: 'Seattle, WA',
    price: 680,
    size: 5200,
    status: 'Reserved',
    type: 'Residential',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    features: ['Mountain Views', 'Private', 'Large Acreage'],
    companyId: 'company-002'
  },
  {
    id: 'prop-005',
    title: 'Agricultural Vacant Farmland',
    description: 'Expansive vacant farmland ready for agricultural development. Completely empty and cleared with irrigation infrastructure in place.',
    location: 'Denver, CO',
    price: 450,
    size: 8000,
    status: 'Available',
    type: 'Agricultural',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
    features: ['Irrigation Ready', 'Flat Terrain', 'Rich Soil'],
    companyId: 'company-002'
  },
  {
    id: 'prop-006',
    title: 'Desert Vacant Ranch Land',
    description: 'Spacious vacant ranch land in desert landscape. Empty land ready for development with stunning sunset views and complete privacy.',
    location: 'Phoenix, AZ',
    price: 280,
    size: 7200,
    status: 'Available',
    type: 'Agricultural',
    imageUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80',
    features: ['Privacy', 'Desert Views', 'Large Parcel'],
    companyId: 'company-002'
  },
  // Coastal Realty Co
  {
    id: 'prop-007',
    title: 'Beachfront Vacant Paradise',
    description: 'Prime beachfront vacant land with direct ocean access. Empty lot cleared and ready for luxury coastal development.',
    location: 'San Diego, CA',
    price: 1050,
    size: 3200,
    status: 'Available',
    type: 'Residential',
    imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
    features: ['Beachfront', 'Sunset Views', 'Luxury Zone'],
    companyId: 'company-003'
  },
  {
    id: 'prop-008',
    title: 'Suburban Vacant Residential Lot',
    description: 'Perfect empty lot in established neighborhood. This vacant land is cleared, level, and ready for your custom home build.',
    location: 'Charleston, SC',
    price: 380,
    size: 1800,
    status: 'Available',
    type: 'Residential',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    features: ['Established Area', 'Level Ground', 'Quiet Street'],
    companyId: 'company-003'
  }
];

export const applications: Application[] = [
  {
    id: 'app-001',
    propertyId: 'prop-001',
    userId: 'user-001',
    applicantName: 'John Anderson',
    applicantEmail: 'john.anderson@email.com',
    applicantPhone: '+1 (555) 123-4567',
    applicantAddress: '123 Main St, Miami, FL 33101',
    offerAmount: 850000,
    financingMethod: 'Cash Payment',
    intendedUse: 'Building a luxury beachfront residence',
    status: 'Pending',
    dateApplied: '2026-01-15',
    documents: {
      idDocument: 'john_anderson_id.pdf',
      proofOfFunds: 'john_anderson_bank_statement.pdf'
    },
    companyId: 'company-001'
  },
  {
    id: 'app-002',
    propertyId: 'prop-002',
    userId: 'user-002',
    applicantName: 'Sarah Mitchell',
    applicantEmail: 'sarah.mitchell@email.com',
    applicantPhone: '+1 (555) 234-5678',
    applicantAddress: '456 Oak Ave, Austin, TX 78701',
    offerAmount: 1200000,
    financingMethod: 'Mortgage/Loan',
    intendedUse: 'Commercial office building development',
    status: 'Approved',
    dateApplied: '2026-01-12',
    documents: {
      idDocument: 'sarah_mitchell_id.pdf',
      proofOfFunds: 'sarah_mitchell_bank_statement.pdf'
    },
    companyId: 'company-001'
  },
  {
    id: 'app-003',
    propertyId: 'prop-005',
    userId: 'user-003',
    applicantName: 'Michael Chen',
    applicantEmail: 'michael.chen@email.com',
    applicantPhone: '+1 (555) 345-6789',
    applicantAddress: '789 Pine Rd, Denver, CO 80201',
    offerAmount: 450000,
    financingMethod: 'Cash Payment',
    intendedUse: 'Organic farming operation',
    status: 'Approved',
    dateApplied: '2026-01-10',
    documents: {
      idDocument: 'michael_chen_id.pdf',
      proofOfFunds: 'michael_chen_bank_statement.pdf'
    },
    companyId: 'company-002'
  },
  {
    id: 'app-004',
    propertyId: 'prop-007',
    userId: 'user-004',
    applicantName: 'Emily Rodriguez',
    applicantEmail: 'emily.rodriguez@email.com',
    applicantPhone: '+1 (555) 456-7890',
    applicantAddress: '321 Elm St, San Diego, CA 92101',
    offerAmount: 1000000,
    financingMethod: 'Mixed (Cash + Loan)',
    intendedUse: 'Luxury vacation home construction',
    status: 'Rejected',
    dateApplied: '2026-01-08',
    documents: {
      idDocument: 'emily_rodriguez_id.pdf',
      proofOfFunds: 'emily_rodriguez_bank_statement.pdf'
    },
    companyId: 'company-003'
  },
  {
    id: 'app-005',
    propertyId: 'prop-008',
    userId: 'user-005',
    applicantName: 'David Thompson',
    applicantEmail: 'david.thompson@email.com',
    applicantPhone: '+1 (555) 567-8901',
    applicantAddress: '654 Maple Dr, Charleston, SC 29401',
    offerAmount: 380000,
    financingMethod: 'Installment Plan',
    intendedUse: 'Family home construction',
    status: 'Pending',
    dateApplied: '2026-01-14',
    documents: {
      idDocument: 'david_thompson_id.pdf',
      proofOfFunds: 'david_thompson_bank_statement.pdf'
    },
    companyId: 'company-003'
  }
];

export const users: User[] = [
  // Delka Properties users
  {
    id: 'user-001',
    name: 'John Anderson',
    email: 'john.anderson@email.com',
    phone: '+1 (555) 123-4567',
    role: 'Client',
    status: 'Active',
    registeredDate: '2025-12-01',
    companyId: 'company-001'
  },
  {
    id: 'user-002',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@email.com',
    phone: '+1 (555) 234-5678',
    role: 'Client',
    status: 'Active',
    registeredDate: '2025-11-15',
    companyId: 'company-001'
  },
  {
    id: 'admin-001',
    name: 'Robert Chen',
    email: 'robert.chen@delkaproperties.com',
    phone: '+1 (555) 100-0001',
    role: 'Admin',
    status: 'Active',
    registeredDate: '2025-01-01',
    companyId: 'company-001'
  },
  // Summit Land Group users
  {
    id: 'user-003',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 345-6789',
    role: 'Client',
    status: 'Active',
    registeredDate: '2025-10-20',
    companyId: 'company-002'
  },
  {
    id: 'admin-002',
    name: 'Jennifer Martinez',
    email: 'jennifer.m@summitland.com',
    phone: '+1 (555) 200-0002',
    role: 'Admin',
    status: 'Active',
    registeredDate: '2025-02-15',
    companyId: 'company-002'
  },
  // Coastal Realty Co users
  {
    id: 'user-004',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '+1 (555) 456-7890',
    role: 'Client',
    status: 'Inactive',
    registeredDate: '2025-09-05',
    companyId: 'company-003'
  },
  {
    id: 'user-005',
    name: 'David Thompson',
    email: 'david.thompson@email.com',
    phone: '+1 (555) 567-8901',
    role: 'Client',
    status: 'Active',
    registeredDate: '2026-01-03',
    companyId: 'company-003'
  },
  {
    id: 'admin-003',
    name: 'Patricia Wilson',
    email: 'patricia.w@coastalrealty.com',
    phone: '+1 (555) 300-0003',
    role: 'Admin',
    status: 'Active',
    registeredDate: '2025-03-10',
    companyId: 'company-003'
  },
  // Super Admin
  {
    id: 'super-admin-001',
    name: 'System Administrator',
    email: 'admin@delkasystem.com',
    phone: '+1 (555) 000-0000',
    role: 'SuperAdmin',
    status: 'Active',
    registeredDate: '2024-01-01',
    companyId: null
  },
  {
    id: 'test-super-admin-001',
    name: 'Test Super Admin',
    email: 'superadmin@raven.com',
    phone: '+1 (555) 000-0001',
    role: 'SuperAdmin',
    status: 'Active',
    registeredDate: '2026-01-18',
    companyId: null
  },
  {
    id: 'test-admin-001',
    name: 'Test Company Admin',
    email: 'admin@delka.test',
    phone: '+1 (555) 100-0000',
    role: 'Admin',
    status: 'Active',
    registeredDate: '2026-01-18',
    companyId: 'company-001'
  },
  {
    id: 'test-client-001',
    name: 'Test Company Client',
    email: 'client@delka.test',
    phone: '+1 (555) 100-0009',
    role: 'Client',
    status: 'Active',
    registeredDate: '2026-01-18',
    companyId: 'company-001'
  }
];