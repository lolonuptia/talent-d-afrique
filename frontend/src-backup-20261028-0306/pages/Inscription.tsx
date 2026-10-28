import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import Header from '../components/Header'
import { PROFILES, type ProfileType } from '../types/profile'
import { registerUser } from '../api/auth'

const CONSENT_VERSION = '2026-09-04'

const inscriptionSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  motDePasse: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  consentement: z.literal(true, {
    error: 'Vous devez accepter les CGU pour continuer',
  }),
})

type InscriptionForm = z.infer<typeof inscriptionSchema>

export default function Inscription() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [erreurServeur, setErreurServeur] = useState<string | null>(null)

  const profilInitial = searchParams.get('profil') as ProfileType | null
  const profil = PROFILES.find((p) => p.id === profilInitial)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InscriptionForm>({
    resolver: zodResolver(inscriptionSchema),
  })

  const onSubmit = async (data: InscriptionForm) => {
    setErreurServeur(null)

    if (!profilInitial) {
      setErreurServeur('Veuillez choisir un profil depuis la page d\'accueil.')
      return
    }

    try {
      await registerUser({
        nom: data.nom,
        email: data.email,
        mot_de_passe: data.motDePasse,
        type_profil: profilInitial,
        consentement: data.consentement,
        consent_version: CONSENT_VERSION,
      })

      navigate(`/dashboard/${profilInitial}`)
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.detail) {
        setErreurServeur(error.response.data.detail)
      } else {
        setErreurServeur('Une erreur est survenue. Veuillez réessayer.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />

      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
        {profil ? (
          <p className="mt-2 text-slate-600">
            Inscription en tant que <span className="font-medium text-blue-700">{profil.label}</span>
          </p>
        ) : (
          <p className="mt-2 text-slate-600">
            Choisissez d'abord votre profil depuis la page d'accueil.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {erreurServeur && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {erreurServeur}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">Nom complet</label>
            <input
              {...register('nom')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
            <input
              type="password"
              {...register('motDePasse')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            {errors.motDePasse && (
              <p className="mt-1 text-sm text-red-600">{errors.motDePasse.message}</p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <input type="checkbox" {...register('consentement')} className="mt-1" />
            <label className="text-sm text-slate-600">
              J'accepte les{' '}
              <a href="/cgu" target="_blank" className="text-blue-700 underline">
                conditions générales d'utilisation
              </a>{' '}
              et la{' '}
              <a href="/confidentialite" target="_blank" className="text-blue-700 underline">
                politique de confidentialité
              </a>
              .
            </label>
          </div>
          {errors.consentement && (
            <p className="text-sm text-red-600">{errors.consentement.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-700 py-2.5 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  )
}