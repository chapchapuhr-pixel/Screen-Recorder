package com.screenpro.audio

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioPlaybackCaptureConfiguration
import android.media.AudioRecord
import android.media.projection.MediaProjection
import android.os.Build
import androidx.annotation.RequiresApi

/**
 * AudioRecordingManager
 * Handles Android 10+ (API 29) AudioPlaybackCapture for capturing system sound,
 * simultaneous microphone recording, and real-time PCM mixing.
 */
class AudioRecordingManager(private val context: Context) {

    private var internalAudioRecord: AudioRecord? = null
    private var micAudioRecord: AudioRecord? = null
    private var isCapturing = false

    companion object {
        const val SAMPLE_RATE = 48000
        const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_STEREO
        const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    @SuppressLint("MissingPermission")
    fun createInternalAudioRecord(mediaProjection: MediaProjection): AudioRecord? {
        val config = AudioPlaybackCaptureConfiguration.Builder(mediaProjection)
            .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
            .addMatchingUsage(AudioAttributes.USAGE_GAME)
            .addMatchingUsage(AudioAttributes.USAGE_UNKNOWN)
            .build()

        val audioFormat = AudioFormat.Builder()
            .setEncoding(AUDIO_FORMAT)
            .setSampleRate(SAMPLE_RATE)
            .setChannelMask(CHANNEL_CONFIG)
            .build()

        val minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)

        return AudioRecord.Builder()
            .setAudioPlaybackCaptureConfig(config)
            .setAudioFormat(audioFormat)
            .setBufferSizeInBytes(minBufferSize * 2)
            .build().also {
                internalAudioRecord = it
            }
    }

    @SuppressLint("MissingPermission")
    fun createMicAudioRecord(): AudioRecord? {
        val minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        return AudioRecord(
            android.media.MediaRecorder.AudioSource.MIC,
            SAMPLE_RATE,
            CHANNEL_CONFIG,
            AUDIO_FORMAT,
            minBufferSize * 2
        ).also {
            micAudioRecord = it
        }
    }

    /**
     * Mixes two 16-bit PCM buffers with saturation prevention
     */
    fun mixPcm16Bit(buffer1: ByteArray, buffer2: ByteArray, output: ByteArray, length: Int) {
        for (i in 0 until length step 2) {
            val sample1 = (buffer1[i].toInt() and 0xFF) or (buffer1[i + 1].toInt() shl 8)
            val sample2 = (buffer2[i].toInt() and 0xFF) or (buffer2[i + 1].toInt() shl 8)

            // Linear mix with clamping
            var mixed = sample1 + sample2
            if (mixed > Short.MAX_VALUE) mixed = Short.MAX_VALUE.toInt()
            if (mixed < Short.MIN_VALUE) mixed = Short.MIN_VALUE.toInt()

            output[i] = (mixed and 0xFF).toByte()
            output[i + 1] = ((mixed shr 8) and 0xFF).toByte()
        }
    }

    fun release() {
        isCapturing = false
        internalAudioRecord?.release()
        micAudioRecord?.release()
    }
}