$base = "http://localhost:8000/api"

function Login($email) {
  $s = $null
  Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" `
    -Body (@{ email = $email; mot_de_passe = "password" } | ConvertTo-Json) -SessionVariable s | Out-Null
  return $s
}
function Check($nom, $ok) {
  if ($ok) { Write-Host "OK        $nom" -ForegroundColor Green }
  else     { Write-Host "INATTENDU $nom" -ForegroundColor Red }
}

# 1. L'etudiant se rend visible
$etu = Login "etudiant@tiba.com"
Invoke-RestMethod -Method Put -Uri "$base/profiles/me" -WebSession $etu -ContentType "application/json" `
  -Body (@{ competences = "Python, SQL"; disponibilite = "immediate"; visible_aux_entreprises = $true } | ConvertTo-Json) | Out-Null

# 2. L'entreprise cherche
$ent = Login "entreprise@tiba.com"
$r = Invoke-RestMethod -Uri "$base/talents?competence=python" -WebSession $ent
Check "entreprise trouve l'etudiant visible" ($null -ne $r -and @($r).Count -ge 1 -and $r[0].type_profil -eq "etudiant")
Check "aucun email dans la reponse" (-not (($r | ConvertTo-Json -Depth 5) -match "@"))
$r2 = Invoke-RestMethod -Uri "$base/talents?competence=cobol" -WebSession $ent
Check "competence absente : 0 resultat" (@($r2).Count -eq 0)

# 3. L'etudiant n'a pas le droit
try { Invoke-RestMethod -Uri "$base/talents" -WebSession $etu; Check "etudiant refuse (403)" $false }
catch { Check "etudiant refuse (403)" ($_.Exception.Response.StatusCode.value__ -eq 403) }

# 4. L'etudiant se masque : l'entreprise ne le voit plus
Invoke-RestMethod -Method Put -Uri "$base/profiles/me" -WebSession $etu -ContentType "application/json" `
  -Body (@{ visible_aux_entreprises = $false } | ConvertTo-Json) | Out-Null
$r3 = Invoke-RestMethod -Uri "$base/talents?competence=python" -WebSession $ent
Check "profil masque : 0 resultat" (@($r3).Count -eq 0)