package com.talentdafrique.app.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.repository.AuthRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ForgotPasswordUiState(
    val step: Int = 1,
    val email: String = "",
    val code: String = "",
    val motDePasse: String = "",
    val confirmation: String = "",
    val isLoading: Boolean = false,
    val message: String? = null,
    val errorMessage: String? = null,
    val done: Boolean = false,
)

@HiltViewModel
class ForgotPasswordViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {
    private val _ui = MutableStateFlow(ForgotPasswordUiState())
    val uiState: StateFlow<ForgotPasswordUiState> = _ui.asStateFlow()

    fun onEmail(v: String) { _ui.value = _ui.value.copy(email = v, errorMessage = null) }
    fun onCode(v: String) { _ui.value = _ui.value.copy(code = v.filter { it.isDigit() }.take(6), errorMessage = null) }
    fun onMotDePasse(v: String) { _ui.value = _ui.value.copy(motDePasse = v, errorMessage = null) }
    fun onConfirmation(v: String) { _ui.value = _ui.value.copy(confirmation = v, errorMessage = null) }

    fun envoyerCode() {
        val s = _ui.value
        if (s.email.isBlank()) {
            _ui.value = s.copy(errorMessage = "Renseigne ton email.")
            return
        }
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isLoading = true, errorMessage = null)
            when (val r = authRepository.forgotPassword(s.email.trim())) {
                is Result.Success -> _ui.value = _ui.value.copy(
                    isLoading = false, step = 2,
                    message = "Si un compte existe pour cet email, un code à 6 chiffres vient d'être envoyé.",
                )
                is Result.Error -> _ui.value = _ui.value.copy(isLoading = false, errorMessage = r.message)
            }
        }
    }

    fun reinitialiser() {
        val s = _ui.value
        when {
            s.code.length != 6 -> { _ui.value = s.copy(errorMessage = "Le code contient 6 chiffres."); return }
            s.motDePasse.length < 8 -> { _ui.value = s.copy(errorMessage = "Le mot de passe doit contenir au moins 8 caractères."); return }
            s.motDePasse != s.confirmation -> { _ui.value = s.copy(errorMessage = "Les mots de passe ne correspondent pas."); return }
        }
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isLoading = true, errorMessage = null)
            when (val r = authRepository.resetPassword(s.email.trim(), s.code, s.motDePasse)) {
                is Result.Success -> _ui.value = _ui.value.copy(isLoading = false, done = true)
                is Result.Error -> _ui.value = _ui.value.copy(isLoading = false, errorMessage = r.message)
            }
        }
    }
}