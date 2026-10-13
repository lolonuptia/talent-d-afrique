package com.talentdafrique.app.ui.screens.auth

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun ForgotPasswordScreen(
    onDone: () -> Unit,
    viewModel: ForgotPasswordViewModel = hiltViewModel(),
) {
    val ui by viewModel.uiState.collectAsState()
    LaunchedEffect(ui.done) { if (ui.done) onDone() }

    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp)) {
        if (ui.step == 1) {
            Text("Mot de passe oublié", style = MaterialTheme.typography.titleLarge)
            Text(
                "Entre l'email de ton compte, nous t'enverrons un code à 6 chiffres.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 8.dp, bottom = 16.dp),
            )
            OutlinedTextField(
                value = ui.email, onValueChange = viewModel::onEmail,
                label = { Text("Email") }, singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier = Modifier.fillMaxWidth(),
            )
        } else {
            Text("Nouveau mot de passe", style = MaterialTheme.typography.titleLarge)
            ui.message?.let {
                Text(
                    it, style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 8.dp, bottom = 16.dp),
                )
            }
            OutlinedTextField(
                value = ui.code, onValueChange = viewModel::onCode,
                label = { Text("Code à 6 chiffres") }, singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = ui.motDePasse, onValueChange = viewModel::onMotDePasse,
                label = { Text("Nouveau mot de passe") }, singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
            )
            OutlinedTextField(
                value = ui.confirmation, onValueChange = viewModel::onConfirmation,
                label = { Text("Confirmer le mot de passe") }, singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
            )
        }

        ui.errorMessage?.let {
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 12.dp))
        }

        Button(
            onClick = { if (ui.step == 1) viewModel.envoyerCode() else viewModel.reinitialiser() },
            enabled = !ui.isLoading,
            modifier = Modifier.fillMaxWidth().padding(top = 20.dp).height(52.dp),
        ) {
            if (ui.isLoading) CircularProgressIndicator(Modifier.height(22.dp), strokeWidth = 2.5.dp)
            else Text(if (ui.step == 1) "Envoyer le code" else "Réinitialiser")
        }
    }
}