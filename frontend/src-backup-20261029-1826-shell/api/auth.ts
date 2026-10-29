import { apiClient } from './client'
import type { ProfileType } from '../types/profile'

export interface RegisterPayload {
  nom: string
  email: string
  mot_de_passe: string
  type_profil: ProfileType
  consentement: boolean
  consent_version: string
}

export interface LoginPayload {
  email: string
  mot_de_passe: string
}

export interface UserOut {
  id: string
  nom: string
  email: string
  type_profil: string
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export async function registerUser(payload: RegisterPayload): Promise<UserOut> {
  const { data } = await apiClient.post<UserOut>('/auth/register', payload)
  return data
}

export async function loginUser(payload: LoginPayload): Promise<Token> {
  const { data } = await apiClient.post<Token>('/auth/login', payload)
  return data
}