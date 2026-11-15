package com.talentdafrique.app.ui.screens.offres

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.OffreDto
import com.talentdafrique.app.data.repository.OffresRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OffresListUiState(
    val isLoading: Boolean = true,
    val offres: List<OffreDto> = emptyList(),
    val errorMessage: String? = null,
    val selectedType: String? = null,
    val query: String = "",
) {
    /** Offres filtrees par la recherche (titre, lieu, description, competences). */
    val visibles: List<OffreDto>
        get() {
            val q = query.trim().lowercase()
            if (q.isEmpty()) return offres
            return offres.filter { o ->
                listOfNotNull(
                    o.titre, o.localisation, o.description,
                    o.competencesObligatoires, o.competencesSouhaitees,
                ).any { it.lowercase().contains(q) }
            }
        }
}

@HiltViewModel
class OffresListViewModel @Inject constructor(
    private val offresRepository: OffresRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(OffresListUiState())
    val uiState: StateFlow<OffresListUiState> = _uiState.asStateFlow()

    init {
        loadOffres()
    }

    fun onTypeFilterSelected(type: String?) {
        _uiState.value = _uiState.value.copy(selectedType = type)
        loadOffres()
    }

    fun onQueryChange(query: String) {
        _uiState.value = _uiState.value.copy(query = query)
    }

    fun loadOffres() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val result = offresRepository.listOffres(typeContrat = _uiState.value.selectedType)) {
                is Result.Success -> _uiState.value = _uiState.value.copy(isLoading = false, offres = result.data)
                is Result.Error -> _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = result.message)
            }
        }
    }
}
