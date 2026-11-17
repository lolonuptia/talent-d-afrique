package com.talentdafrique.app.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.repository.AuthRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class VerifyCodeUiState(
    val code: String = "",
    val email: String = "",
    val checking: Boolean = true,
    val loadFailed: Boolean = false,
    val isLoading: Boolean = false,
    val resendIn: Int = 0,
    val message: String? = null,
    val errorMessage: String? = null,
    val verified: Boolean = false,
    val wrongRole: Boolean = false,
)

@HiltViewModel
class VerifyCodeViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _ui = MutableStateFlow(VerifyCodeUiState())
    val uiState: StateFlow<VerifyCodeUiState> = _ui.asStateFlow()
    private var countdown: Job? = null

    init { check() }

    fun check() {
        viewModelScope.launch {
            _ui.value = _ui.value.copy(checking = true, loadFailed = false, errorMessage = null)
            when (val r = authRepository.me()) {
                is Result.Success -> _ui.value =
                    if (r.data.typeProfil != com.talentdafrique.app.data.remote.dto.TypeProfil.ETUDIANT) _ui.value.copy(checking = false, wrongRole = true)
                    else if (r.data.emailVerifie) _ui.value.copy(checking = false, verified = true)
                    else _ui.value.copy(checking = false, email = r.data.email)
                is Result.Error -> _ui.value =
                    _ui.value.copy(checking = false, loadFailed = true, errorMessage = r.message)
            }
        }
    }

    fun onCode(value: String) {
        val digits = value.filter { it.isDigit() }.take(6)
        _ui.value = _ui.value.copy(code = digits, errorMessage = null, message = null)
        if (digits.length == 6) verify()
    }

    fun verify() {
        val code = _ui.value.code
        if (code.length != 6 || _ui.value.isLoading) return
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isLoading = true, errorMessage = null)
            when (val r = authRepository.verifyCode(code)) {
                is Result.Success -> _ui.value = _ui.value.copy(isLoading = false, verified = true)
                is Result.Error -> _ui.value =
                    _ui.value.copy(isLoading = false, code = "", errorMessage = r.message)
            }
        }
    }

    fun resend() {
        if (_ui.value.resendIn > 0) return
        viewModelScope.launch {
            _ui.value = _ui.value.copy(errorMessage = null, message = null)
            when (val r = authRepository.resendCode()) {
                is Result.Success -> {
                    _ui.value = _ui.value.copy(message = "Un nouveau code vient d'être envoyé.", code = "")
                    startCountdown()
                }
                is Result.Error -> _ui.value = _ui.value.copy(errorMessage = r.message)
            }
        }
    }

    private fun startCountdown() {
        countdown?.cancel()
        countdown = viewModelScope.launch {
            for (s in 60 downTo 1) {
                _ui.value = _ui.value.copy(resendIn = s)
                delay(1000)
            }
            _ui.value = _ui.value.copy(resendIn = 0)
        }
    }

    fun logout(onDone: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            onDone()
        }
    }
}