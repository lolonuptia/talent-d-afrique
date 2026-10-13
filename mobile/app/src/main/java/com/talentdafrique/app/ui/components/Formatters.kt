package com.talentdafrique.app.ui.components

/** "2026-10-20T14:00:00" -> "20/10/2026 à 14:00" */
fun formatDateHeure(iso: String?): String {
    if (iso.isNullOrBlank()) return ""
    val d = iso.take(10).split("-")
    val h = iso.drop(11).take(5)
    if (d.size != 3) return iso
    val date = "${d[2]}/${d[1]}/${d[0]}"
    return if (h.isNotBlank()) "$date à $h" else date
}

/** "2024-05-12" -> "12/05/2024" */
fun formatDate(iso: String?): String {
    if (iso.isNullOrBlank()) return ""
    val d = iso.take(10).split("-")
    return if (d.size == 3) "${d[2]}/${d[1]}/${d[0]}" else iso
}

fun libelleMode(mode: String): String = when (mode) {
    "visio" -> "Visioconférence"
    "presentiel" -> "Présentiel"
    "telephone" -> "Téléphone"
    else -> mode
}

fun libelleStatutEntretien(statut: String): String = when (statut) {
    "planifie" -> "Planifié"
    "annule" -> "Annulé"
    "termine" -> "Terminé"
    else -> statut
}
/** 150000.0 -> "150 000 FCFA" */
fun formatMontant(v: Double): String =
    String.format(java.util.Locale.FRANCE, "%,.0f", v).replace('\u202f', ' ').replace('\u00a0', ' ') + " FCFA"