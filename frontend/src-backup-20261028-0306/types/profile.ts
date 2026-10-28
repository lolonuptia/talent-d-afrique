export type ProfileType = 'etudiant' | 'entreprise' | 'ecole' | 'freelance'

export const PROFILES: { id: ProfileType; label: string; description: string }[] = [
  {
    id: 'etudiant',
    label: 'Étudiant / Candidat',
    description: 'Trouvez un stage, un CDD ou un CDI adapté à votre profil.',
  },
  {
    id: 'entreprise',
    label: 'Entreprise',
    description: 'Publiez vos offres et trouvez les meilleurs profils, triés par compatibilité.',
  },
  {
    id: 'ecole',
    label: 'École',
    description: 'Orientez vos étudiants vers les opportunités les plus adaptées.',
  },
  {
    id: 'freelance',
    label: 'Freelance',
    description: 'Trouvez des missions correspondant à vos compétences et disponibilités.',
  },
]