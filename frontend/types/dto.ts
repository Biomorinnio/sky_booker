/**
 * Data Transfer Objects (DTOs) for SkyBooker API
 * Used for request/response payloads between frontend and backend
 * TODO: Backend integration - sync with API contracts
 */

import {
  UserRole,
  FlightStatus,
  BookingStatus,
  PaymentMethod,
  SeatClass,
  ServiceType,
  LoyaltyTier,
} from "./database";

// ==================== AUTH DTOs ====================

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
  expiresIn: number;
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
  documentExpiry: string;
}

export interface RegisterResponseDTO {
  user: UserDTO;
  message: string;
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

export interface RefreshTokenResponseDTO {
  accessToken: string;
  expiresIn: number;
}

// ==================== USER DTOs ====================

export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
  documentExpiry: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  loyaltyAccount?: LoyaltyAccountDTO;
  createdAt: string;
}

export interface UpdateUserRequestDTO {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  nationality?: string;
  documentType?: string;
  documentNumber?: string;
  documentExpiry?: string;
}

export interface ChangePasswordRequestDTO {
  currentPassword: string;
  newPassword: string;
}

// ==================== FLIGHT DTOs ====================

export interface FlightSearchRequestDTO {
  originAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  class?: SeatClass;
}

export interface FlightSearchResponseDTO {
  flights: FlightDTO[];
  totalResults: number;
  searchParams: FlightSearchRequestDTO;
}

export interface FlightDTO {
  id: string;
  flightNumber: string;
  aircraft: {
    model: string;
    registrationNumber: string;
  };
  origin: AirportDTO;
  destination: AirportDTO;
  scheduledDeparture: string;
  scheduledArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  status: FlightStatus;
  duration: number;
  availableSeats: number;
  fares: FareDTO[];
  gate?: string;
  terminal?: string;
}

export interface AirportDTO {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
}

export interface FareDTO {
  id: string;
  class: SeatClass;
  price: number;
  currency: string;
  availableSeats: number;
  baggage: {
    cabin: string;
    checked: string;
  };
  isRefundable: boolean;
  isChangeable: boolean;
  cancellationFee: number;
  changeFee: number;
  features: string[];
}

// ==================== BOOKING DTOs ====================

export interface CreateBookingRequestDTO {
  flightId: string;
  fareId: string;
  passengers: PassengerInfoDTO[];
  contactInfo: {
    email: string;
    phone: string;
    countryCode: string;
  };
  additionalServices?: {
    serviceId: string;
    quantity: number;
  }[];
}

export interface PassengerInfoDTO {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: "male" | "female";
  documentType: string;
  documentNumber: string;
  documentExpiry: string;
  nationality: string;
}

export interface CreateBookingResponseDTO {
  booking: BookingDTO;
  message: string;
}

export interface BookingDTO {
  id: string;
  pnr: string;
  flight: FlightDTO;
  fare: FareDTO;
  passengers: PassengerInfoDTO[];
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  additionalServices: BookingServiceDTO[];
  payment?: PaymentDTO;
  createdAt: string;
  updatedAt: string;
}

export interface BookingServiceDTO {
  id: string;
  service: {
    id: string;
    type: ServiceType;
    name: string;
    description: string;
  };
  quantity: number;
  totalPrice: number;
  currency: string;
}

export interface UpdateBookingRequestDTO {
  passengers?: PassengerInfoDTO[];
  contactInfo?: {
    email: string;
    phone: string;
  };
}

export interface CancelBookingRequestDTO {
  reason: string;
}

export interface CancelBookingResponseDTO {
  booking: BookingDTO;
  refundAmount: number;
  message: string;
}

// ==================== PAYMENT DTOs ====================

export interface CreatePaymentRequestDTO {
  bookingId: string;
  method: PaymentMethod;
  cardDetails?: {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
}

export interface CreatePaymentResponseDTO {
  payment: PaymentDTO;
  redirectUrl?: string;
  message: string;
}

export interface PaymentDTO {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

// ==================== ADDITIONAL SERVICES DTOs ====================

export interface AdditionalServiceDTO {
  id: string;
  type: ServiceType;
  name: string;
  description: string;
  price: number;
  currency: string;
  applicableClasses: SeatClass[];
}

export interface GetServicesRequestDTO {
  flightId: string;
  fareClass: SeatClass;
}

export interface GetServicesResponseDTO {
  services: AdditionalServiceDTO[];
}

// ==================== LOYALTY DTOs ====================

export interface LoyaltyAccountDTO {
  id: string;
  membershipNumber: string;
  tier: LoyaltyTier;
  points: number;
  lifetimePoints: number;
  tierExpiryDate: string;
  benefits: string[];
}

export interface EarnPointsRequestDTO {
  bookingId: string;
}

export interface EarnPointsResponseDTO {
  pointsEarned: number;
  newBalance: number;
  message: string;
}

// ==================== SEAT SELECTION DTOs ====================

export interface GetSeatsRequestDTO {
  flightId: string;
  fareClass: SeatClass;
}

export interface SeatDTO {
  id: string;
  seatNumber: string;
  class: SeatClass;
  row: number;
  column: string;
  isWindow: boolean;
  isAisle: boolean;
  isEmergencyExit: boolean;
  extraLegroom: boolean;
  status: "available" | "occupied" | "blocked";
  price?: number;
}

export interface GetSeatsResponseDTO {
  seats: SeatDTO[];
  layout: {
    rows: number;
    columns: string[];
  };
}

export interface SelectSeatRequestDTO {
  ticketId: string;
  seatId: string;
}

export interface SelectSeatResponseDTO {
  ticket: {
    id: string;
    seatNumber: string;
  };
  message: string;
}

// ==================== EMPLOYEE/AGENT DTOs ====================

export interface FlightStatisticsDTO {
  flightId: string;
  flightNumber: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  occupancyRate: number;
  revenue: number;
  currency: string;
}

export interface DashboardStatsDTO {
  totalFlights: number;
  totalBookings: number;
  totalRevenue: number;
  averageOccupancy: number;
  topRoutes: {
    route: string;
    bookings: number;
  }[];
  recentBookings: BookingDTO[];
}

export interface CreateFlightRequestDTO {
  scheduleId: string;
  flightNumber: string;
  aircraftId: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  gate?: string;
  terminal?: string;
}

export interface UpdateFlightStatusRequestDTO {
  status: FlightStatus;
  actualDeparture?: string;
  actualArrival?: string;
  gate?: string;
  terminal?: string;
}

// ==================== ERROR DTOs ====================

export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

export interface ValidationErrorDTO {
  field: string;
  message: string;
}

// ==================== PAGINATION DTOs ====================

export interface PaginationRequestDTO {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
