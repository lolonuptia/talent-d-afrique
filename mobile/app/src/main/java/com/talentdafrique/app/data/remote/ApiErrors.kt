package com.talentdafrique.app.data.remote

import org.json.JSONObject
import retrofit2.HttpException
import java.io.IOException

/** Transforme une exception Retrofit en message lisible pour l'utilisateur. */
fun Throwable.toUserMessage(default: String): String = when (this) {
    is HttpException -> httpMessage(this, default)
    is IOException -> "Connexion impossible. Vérifie ton réseau et réessaie."
    else -> default
}

private fun httpMessage(e: HttpException, default: String): String {
    when (e.code()) {
        429 -> return "Trop de tentatives. Patiente une minute avant de réessayer."
        422 -> return "Certaines informations sont invalides. Vérifie les champs."
    }
    val detail: String? = try {
        val body = e.response()?.errorBody()?.string().orEmpty()
        JSONObject(body).opt("detail") as? String
    } catch (ex: Exception) {
        null
    }
    return when {
        !detail.isNullOrBlank() -> detail
        e.code() == 401 -> "Identifiants incorrects ou session expirée."
        e.code() == 403 -> "Action non autorisée."
        e.code() == 404 -> "Élément introuvable."
        e.code() >= 500 -> "Le serveur rencontre un problème. Réessaie plus tard."
        else -> default
    }
}