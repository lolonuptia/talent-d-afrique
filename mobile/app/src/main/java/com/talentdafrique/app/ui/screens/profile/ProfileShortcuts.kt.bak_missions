package com.talentdafrique.app.ui.screens.profile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.talentdafrique.app.ui.navigation.Routes

@Composable
fun ProfileShortcuts(onNavigate: (String) -> Unit) {
    val items = listOf(
        "Mes favoris" to Routes.FAVORIS,
        "Mes entretiens" to Routes.ENTRETIENS,
        "Messages" to Routes.MESSAGES,
        "Mes certifications" to Routes.CERTIFICATIONS,
        "Mon portfolio" to Routes.PORTFOLIO,
        "Mon école" to Routes.ECOLE,
    )
    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp)) {
        items.forEach { (label, route) ->
            OutlinedButton(
                onClick = { onNavigate(route) },
                shape = MaterialTheme.shapes.medium,
                modifier = Modifier.fillMaxWidth().height(48.dp).padding(top = 0.dp),
            ) { Text(label) }
            androidx.compose.foundation.layout.Spacer(Modifier.height(8.dp))
        }
    }
}