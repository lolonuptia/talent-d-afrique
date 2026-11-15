package com.talentdafrique.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.OffreDto
import com.talentdafrique.app.data.repository.AuthRepository
import com.talentdafrique.app.data.repository.OffresRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class EtudiantHomeUiState(
    val isLoading: Boolean = true,
    val offres: List<OffreDto> = emptyList(),
    val errorMessage: String? = null,
    val prenom: String? = null,
)

@HiltViewModel
class EtudiantHomeViewModel @Inject constructor(
    private val offresRepository: OffresRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(EtudiantHomeUiState())
    val uiState: StateFlow<EtudiantHomeUiState> = _uiState.asStateFlow()

    init {
        loadOffresRecommandees()
        loadPrenom()
    }

    private fun loadPrenom() {
        viewModelScope.launch {
            val r = authRepository.me()
            if (r is Result.Success) {
                val prenom = r.data.nom.trim().substringBefore(" ")
                _uiState.value = _uiState.value.copy(prenom = prenom.ifBlank { null })
            }
        }
    }

    fun loadOffresRecommandees() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val result = offresRepository.getOffresRecommandees()) {
                is Result.Success -> _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    // Le backend renvoie toutes les offres actives triees par score : on garde celles au-dessus du seuil.
                    offres = result.data.filter { it.recommandee == true },
                )
                is Result.Error -> _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = result.message)
            }
        }
    }
}
