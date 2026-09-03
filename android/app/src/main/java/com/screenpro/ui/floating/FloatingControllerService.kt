package com.screenpro.ui.floating

import android.app.Service
import android.content.Intent
import android.os.IBinder

/**
 * FloatingControllerService
 * Hosts the PiP camera preview and overlay recording controls.
 */
class FloatingControllerService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null
}
