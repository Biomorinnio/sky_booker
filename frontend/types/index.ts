export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  aircraftType: string;
  availableSeats: number;
  stops: number;
}

export interface Fare {
  id: string;
  flightId: string;
  type: FareType;
  price: number;
  currency: string;
  baggage: BaggageInfo;
  refundable: boolean;
  changeable: boolean;
  features: string[];
}

export type FareType = "Economy" | "Comfort" | "Business";

export interface BaggageInfo {
  cabin: string;
  checked: string;
}

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: "male" | "female";
  documentType: DocumentType;
  documentNumber: string;
  documentExpiry: string;
  nationality: string;
  email?: string;
  phone?: string;
}

export type DocumentType = "passport" | "id_card" | "birth_certificate";

export interface Booking {
  id: string;
  pnr: string;
  flightId: string;
  fareId: string;
  passengers: Passenger[];
  contactInfo: ContactInfo;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  paymentId?: string;
}

export type BookingStatus =
  | "created"
  | "pending_payment"
  | "paid"
  | "cancelled"
  | "completed";

export interface ContactInfo {
  email: string;
  phone: string;
  countryCode: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export type PaymentMethod =
  | "card"
  | "paypal"
  | "bank_transfer"
  | "apple_pay"
  | "google_pay";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded";

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: PassengerCount;
  fareType?: FareType;
}

export interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

export interface FlightSearchResult {
  flights: Flight[];
  fares: Record<string, Fare[]>;
  searchParams: FlightSearchParams;
  totalResults: number;
}

export interface FlightFilters {
  priceRange?: [number, number];
  airlines?: string[];
  departureTimeRange?: [string, string];
  stops?: number[];
  fareTypes?: FareType[];
}

export type SortOption =
  | "price_asc"
  | "price_desc"
  | "duration_asc"
  | "duration_desc"
  | "departure_asc"
  | "departure_desc";
