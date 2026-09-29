import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 환경변수 우선 적용, 없을 경우 기본 프로젝트 연동 키 사용 (Supabase anon key는 브라우저 공개용 public key입니다)
const DEFAULT_SUPABASE_URL = 'https://zfrbxtbpvmlbgkdgciku.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmcmJ4dGJwdm1sYmdrZGdjaWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2Mjk1MDYsImV4cCI6MjEwNjIwNTUwNn0.093PeV6ginnXLMsRuFepK1AJCChOYuwmhf5z1OECj5o';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

/**
 * Supabase 접속 설정이 정상적으로 되어 있는지 여부
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    typeof supabaseUrl === 'string' &&
      supabaseUrl.trim() !== '' &&
      !supabaseUrl.includes('your-project') &&
      typeof supabaseAnonKey === 'string' &&
      supabaseAnonKey.trim() !== '' &&
      !supabaseAnonKey.includes('your-anon-public-key')
  );
};

/**
 * Supabase 싱글톤 클라이언트 인스턴스
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
