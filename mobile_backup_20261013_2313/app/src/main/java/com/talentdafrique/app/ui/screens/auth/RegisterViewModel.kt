package com.talentdafrique.app.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.TypeProfil
import com.talentdafrique.app.data.repository.AuthRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class RegisterUiState(
    val nom: String = "",
    val email: String = "",
    val motDePasse: String = "",
    val confirmationMotDePasse: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val registerSuccess: Boolean = false,
)

/**
 * Le mobile est réservé aux étudiants (le web gère freelance/entreprise/école) —
 * type_profil est donc fixé silencieusement, pas de sélecteur exposé à l'utilisateur.
 */
@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(RegisterUiState())
    val uiState: StateFlow<RegisterUiState> = _uiState.asStateFlow()

    fun onNomChange(value: String) {
        _uiState.value = _uiState.value.copy(nom = value, errorMessage = null)
    }

    fun onEmailChange(value: String) {
        _uiState.value = _uiState.value.copy(email = value, errorMessage = null)
    }

    fun onMotDePasseChange(value: String) {
        _uiState.value = _uiState.value.copy(motDePasse = value, errorMessage = null)
    }

    fun onConfirmationMotDePasseChange(value: String) {
        _uiState.value = _uiState.value.copy(confirmationMotDePasse = value, errorMessage = null)
    }

    fun register() {
        val state = _uiState.value

        if (state.nom.isBlank() || state.email.isBlank() || state.motDePasse.isBlank()) {
            _uiState.value = state.copy(errorMessage = "Merci de remplir tous les champs.")
            return
        }
        if (state.motDePasse.length < 6) {
            _uiState.value = state.copy(errorMessage = "Le mot de passe doit contenir au moins 6 caractères.")
            return
        }
        if (state.motDePasse != state.confirmationMotDePasse) {
            _uiState.value = state.copy(errorMessage = "Les mots de passe ne correspondent pas.")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isLoading = true, errorMessage = null)
            when (
                val result = authRepository.register(
                    nom = state.nom,
                    email = state.email,
                    motDePasse = state.motDePasse,
                    typeProfil = TypeProfil.ETUDIANT,
                )
            ) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, registerSuccess = true)
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = result.message)
                }
            }
        }
    }
}