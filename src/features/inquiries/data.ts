import "server-only";
import { isDemoMode } from "@/lib/env";
import { mockInquiryRepository } from "./mock-repository";
import type { InquiryRepository } from "./repository";
import { supabaseInquiryRepository } from "./supabase-repository";

/** Único punto de entrada a los datos de consultas desde servidor. */
export function inquiries(): InquiryRepository {
  return isDemoMode() ? mockInquiryRepository : supabaseInquiryRepository;
}
