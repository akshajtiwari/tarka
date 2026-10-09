package expo.modules.tarkaandroid

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.services.FilePermissionService
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

// The few Android things TARKA needs that JavaScript can't do:
// file access for projects in Documents/TARKA (see FilesAccess.kt), and running commands in Termux.
// All the logic lives in JavaScript (src/features/termux); this file only passes things through.

private const val TERMUX = "com.termux"
private const val RUN_COMMAND = "com.termux.permission.RUN_COMMAND"
private const val RESULT_ACTION = "com.akshajtiwari.tarka.TERMUX_RESULT"

class TarkaAndroidModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  // Termux answers through a PendingIntent; each run waits here under its own id.
  private val waiting = ConcurrentHashMap<Int, Promise>()
  private val nextId = AtomicInteger(1)

  private val resultReceiver = object : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
      val promise = waiting.remove(intent.getIntExtra("id", -1)) ?: return
      val result = intent.getBundleExtra("result")
      if (result == null) {
        promise.reject("NO_RESULT", "Termux sent no result", null)
        return
      }
      promise.resolve(
        mapOf(
          "stdout" to (result.getString("stdout") ?: ""),
          "stderr" to (result.getString("stderr") ?: ""),
          "exitCode" to result.getInt("exitCode", -1),
          "err" to result.getInt("err", -1),
          "errmsg" to (result.getString("errmsg") ?: ""),
          "stdoutOriginalLength" to (result.getString("stdout_original_length") ?: ""),
        )
      )
    }
  }

  override fun definition() = ModuleDefinition {
    Name("TarkaAndroid")

    OnCreate {
      appContext.services.register(FilePermissionService::class.java, TarkaFilePermissions(context))
      ContextCompat.registerReceiver(
        context, resultReceiver, IntentFilter(RESULT_ACTION), ContextCompat.RECEIVER_NOT_EXPORTED
      )
    }

    OnDestroy {
      runCatching { context.unregisterReceiver(resultReceiver) }
    }

    // --- Storage ---

    Function("hasAllFilesAccess") { hasFilesAccess(context) }

    // Opens Android's "All files access" switch for TARKA. The user comes back by themselves.
    Function("openAllFilesAccess") {
      val action = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION
      } else {
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS
      }
      val intent = Intent(action, Uri.parse("package:${context.packageName}"))
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    // e.g. /storage/emulated/0/Documents
    Function("documentsPath") { projectsFolder().parentFile!!.absolutePath }

    // --- Termux ---

    Function("isTermuxInstalled") {
      try {
        context.packageManager.getPackageInfo(TERMUX, 0)
        true
      } catch (e: PackageManager.NameNotFoundException) {
        false
      }
    }

    Function("hasTermuxPermission") {
      ContextCompat.checkSelfPermission(context, RUN_COMMAND) == PackageManager.PERMISSION_GRANTED
    }

    AsyncFunction("requestTermuxPermission") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, RUN_COMMAND)
    }

    // Runs Termux's bash with `args`, feeding `stdin`. Resolves when the command has finished.
    AsyncFunction("runInTermux") { args: List<String>, stdin: String?, background: Boolean, promise: Promise ->
      val id = nextId.getAndIncrement()
      val reply = Intent(RESULT_ACTION).setPackage(context.packageName).putExtra("id", id)
      // Mutable, so Termux can add its result; explicit package, so only TARKA receives it.
      val flags = PendingIntent.FLAG_ONE_SHOT or
        (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0)
      val command = Intent("com.termux.RUN_COMMAND")
        .setClassName(TERMUX, "com.termux.app.RunCommandService")
        .putExtra("com.termux.RUN_COMMAND_PATH", "/data/data/com.termux/files/usr/bin/bash")
        .putExtra("com.termux.RUN_COMMAND_ARGUMENTS", args.toTypedArray())
        .putExtra("com.termux.RUN_COMMAND_STDIN", stdin)
        .putExtra("com.termux.RUN_COMMAND_BACKGROUND", background)
        .putExtra("com.termux.RUN_COMMAND_PENDING_INTENT", PendingIntent.getBroadcast(context, id, reply, flags))
      waiting[id] = promise
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(command)
        else context.startService(command)
      } catch (e: SecurityException) {
        waiting.remove(id)
        promise.reject("NO_PERMISSION", e.message ?: "TARKA may not run commands in Termux", e)
      } catch (e: Exception) {
        waiting.remove(id)
        promise.reject("TERMUX_FAILED", e.message ?: "Could not reach Termux", e)
      }
    }
  }
}
