$ErrorActionPreference = "Stop"
$fe = "C:\BLTN\Lolo\talent-afrique\frontend"

function P($rel, $pattern, $repl, [switch]$Literal) {
  $p = Join-Path $fe $rel
  $t = [IO.File]::ReadAllText($p, [Text.Encoding]::UTF8)
  if ($Literal) { $pattern = [regex]::Escape($pattern) }
  $n = [regex]::Replace($t, $pattern, $repl)
  if ($n -eq $t) { Write-Host "Deja applique ou introuvable : $rel" -ForegroundColor Yellow }
  else { [IO.File]::WriteAllText($p, $n, (New-Object Text.UTF8Encoding $false)); Write-Host "OK : $rel" -ForegroundColor Green }
}

# 1. Roles web = entreprise, ecole, freelance. Un etudiant qui se connecte est renvoye vers le mobile.
P "src\auth.jsx" 'export const ROLES = \{.*?\};' 'export const ROLES = { entreprise: "Entreprise", ecole: "École", freelance: "Freelance" };'
P "src\auth.jsx" 'const loadMe = () => api(EP.me).then(setUser);' 'const loadMe = () => api(EP.me).then((u) => { if (roleOf(u) === "etudiant") { clearTokens(); throw new Error("Les étudiants utilisent l''application mobile Talent d''Afrique. Cet espace web est réservé aux entreprises, écoles et freelances."); } setUser(u); });'

# 2. Inscription : plus de choix "etudiant"
P "src\pages\Register.jsx" 'role: "etudiant"' 'role: "entreprise"' -Literal

# 3. Seuls les freelances postulent depuis le web
P "src\pages\Offres.jsx" 'const canApply = r === "etudiant" || r === "freelance";' 'const canApply = r === "freelance";' -Literal

# 4. Plus de route ni de page etudiant
P "src\App.jsx" 'import { Etudiant, Freelance, Entreprise, Ecole }' 'import { Freelance, Entreprise, Ecole }' -Literal
P "src\App.jsx" '<Route element=\{<Guard role="etudiant" />\}>.*?</Route>\s*' ''
P "src\pages\Spaces.jsx" '(?s)export function Etudiant\(\) \{.*?\r?\n\}\r?\n' ''
P "src\pages\Spaces.jsx" '(?s)function CvUpload\(\) \{.*?\r?\n\}\r?\n' ''

# 5. Texte d'accueil
P "src\App.jsx" '<p className="mt-4 max-w-xl text-stone-600">.*?</p>' '<p className="mt-4 max-w-xl text-stone-600">Entreprises, écoles et freelances : publiez des offres, suivez vos candidats et gérez vos missions. Les étudiants postulent depuis l''application mobile.</p>'

Write-Host "`nTermine. Le navigateur se met a jour tout seul (Vite)." -ForegroundColor Cyan
