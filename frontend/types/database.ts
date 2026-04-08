/**
 * Database entities for SkyBooker airline information system
 * Designed for relational database (PostgreSQL/MySQL)
 * TODO: Backend integration - replace with actual database models
 */

// ==================== ENUMS ====================

export enum UserRole {
  PASSENGER = "passenger",
  AGENT = "agent",
  EMPLOYEE = "employee",
  ADMIN = "admin",
}

export enum FlightStatus {
  SCHEDULED = "scheduled",
  CANCELLED = "cancelled",
  DELAYED = "delayed",
}

export enum BookingStatus {
  CREATED = "created",
  PENDING_PAYMENT = "pending_payment",
  CONFIRMED = "confirmed",
  CHECKED_IN = "checked_in",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  CARD = "card",
  APPLE_PAY = "apple_pay",
  GOOGLE_PAY = "google_pay",
  BANK_TRANSFER = "bank_transfer",
  PAYPAL = "paypal",
}

export enum SeatClass {
  ECONOMY = "economy",
  COMFORT = "comfort",
  BUSINESS = "business",
  FIRST = "first",
}

export enum SeatStatus {
  AVAILABLE = "available",
  OCCUPIED = "occupied",
  BLOCKED = "blocked",
}

export enum LoyaltyTier {
  BRONZE = "bronze",
  SILVER = "silver",
  GOLD = "gold",
  PLATINUM = "platinum",
}

export enum ServiceType {
  BAGGAGE = "baggage",
  MEAL = "meal",
  SEAT_SELECTION = "seat_selection",
  PRIORITY_BOARDING = "priority_boarding",
  LOUNGE_ACCESS = "lounge_access",
  INSURANCE = "insurance",
}

// ==================== TABLE 1: USERS ====================

export interface User {
  id: string;
  email: string;
  passwordHash: string;
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
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  // Relations
  loyaltyAccountId?: string; // FK to LoyaltyAccounts
}

// ==================== TABLE 2: ROLES ====================

export interface Role {
  id: string;
  name: UserRole;
  description: string;
  permissions: string[]; // JSON array of permission strings
  createdAt: string;
  updatedAt: string;
}

// ==================== TABLE 3: AIRPORTS ====================

export interface Airport {
  id: string;
  code: string; // IATA code (e.g., "SVO")
  name: string;
  city: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== TABLE 4: AIRCRAFTS ====================

export interface Aircraft {
  id: string;
  registrationNumber: string;
  model: string;
  manufacturer: string;
  yearManufactured: number;
  totalSeats: number;
  economySeats: number;
  comfortSeats: number;
  businessSeats: number;
  firstClassSeats: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== TABLE 5: ROUTES ====================

export interface Route {
  id: string;
  originAirportId: string; // FK to Airports
  destinationAirportId: string; // FK to Airports
  distance: number; // in kilometers
  estimatedDuration: number; // in minutes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== TABLE 6: SCHEDULES ====================

export interface Schedule {
  id: string;
  routeId: string; // FK to Routes
  aircraftId: string; // FK to Aircrafts
  flightNumber: string;
  departureTime: string; // Time of day (e.g., "08:00")
  arrivalTime: string; // Time of day (e.g., "10:30")
  daysOfWeek: number[]; // [1,2,3,4,5] for Mon-Fri
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== TABLE 7: FLIGHTS ====================

export interface Flight {
  id: string;
  scheduleId: string; // FK to Schedules
  flightNumber: string;
  aircraftId: string; // FK to Aircrafts
  originAirportId: string; // FK to Airports
  destinationAirportId: string; // FK to Airports
  scheduledDeparture: string;
  scheduledArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  status: FlightStatus;
  gate?: string;
  terminal?: string;
  availableSeats: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== TABLE 8: FARES ====================

export interface Fare {
  id: string;
  flightId: string; // FK to Flights
  class: SeatClass;
  basePrice: number;
  currency: string;
  availableSeats: number;
  baggageAllowance: {
    cabin: string;
    checked: string;
  };
  isRefundable: boolean;
  isChangeable: boolean;
  cancellationFee: number;
  changeFee: number;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

// ==================== TABLE 9: BOOKINGS ====================

export interface Booking {
  id: string;
  pnr: string; // Passenger Name Record
  userId: string; // FK to Users
  flightId: string; // FK to Flights
  fareId: string; // FK to Fares
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  bookedBy: string; // userId of agent/passenger who made booking
  bookedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  paymentId?: string; // FK to Payments
}

// ==================== TABLE 10: TICKETS ====================

export interface Ticket {
  id: string;
  ticketNumber: string;
  bookingId: string; // FK to Bookings
  passengerId: string; // FK to Users
  flightId: string; // FK to Flights
  fareId: string; // FK to Fares
  seatNumber?: string;
  boardingGroup?: string;
  isCheckedIn: boolean;
  checkedInAt?: string;
  boardingPassUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== TABLE 11: PAYMENTS ====================

export interface Payment {
  id: string;
  bookingId: string; // FK to Bookings
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  providerResponse?: string; // JSON
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== TABLE 12: LOYALTY_ACCOUNTS ====================

export interface LoyaltyAccount {
  id: string;
  userId: string; // FK to Users
  membershipNumber: string;
  tier: LoyaltyTier;
  points: number;
  lifetimePoints: number;
  tierExpiryDate: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== TABLE 13: ADDITIONAL_SERVICES ====================

export interface AdditionalService {
  id: string;
  type: ServiceType;
  name: string;
  description: string;
  price: number;
  currency: string;
  isActive: boolean;
  applicableClasses: SeatClass[];
  createdAt: string;
  updatedAt: string;
}

// ==================== TABLE 14: BOOKING_SERVICES ====================

export interface BookingService {
  id: string;
  bookingId: string; // FK to Bookings
  serviceId: string; // FK to AdditionalServices
  quantity: number;
  totalPrice: number;
  currency: string;
  createdAt: string;
}

// ==================== TABLE 15: SEATS ====================

export interface Seat {
  id: string;
  aircraftId: string; // FK to Aircrafts
  seatNumber: string;
  class: SeatClass;
  row: number;
  column: string;
  isWindow: boolean;
  isAisle: boolean;
  isEmergencyExit: boolean;
  extraLegroom: boolean;
  status: SeatStatus;
  createdAt: string;
  updatedAt: string;
}

// ==================== TABLE 16: FLIGHT_CREW ====================

export interface FlightCrew {
  id: string;
  flightId: string; // FK to Flights
  employeeId: string; // FK to Users (role: employee)
  position: string; // pilot, co-pilot, flight_attendant
  createdAt: string;
}

// ==================== ADDITIONAL TYPES ====================

export interface FlightSearchFilters {
  originAirportId?: string;
  destinationAirportId?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: {
    adults: number;
    children: number;
    infants: number;
  };
  class?: SeatClass;
  maxStops?: number;
  airlines?: string[];
  priceRange?: [number, number];
  departureTimeRange?: [string, string];
}

export interface BookingDetails extends Booking {
  flight: Flight;
  fare: Fare;
  tickets: Ticket[];
  payment?: Payment;
  services: BookingService[];
  user: User;
}

export interface FlightDetails extends Flight {
  aircraft: Aircraft;
  originAirport: Airport;
  destinationAirport: Airport;
  fares: Fare[];
  availableFares: Fare[];
}
