import "server-only";
import { mockInquiryRepository } from "./mock-repository";
import type { InquiryRepository } from "./repository";

/** Único punto de entrada a los datos de consultas desde servidor. */
export function inquiries(): InquiryRepository {
  return mockInquiryRepository;
}
